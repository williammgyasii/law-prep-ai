"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser, loginUser } from "@/actions/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Loader2,
  Zap,
  Sparkles,
  Crown,
  Check,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TIERS, type Tier } from "@/lib/tiers";

const PLAN_OPTIONS: { key: Tier; icon: React.ElementType; color: string; ring: string }[] = [
  { key: "free", icon: Zap, color: "text-zinc-500", ring: "ring-zinc-300" },
  { key: "pro", icon: Sparkles, color: "text-blue-600", ring: "ring-blue-500" },
  { key: "premium", icon: Crown, color: "text-violet-600", ring: "ring-violet-500" },
];

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<"plan" | "details">("plan");
  const [selectedTier, setSelectedTier] = useState<Tier>("free");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const result = await registerUser({ name, email, password, tier: selectedTier });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const loginResult = await loginUser({ email, password });
    if (loginResult.error) {
      router.push("/auth/signin");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-lg border-border/60">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">
              {step === "plan" ? "Choose your plan" : "Create your account"}
            </CardTitle>
            <CardDescription className="mt-1">
              {step === "plan"
                ? "Pick a plan to get started. You can change it anytime."
                : `Signing up for the ${TIERS[selectedTier].name} plan`}
            </CardDescription>
          </div>

          <div className="flex items-center justify-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full transition-colors",
              step === "plan" ? "bg-primary" : "bg-muted-foreground/30"
            )} />
            <div className="w-6 h-px bg-border" />
            <div className={cn(
              "w-2 h-2 rounded-full transition-colors",
              step === "details" ? "bg-primary" : "bg-muted-foreground/30"
            )} />
          </div>
        </CardHeader>

        <CardContent>
          {step === "plan" ? (
            <div className="space-y-4">
              <div className="space-y-2.5">
                {PLAN_OPTIONS.map(({ key, icon: Icon, color, ring }) => {
                  const tier = TIERS[key];
                  const isSelected = selectedTier === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedTier(key)}
                      className={cn(
                        "w-full text-left rounded-xl border p-4 transition-all",
                        isSelected
                          ? `ring-2 ${ring} border-transparent bg-accent/50`
                          : "border-border/60 hover:border-border hover:bg-accent/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          isSelected ? "bg-background shadow-sm" : "bg-muted/60"
                        )}>
                          <Icon className={cn("w-4 h-4", color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{tier.name}</span>
                            {tier.monthlyPrice === 0 ? (
                              <Badge variant="secondary" className="text-[10px]">Free</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">
                                ${tier.monthlyPrice}/mo
                              </Badge>
                            )}
                            {tier.highlighted && (
                              <Badge className="text-[10px] bg-blue-600 text-white border-0">
                                Popular
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{tier.description}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                            {key === "free" && (
                              <>
                                <Perk text={`${tier.limits.practiceQuestionsPerDay} questions/day`} />
                                <Perk text={`${tier.limits.writingPromptsAccess} writing prompts`} />
                                <Perk text={`${tier.limits.modulesAccess} modules`} />
                              </>
                            )}
                            {key === "pro" && (
                              <>
                                <Perk text="Unlimited practice" />
                                <Perk text="All modules" />
                                <Perk text="AI explanations" />
                              </>
                            )}
                            {key === "premium" && (
                              <>
                                <Perk text="Everything in Pro" />
                                <Perk text="AI study plans" />
                                <Perk text="Unlimited docs" />
                              </>
                            )}
                          </div>
                        </div>
                        <div className={cn(
                          "mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30"
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={() => setStep("details")}
                className="w-full rounded-xl gap-1.5"
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>

              {selectedTier !== "free" && (
                <p className="text-[11px] text-center text-muted-foreground">
                  Stripe checkout coming soon &mdash; paid plans are simulated for testing.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setStep("plan")}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Change plan
              </button>

              <div className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border/50 px-3 py-2">
                {(() => {
                  const opt = PLAN_OPTIONS.find(p => p.key === selectedTier)!;
                  const Icon = opt.icon;
                  return <Icon className={cn("w-4 h-4", opt.color)} />;
                })()}
                <span className="text-sm font-medium">{TIERS[selectedTier].name}</span>
                {TIERS[selectedTier].monthlyPrice > 0 && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    ${TIERS[selectedTier].monthlyPrice}/mo
                  </span>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Jane Doe"
                    required
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="rounded-xl"
                  />
                </div>

                <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {selectedTier === "free" ? "Create Account" : `Start ${TIERS[selectedTier].name} Plan`}
                </Button>
              </form>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Perk({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <Check className="w-3 h-3 text-emerald-500" />
      {text}
    </span>
  );
}
