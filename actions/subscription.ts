"use server";

import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { type Tier, TIERS, getUserTier, hasFeature, getLimit, type Feature } from "@/lib/subscription";

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
