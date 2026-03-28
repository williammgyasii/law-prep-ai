import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export type Tier = "free" | "pro" | "premium";

export type Feature =
  | "practice_questions"
  | "writing_prompts"
  | "ai_explanations"
  | "ai_study_plans"
  | "detailed_analytics"
  | "weak_area_tracking"
  | "all_modules"
  | "unlimited_practice"
  | "unlimited_writing"
  | "prep_test_filter"
  | "export_results"
  | "learning_hub"
  | "unlimited_documents";

export interface TierConfig {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  features: Feature[];
  limits: {
    practiceQuestionsPerDay: number;
    writingPromptsAccess: number;
    modulesAccess: number;
    documentsTotal: number;
    aiMessagesPerDoc: number;
  };
  badge: string;
  highlighted: boolean;
}

export const TIERS: Record<Tier, TierConfig> = {
  free: {
    name: "Starter",
    description: "Get started with LSAT prep basics",
    monthlyPrice: 0,
    yearlyPrice: 0,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    features: [
      "practice_questions",
      "writing_prompts",
      "weak_area_tracking",
      "learning_hub",
    ],
    limits: {
      practiceQuestionsPerDay: 10,
      writingPromptsAccess: 3,
      modulesAccess: 2,
      documentsTotal: 3,
      aiMessagesPerDoc: 5,
    },
    badge: "Free",
    highlighted: false,
  },
  pro: {
    name: "Pro",
    description: "Serious prep for serious test-takers",
    monthlyPrice: 19,
    yearlyPrice: 190,
    stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
    stripePriceIdYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "",
    features: [
      "practice_questions",
      "writing_prompts",
      "ai_explanations",
      "weak_area_tracking",
      "all_modules",
      "unlimited_practice",
      "prep_test_filter",
      "detailed_analytics",
      "learning_hub",
    ],
    limits: {
      practiceQuestionsPerDay: -1,
      writingPromptsAccess: 8,
      modulesAccess: -1,
      documentsTotal: 25,
      aiMessagesPerDoc: 50,
    },
    badge: "Popular",
    highlighted: true,
  },
  premium: {
    name: "Premium",
    description: "The complete LSAT mastery toolkit",
    monthlyPrice: 39,
    yearlyPrice: 390,
    stripePriceIdMonthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID ?? "",
    stripePriceIdYearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID ?? "",
    features: [
      "practice_questions",
      "writing_prompts",
      "ai_explanations",
      "ai_study_plans",
      "weak_area_tracking",
      "all_modules",
      "unlimited_practice",
      "unlimited_writing",
      "prep_test_filter",
      "detailed_analytics",
      "export_results",
      "learning_hub",
      "unlimited_documents",
    ],
    limits: {
      practiceQuestionsPerDay: -1,
      writingPromptsAccess: -1,
      modulesAccess: -1,
      documentsTotal: -1,
      aiMessagesPerDoc: -1,
    },
    badge: "Best Value",
    highlighted: false,
  },
};

const TIER_ORDER: Tier[] = ["free", "pro", "premium"];

export function hasFeature(tier: Tier, feature: Feature): boolean {
  return TIERS[tier].features.includes(feature);
}

export function getLimit(tier: Tier, key: keyof TierConfig["limits"]): number {
  return TIERS[tier].limits[key];
}

export function isUnlimited(tier: Tier, key: keyof TierConfig["limits"]): boolean {
  return TIERS[tier].limits[key] === -1;
}

export function tierAtLeast(userTier: Tier, requiredTier: Tier): boolean {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(requiredTier);
}

export async function getUserTier(userId: string): Promise<Tier> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { tier: true },
  });
  return (user?.tier as Tier) ?? "free";
}

export const FEATURE_LABELS: Record<Feature, string> = {
  practice_questions: "Practice Questions",
  writing_prompts: "Writing Prompts",
  ai_explanations: "AI Explanations",
  ai_study_plans: "AI Study Plans",
  detailed_analytics: "Detailed Analytics",
  weak_area_tracking: "Weak Area Tracking",
  all_modules: "All Study Modules",
  unlimited_practice: "Unlimited Practice",
  unlimited_writing: "Unlimited Writing",
  prep_test_filter: "PrepTest Filtering",
  export_results: "Export Results",
  learning_hub: "Learning Hub",
  unlimited_documents: "Unlimited Documents",
};
