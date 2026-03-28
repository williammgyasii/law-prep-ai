"use server";

import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { type Tier, TIERS, getUserTier, hasFeature, getLimit, type Feature } from "@/lib/subscription";
import { revalidatePath } from "next/cache";

export async function getCurrentSubscription() {
  const user = await getSessionUser();
  const tier = await getUserTier(user.id!);
  const tierConfig = TIERS[tier];

  const sub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, user.id!),
      eq(subscriptions.status, "active")
    ),
    orderBy: [desc(subscriptions.createdAt)],
  });

  return {
    tier,
    tierConfig,
    subscription: sub
      ? {
          id: sub.id,
          status: sub.status,
          currentPeriodEnd: sub.stripeCurrentPeriodEnd,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        }
      : null,
  };
}

export async function changePlan(newTier: Tier): Promise<{ success: boolean; error?: string }> {
  const user = await getSessionUser();
  const currentTier = await getUserTier(user.id!);

  if (currentTier === newTier) {
    return { success: false, error: "You are already on this plan." };
  }

  if (newTier !== "free" && newTier !== "pro" && newTier !== "premium") {
    return { success: false, error: "Invalid plan." };
  }

  // TODO: Replace with Stripe checkout session creation.
  // For now, directly update the user's tier to simulate the flow.
  // When Stripe is integrated:
  //   - "upgrade" -> create Stripe checkout session -> redirect to Stripe
  //   - Stripe webhook -> update user tier + create subscription row
  //   - "downgrade to free" -> cancel Stripe subscription -> webhook updates tier

  await db
    .update(users)
    .set({ tier: newTier, updatedAt: new Date() })
    .where(eq(users.id, user.id!));

  if (newTier !== "free") {
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await db.insert(subscriptions).values({
      userId: user.id!,
      tier: newTier,
      status: "active",
      stripeSubscriptionId: `sim_${Date.now()}`,
      stripePriceId: `price_sim_${newTier}`,
      stripeCurrentPeriodStart: new Date(),
      stripeCurrentPeriodEnd: periodEnd,
    });
  } else {
    await db
      .update(subscriptions)
      .set({ status: "canceled", updatedAt: new Date() })
      .where(
        and(
          eq(subscriptions.userId, user.id!),
          eq(subscriptions.status, "active")
        )
      );
  }

  revalidatePath("/pricing");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/modules");
  revalidatePath("/practice");
  revalidatePath("/writing");
  revalidatePath("/learn");

  return { success: true };
}

export async function checkFeatureAccess(feature: Feature): Promise<{ allowed: boolean; tier: Tier; requiredTier?: Tier }> {
  const user = await getSessionUser();
  const tier = await getUserTier(user.id!);

  if (hasFeature(tier, feature)) {
    return { allowed: true, tier };
  }

  const requiredTier = (["free", "pro", "premium"] as Tier[]).find((t) => hasFeature(t, feature));
  return { allowed: false, tier, requiredTier };
}

export async function checkDailyPracticeLimit(): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  tier: Tier;
}> {
  const user = await getSessionUser();
  const tier = await getUserTier(user.id!);
  const limit = getLimit(tier, "practiceQuestionsPerDay");

  if (limit === -1) {
    return { allowed: true, used: 0, limit: -1, tier };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { questionAttempts } = await import("@/db/schema");
  const { count, gte } = await import("drizzle-orm");

  const [result] = await db
    .select({ count: count() })
    .from(questionAttempts)
    .where(
      and(
        eq(questionAttempts.userId, user.id!),
        gte(questionAttempts.createdAt, today)
      )
    );

  const used = result?.count ?? 0;
  return { allowed: used < limit, used, limit, tier };
}

export async function getWritingPromptsLimit(): Promise<{
  accessCount: number;
  tier: Tier;
}> {
  const user = await getSessionUser();
  const tier = await getUserTier(user.id!);
  const accessCount = getLimit(tier, "writingPromptsAccess");
  return { accessCount, tier };
}
