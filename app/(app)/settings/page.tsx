import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Key, Database, Info, Zap, BarChart3, CreditCard, ArrowRight } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { getPracticeStats, getQuestionCounts } from "@/actions/practice";
import { getCurrentSubscription } from "@/actions/subscription";
import { TIERS } from "@/lib/tiers";
import Link from "next/link";

async function getSettingsData() {
  const sessionUser = await getSessionUser();
  const [user, practiceStats, questionCounts, dbCheck, sub] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, sessionUser.id!) }),
    getPracticeStats(),
    getQuestionCounts(),
    db
      .execute(sql`SELECT 1`)
      .then(() => true)
      .catch(() => false),
    getCurrentSubscription(),
  ]);

  return { user, practiceStats, questionCounts, dbConnected: dbCheck, sub };
}

export default async function SettingsPage() {
  const { user, practiceStats, questionCounts, dbConnected, sub } =
    await getSettingsData();
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  const tierConfig = TIERS[sub.tier];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground mt-1">App configuration and status.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4" />
            Profile
          </CardTitle>
          <CardDescription>Current user information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-sm font-medium">{user?.name || "Unknown"}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{user?.email || "Not set"}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">User ID</span>
            <code className="text-xs bg-muted px-2 py-1 rounded">{user?.id || "N/A"}</code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="w-4 h-4" />
            Subscription
          </CardTitle>
          <CardDescription>Your current plan and billing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plan</span>
            <Badge className={
              sub.tier === "premium"
                ? "bg-violet-100 text-violet-700 border-violet-200"
                : sub.tier === "pro"
                  ? "bg-blue-100 text-blue-700 border-blue-200"
                  : "bg-zinc-100 text-zinc-700 border-zinc-200"
            }>
              {tierConfig.name}
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Price</span>
            <span className="text-sm font-medium">
              {tierConfig.monthlyPrice === 0 ? "Free" : `$${tierConfig.monthlyPrice}/mo`}
            </span>
          </div>
          {sub.subscription && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  {sub.subscription.status}
                </Badge>
              </div>
              {sub.subscription.currentPeriodEnd && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Renews</span>
                    <span className="text-sm font-medium">
                      {new Date(sub.subscription.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  </div>
                </>
              )}
            </>
          )}
          <Separator />
          <Button asChild variant="outline" className="w-full rounded-xl gap-1.5 text-sm">
            <Link href="/pricing">
              {sub.tier === "free" ? "Upgrade Plan" : "Manage Plan"}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {(practiceStats.totalAttempted > 0 || questionCounts.total > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="w-4 h-4" />
              Practice Stats
            </CardTitle>
            <CardDescription>Your LSAT practice performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Questions in database</span>
              <span className="text-sm font-medium tabular-nums">{questionCounts.total}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Questions attempted</span>
              <span className="text-sm font-medium tabular-nums">{practiceStats.totalAttempted}</span>
            </div>
            {practiceStats.totalAttempted > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Overall accuracy</span>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    {practiceStats.accuracy}%
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Recent accuracy (last 20)</span>
                  <span className="text-sm font-medium tabular-nums">{practiceStats.recentAccuracy}%</span>
                </div>
                <Separator />
                <div className="space-y-2 pt-1">
                  <span className="text-sm text-muted-foreground">By section:</span>
                  {Object.entries(practiceStats.bySection).map(([section, data]) => (
                    <div key={section} className="flex items-center justify-between text-sm pl-2">
                      <span className="text-muted-foreground capitalize">
                        {section.replace(/_/g, " ")}
                      </span>
                      <span className="tabular-nums">
                        {data.correct}/{data.attempted}{" "}
                        {data.attempted > 0 && (
                          <span className="text-muted-foreground">({data.accuracy}%)</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="w-4 h-4" />
            AI Configuration
          </CardTitle>
          <CardDescription>OpenAI API integration status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">OpenAI API Key</span>
            {hasApiKey ? (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Connected</Badge>
            ) : (
              <Badge variant="secondary" className="text-amber-700 bg-amber-50 border-amber-200">
                Using Mock Responses
              </Badge>
            )}
          </div>
          {!hasApiKey && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-sm text-amber-800">
                Add <code className="bg-amber-100 px-1 rounded">OPENAI_API_KEY</code> to your{" "}
                <code className="bg-amber-100 px-1 rounded">.env</code> file to enable real AI responses.
                The app works with mock responses in the meantime.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="w-4 h-4" />
            Database
          </CardTitle>
          <CardDescription>PostgreSQL connection status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            {dbConnected ? (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Connected</Badge>
            ) : (
              <Badge variant="destructive">Disconnected</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="w-4 h-4" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">App</span>
            <span className="text-sm font-medium">LawPrep AI</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Purpose</span>
            <span className="text-sm">LSAT Prep Platform</span>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            LawPrep AI helps you prepare for the LSAT with structured learning modules,
            6,400+ real practice questions from public research datasets, timed argumentative
            writing practice, and AI-powered study guidance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
