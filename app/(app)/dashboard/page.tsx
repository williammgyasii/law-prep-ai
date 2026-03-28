import {
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  Zap,
  PenLine,
  Brain,
  Puzzle,
  TrendingUp,
  BarChart3,
  Flame,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { modules, resources, progress, weakAreas, users } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getProgressPercentage, formatMinutes } from "@/lib/utils";
import { getSessionUser } from "@/lib/auth";
import { getPracticeStats, getQuestionCounts } from "@/actions/practice";
import { getWritingStats } from "@/actions/writing";
import { Card, CardContent } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DynamicIcon } from "@/components/icons";

async function getDashboardData() {
  const sessionUser = await getSessionUser();
  const userId = sessionUser.id!;

  const [allModules, allProgress, userWeakAreas, user, practiceStats, questionCounts, writingStats] =
    await Promise.all([
      db.query.modules.findMany({
        orderBy: [asc(modules.order)],
        with: { resources: { with: { progress: true } } },
      }),
      db.query.progress.findMany({ where: eq(progress.userId, userId) }),
      db.query.weakAreas.findMany({ where: eq(weakAreas.userId, userId), with: { module: true } }),
      db.query.users.findFirst({ where: eq(users.id, userId) }),
      getPracticeStats(),
      getQuestionCounts(),
      getWritingStats(),
    ]);

  const completed = allProgress.filter((p) => p.status === "completed").length;
  const inProgressCount = allProgress.filter((p) => p.status === "in_progress").length;
  const totalResources = allModules.reduce((acc, m) => acc + m.resources.length, 0);
  const totalTime = allProgress.reduce((acc, p) => acc + p.timeSpentMinutes, 0);

  const moduleCompletionPct = getProgressPercentage(completed, totalResources);
  const practiceAccuracy = practiceStats.accuracy;
  const writingDone = writingStats.completedAttempts > 0;
  const readinessScore = Math.round(
    (moduleCompletionPct * 0.3) + (practiceAccuracy * 0.5) + (writingDone ? 20 : 0)
  );

  return {
    userId,
    userName: user?.name || "there",
    modules: allModules,
    totalResources,
    completed,
    inProgressCount,
    totalTime,
    weakAreas: userWeakAreas,
    practiceStats,
    questionCounts,
    writingStats,
    readinessScore,
    moduleCompletionPct,
  };
}

