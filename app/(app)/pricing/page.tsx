"use client";

import { useState } from "react";
import { Check, X, Sparkles, Crown, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  TIERS,
  FEATURE_LABELS,
  type Tier,
  type Feature,
} from "@/lib/subscription";

const TIER_KEYS: Tier[] = ["free", "pro", "premium"];

const TIER_ICONS: Record<Tier, React.ElementType> = {
  free: Zap,
  pro: Sparkles,
  premium: Crown,
};

const TIER_COLORS: Record<Tier, { border: string; accent: string; bg: string; button: string }> = {
  free: {
    border: "border-border/50",
    accent: "text-muted-foreground",
    bg: "",
    button: "bg-muted text-foreground hover:bg-muted/80",
  },
  pro: {
    border: "border-blue-500/40 shadow-blue-500/5 shadow-lg",
    accent: "text-blue-600",
    bg: "bg-blue-500/[0.02]",
    button: "bg-blue-600 text-white hover:bg-blue-700",
  },
  premium: {
    border: "border-violet-500/30",
    accent: "text-violet-600",
    bg: "",
    button: "bg-violet-600 text-white hover:bg-violet-700",
  },
};

const ALL_FEATURES: Feature[] = [
  "practice_questions",
  "writing_prompts",
  "all_modules",
  "unlimited_practice",
  "unlimited_writing",
  "ai_explanations",
  "ai_study_plans",
  "weak_area_tracking",
  "detailed_analytics",
  "prep_test_filter",
  "export_results",
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Choose Your Plan</h2>
        <p className="text-muted-foreground mt-1.5 text-sm max-w-md mx-auto">
          Unlock more practice questions, AI-powered insights, and the full LSAT prep toolkit.
        </p>

        <div className="inline-flex items-center gap-1 mt-5 p-1 rounded-xl bg-muted/60 border border-border/50">
          <button
            onClick={() => setBilling("monthly")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              billing === "monthly"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              billing === "yearly"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Yearly
            <Badge variant="secondary" className="ml-1.5 text-[10px] bg-emerald-100 text-emerald-700 border-0">
              Save 17%
            </Badge>
          </button>
        </div>
      </div>

      {/* ── Tier cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIER_KEYS.map((key) => {
          const tier = TIERS[key];
          const colors = TIER_COLORS[key];
          const Icon = TIER_ICONS[key];
          const price = billing === "monthly" ? tier.monthlyPrice : Math.round(tier.yearlyPrice / 12);
          const totalYearly = tier.yearlyPrice;

          return (
            <Card
              key={key}
              className={cn(
                "relative overflow-hidden transition-all",
                colors.border,
                colors.bg,
                tier.highlighted && "scale-[1.02]"
              )}
            >
              {tier.highlighted && (
                <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-blue-500 to-cyan-400" />
              )}
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn("w-4.5 h-4.5", colors.accent)} />
                  <span className="text-sm font-semibold">{tier.name}</span>
                  {tier.highlighted && (
                    <Badge className="text-[10px] bg-blue-600 text-white border-0 ml-auto">
                      {tier.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-4">{tier.description}</p>

                <div className="mb-5">
                  {tier.monthlyPrice === 0 ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">Free</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${price}</span>
                      <span className="text-sm text-muted-foreground">/mo</span>
                    </div>
                  )}
                  {billing === "yearly" && tier.yearlyPrice > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      ${totalYearly}/year &middot; billed annually
                    </p>
                  )}
                </div>

                <Button
                  className={cn("w-full rounded-xl h-10 text-sm font-medium", colors.button)}
                  disabled={key === "free"}
                >
                  {key === "free" ? "Current Plan" : `Upgrade to ${tier.name}`}
                </Button>

                <div className="mt-5 pt-5 border-t border-border/50">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    What&apos;s included
                  </p>
                  <div className="space-y-2.5">
                    {ALL_FEATURES.map((feature) => {
                      const has = tier.features.includes(feature);
                      return (
                        <div key={feature} className="flex items-center gap-2.5">
                          {has ? (
                            <Check className={cn("w-3.5 h-3.5 shrink-0", colors.accent)} />
                          ) : (
                            <X className="w-3.5 h-3.5 shrink-0 text-muted-foreground/30" />
                          )}
                          <span className={cn("text-xs", has ? "text-foreground" : "text-muted-foreground/50")}>
                            {FEATURE_LABELS[feature]}
                            {feature === "practice_questions" && !tier.features.includes("unlimited_practice") && (
                              <span className="text-muted-foreground ml-1">({tier.limits.practiceQuestionsPerDay}/day)</span>
                            )}
                            {feature === "writing_prompts" && !tier.features.includes("unlimited_writing") && (
                              <span className="text-muted-foreground ml-1">({tier.limits.writingPromptsAccess} prompts)</span>
                            )}
                            {feature === "all_modules" && !has && (
                              <span className="text-muted-foreground ml-1">({tier.limits.modulesAccess} modules)</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── FAQ-style note ── */}
      <div className="mt-8 text-center">
        <p className="text-xs text-muted-foreground">
          All plans include access to real LSAT practice questions from official PrepTests.
          <br />
          Upgrade or downgrade at any time. Cancel anytime with no questions asked.
        </p>
      </div>
    </div>
  );
}
