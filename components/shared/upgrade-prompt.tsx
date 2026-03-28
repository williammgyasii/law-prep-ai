"use client";

import Link from "next/link";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TIERS, type Tier } from "@/lib/tiers";
import { cn } from "@/lib/utils";

interface UpgradePromptProps {
  feature: string;
  description?: string;
  currentTier: Tier;
  requiredTier?: Tier;
  compact?: boolean;
  className?: string;
}

export function UpgradePrompt({
  feature,
  description,
  currentTier,
  requiredTier,
  compact = false,
  className,
}: UpgradePromptProps) {
  const targetTier = requiredTier || (currentTier === "free" ? "pro" : "premium");
  const tierConfig = TIERS[targetTier];

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3 rounded-xl bg-muted/50 border border-border/50 px-4 py-3", className)}>
        <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{feature}</p>
          {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
        </div>
        <Button asChild size="sm" variant="outline" className="rounded-lg shrink-0 text-xs gap-1">
          <Link href="/pricing">
            Upgrade
            <ArrowRight className="w-3 h-3" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn("border-border/50 overflow-hidden", className)}>
      <div className="h-1 bg-linear-to-r from-blue-500 to-violet-500" />
      <CardContent className="p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-base font-semibold mb-1">{feature}</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
          {description || `This feature is available on the ${tierConfig.name} plan and above.`}
        </p>
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl font-bold">${tierConfig.monthlyPrice}</span>
          <span className="text-sm text-muted-foreground">/month</span>
        </div>
        <Button asChild className="rounded-xl gap-1.5">
          <Link href="/pricing">
            Upgrade to {tierConfig.name}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

interface UpgradeOverlayProps {
  feature: string;
  currentTier: Tier;
  requiredTier?: Tier;
}

export function UpgradeOverlay({ feature, currentTier, requiredTier }: UpgradeOverlayProps) {
  const targetTier = requiredTier || (currentTier === "free" ? "pro" : "premium");
  const tierConfig = TIERS[targetTier];

  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
      <div className="text-center p-6 max-w-xs">
        <Lock className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm font-semibold mb-1">{feature}</p>
        <p className="text-xs text-muted-foreground mb-3">
          Available on {tierConfig.name} plan
        </p>
        <Button asChild size="sm" className="rounded-xl gap-1">
          <Link href="/pricing">
            Upgrade
            <ArrowRight className="w-3 h-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