function ReadinessRing({ score }: { score: number }) {
  const color = score >= 70 ? "text-emerald-500" : score >= 40 ? "text-amber-500" : "text-blue-500";
  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted/20"
        />
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeDasharray={`${score}, 100`} strokeLinecap="round" className={color}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums leading-none">{score}</span>
        <span className="text-[10px] text-muted-foreground mt-0.5">readiness</span>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const d = await getDashboardData();

  const sectionIcons: Record<string, { icon: React.ElementType; color: string }> = {
    logical_reasoning: { icon: Brain, color: "text-cyan-600" },
    reading_comprehension: { icon: BookOpen, color: "text-amber-600" },
    analytical_reasoning: { icon: Puzzle, color: "text-emerald-600" },
  };

  return (
    <div className="space-y-6">
      {/* ── Header row ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Hey, {d.userName}</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Here&apos;s where you stand today.</p>
        </div>
        <Button asChild size="sm" className="rounded-xl gap-1.5">
          <Link href="/practice">
            <Zap className="w-3.5 h-3.5" />
            Quick Practice
          </Link>
        </Button>
      </div>

      {/* ── Top metrics row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Readiness" value={`${d.readinessScore}%`} sub="overall score" accent="text-blue-600" />
        <MetricCard label="Questions" value={d.practiceStats.totalAttempted} sub={`${d.practiceStats.accuracy}% accuracy`} accent="text-emerald-600" />
        <MetricCard label="Modules" value={`${d.completed}/${d.totalResources}`} sub={`${d.moduleCompletionPct}% complete`} accent="text-indigo-600" />
        <MetricCard label="Writing" value={d.writingStats.completedAttempts} sub={d.writingStats.completedAttempts > 0 ? `avg ${d.writingStats.avgWordCount} words` : "essays completed"} accent="text-violet-600" />
      </div>

      {/* ── Main grid: 3 columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ── Left: Readiness + Section breakdown ── */}
        <Card className="lg:col-span-4 border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-5">
              <ReadinessRing score={d.readinessScore} />
              <div className="flex-1 space-y-2.5">
                <ScoreRow label="Modules" value={d.moduleCompletionPct} />
                <ScoreRow label="Practice" value={d.practiceStats.accuracy} />
                <ScoreRow label="Writing" value={d.writingStats.completedAttempts > 0 ? 100 : 0} />
              </div>
            </div>

            <div className="border-t border-border/50 pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">Section Accuracy</p>
              <div className="space-y-2.5">
                {Object.entries(d.practiceStats.bySection).map(([key, sec]) => {
                  const meta = sectionIcons[key];
                  if (!meta) return null;
                  const Icon = meta.icon;
                  return (
                    <div key={key} className="flex items-center gap-2.5">
                      <Icon className={`w-3.5 h-3.5 ${meta.color} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground capitalize truncate">{key.replace(/_/g, " ")}</span>
                          <span className="tabular-nums font-medium">{sec.accuracy}%</span>
                        </div>
                        <ProgressBar value={sec.accuracy} className="h-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Center: Module progress (compact grid) ── */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500" />
              Study Modules
            </h3>
            <Link href="/modules" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {d.modules.map((mod) => {
              const total = mod.resources.length;
              const done = mod.resources.filter((r) =>
                r.progress.some((p) => p.userId === d.userId && p.status === "completed")
              ).length;
              const pct = getProgressPercentage(done, total);

              return (
                <Link key={mod.id} href={`/modules/${mod.id}`} className="group">
                  <Card className="border-border/50 hover:border-primary/30 transition-all h-full">
                    <CardContent className="p-3.5">
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: mod.color + "15", color: mod.color }}
                        >
                          <DynamicIcon name={mod.icon} className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate group-hover:text-primary transition-colors leading-tight">
                            {mod.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground tabular-nums">{done}/{total}</p>
                        </div>
                      </div>
                      <ProgressBar value={pct} className="h-1" />
                      <p className="text-[10px] text-muted-foreground mt-1.5 tabular-nums text-right">{pct}%</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Right: Quick actions column ── */}
        <div className="lg:col-span-3 space-y-3">
          {/* Practice card */}
          <Card className="border-border/50 overflow-hidden">
            <div className="h-1 bg-linear-to-r from-cyan-500 via-blue-500 to-indigo-500" />
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold">Practice</span>
              </div>
              {d.practiceStats.totalAttempted > 0 ? (
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{d.practiceStats.totalAttempted} answered</span>
                    <span className="font-medium text-emerald-600">{d.practiceStats.accuracy}%</span>
                  </div>
                  <ProgressBar value={d.practiceStats.accuracy} className="h-1" />
                  {d.practiceStats.streak > 0 && (
                    <p className="text-[10px] text-amber-600 font-medium">{d.practiceStats.streak} streak</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mb-3">
                  {d.questionCounts.total.toLocaleString()} questions available
                </p>
              )}
              <Button asChild size="sm" className="w-full rounded-lg h-8 text-xs">
                <Link href="/practice">Start Practice</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Writing card */}
          <Card className="border-border/50 overflow-hidden">
            <div className="h-1 bg-linear-to-r from-violet-500 to-purple-500" />
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <PenLine className="w-4 h-4 text-violet-600" />
                <span className="text-sm font-semibold">Writing</span>
              </div>
              {d.writingStats.completedAttempts > 0 ? (
                <div className="space-y-1 mb-3">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{d.writingStats.completedAttempts}</span> essays &middot; avg {d.writingStats.avgWordCount} words
                  </p>
                  <p className="text-[10px] text-muted-foreground">{formatMinutes(d.writingStats.totalWritingTimeMinutes)} total</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mb-3">16 prompts available</p>
              )}
              <Button asChild size="sm" variant="outline" className="w-full rounded-lg h-8 text-xs">
                <Link href="/writing">Practice Writing</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Study time card */}
          <Card className="border-border/50 overflow-hidden">
            <div className="h-1 bg-linear-to-r from-amber-500 to-orange-500" />
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold">Study Time</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">{formatMinutes(d.totalTime)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {d.inProgressCount} resources in progress
              </p>
            </CardContent>
          </Card>

          {/* Weak areas */}
          {d.weakAreas.length > 0 && (
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm font-semibold">Weak Areas</span>
                  <Badge variant="secondary" className="text-[10px]">{d.weakAreas.length}</Badge>
                </div>
                <div className="space-y-2">
                  {d.weakAreas.slice(0, 3).map((wa) => (
                    <div key={wa.id} className="flex items-center gap-2">
                      <div className="flex gap-px">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`w-1 h-3 rounded-sm ${i <= wa.confidenceScore ? "bg-amber-400" : "bg-muted"}`} />
                        ))}
                      </div>
                      <span className="text-xs truncate">{wa.title}</span>
                    </div>
                  ))}
                </div>
                <Button asChild variant="ghost" size="sm" className="w-full mt-2 h-7 text-[11px]">
                  <Link href="/weak-areas">View All</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, accent }: { label: string; value: string | number; sub: string; accent: string }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className={`text-xl font-bold mt-1 tabular-nums ${accent}`}>{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}%</span>
      </div>
      <ProgressBar value={value} className="h-1" />
    </div>
  );
}
