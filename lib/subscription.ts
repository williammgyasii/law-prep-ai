import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export type { Tier, Feature, TierConfig } from "@/lib/tiers";
export {
  TIERS,
  hasFeature,
  getLimit,
  isUnlimited,
  tierAtLeast,
  FEATURE_LABELS,
} from "@/lib/tiers";

import type { Tier } from "@/lib/tiers";

export async function getUserTier(userId: string): Promise<Tier> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { tier: true },
  });
  return (user?.tier as Tier) ?? "free";
}
