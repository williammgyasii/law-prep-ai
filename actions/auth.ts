"use server";

import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import type { Tier } from "@/lib/tiers";

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  tier?: Tier;
}) {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });

  if (existing) {
    return { error: "An account with this email already exists." };
  }

  if (data.password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const selectedTier: Tier = data.tier ?? "free";
  const hashedPassword = await bcrypt.hash(data.password, 12);

  const [newUser] = await db.insert(users).values({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    tier: selectedTier,
  }).returning({ id: users.id });

  // For paid tiers, create a simulated subscription record.
  // TODO: Replace with Stripe checkout session on paid tier selection.
  if (selectedTier !== "free" && newUser) {
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await db.insert(subscriptions).values({
      userId: newUser.id,
      tier: selectedTier,
      status: "active",
      stripeSubscriptionId: `sim_signup_${Date.now()}`,
      stripePriceId: `price_sim_${selectedTier}`,
      stripeCurrentPeriodStart: new Date(),
      stripeCurrentPeriodEnd: periodEnd,
    });
  }

  return { success: true };
}

export async function loginUser(data: { email: string; password: string }) {
  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}
