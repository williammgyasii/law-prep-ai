import {
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Flame,
  Target,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { modules, resources, progress, weakAreas, notes } from "@/db/schema";
import { eq, and, asc, desc, not, exists } from "drizzle-orm";
import { MOCK_USER_ID, getProgressPercentage, formatMinutes } from "@/lib/utils";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DynamicIcon } from "@/components/icons";
import { DifficultyBadge } from "@/components/status-badge";

async function getDashboardData() {
  const userId = MOCK_USER_ID;

  const allModules = await db.query.modules.findMany({
    orderBy: [asc(modules.order)],
    with: {
      resources: {
        with: { progress: true },
      },
    },
  });

  const allProgress = await db.query.progress.findMany({
    where: eq(progress.userId, userId),
  });

  const userWeakAreas = await db.query.weakAreas.findMany({
    where: eq(weakAreas.userId, userId),
    with: { module: true },
  });

  const completed = allProgress.filter((p) => p.status === "completed").length;
  const inProgress = allProgress.filter((p) => p.status === "in_progress").length;
  const totalResources = allModules.reduce((acc, m) => acc + m.resources.length, 0);
  const totalTime = allProgress.reduce((acc, p) => acc + p.timeSpentMinutes, 0);

  const completedResourceIds = new Set(
    allProgress.filter((p) => p.status === "completed").map((p) => p.resourceId)
  );

  let nextResource: (typeof allModules)[0]["resources"][0] & { moduleName: string } | null = null;
  for (const mod of allModules) {
    for (const r of mod.resources) {
      if (!completedResourceIds.has(r.id)) {
        nextResource = { ...r, moduleName: mod.title };
        break;
      }
    }
    if (nextResource) break;
  }

  return {
    modules: allModules,
    totalResources,
    completed,
    inProgress,
    totalTime,
    weakAreas: userWeakAreas,
    nextResource,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome back, Sarah</h2>
        <p className="text-muted-foreground mt-1 text-sm">Here&apos;s your LSAT prep overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Resources"
          value={data.totalResources}
          subtitle={`${data.modules.length} modules`}
          icon={BookOpen}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-100/60"
        />
        <StatCard
          title="Completed"
          value={data.completed}
          subtitle={`${getProgressPercentage(data.completed, data.totalResources)}% done`}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-100/60"
        />
        <StatCard
          title="In Progress"
          value={data.inProgress}
          subtitle="Keep going!"
          icon={Clock}
          iconColor="text-blue-600"
          iconBg="bg-blue-100/60"
        />
        <StatCard
          title="Study Time"
          value={formatMinutes(data.totalTime)}
          subtitle="Total tracked"
          icon={TrendingUp}
          iconColor="text-amber-600"
          iconBg="bg-amber-100/60"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Flame className="w-4 h-4 text-primary" />
                  Module Progress
                </CardTitle>
                <CardDescription className="mt-1">Your progress across all study modules</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
                <Link href="/modules">
                  View all
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.modules.map((mod) => {
              const total = mod.resources.length;
              const done = mod.resources.filter((r) =>
                r.progress.some((p) => p.status === "completed")
              ).length;
              const pct = getProgressPercentage(done, total);

              return (
                <Link
                  key={mod.id}
                  href={`/modules/${mod.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-all duration-150 group"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: mod.color + "18", color: mod.color }}
                  >
                    <DynamicIcon name={mod.icon} className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {mod.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground ml-2 tabular-nums">
                        {done}/{total}
                      </span>
                    </div>
                    <ProgressBar value={pct} className="h-1.5" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground w-10 text-right tabular-nums">
                    {pct}%
                  </span>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-5">
          {data.nextResource && (
            <Card className="border-primary/20 bg-linear-to-br from-primary/4 to-transparent overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  Recommended Next
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="font-medium text-sm">{data.nextResource.title}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {data.nextResource.moduleName}
                    </Badge>
                    <DifficultyBadge difficulty={data.nextResource.difficulty} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatMinutes(data.nextResource.estimatedMinutes)} estimated
                  </p>
                  <Button asChild size="sm" className="w-full rounded-xl mt-1">
                    <Link href={`/resources/${data.nextResource.id}`}>
                      Start Learning
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <div className="w-6 h-6 rounded-lg bg-amber-100/60 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                </div>
                Weak Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.weakAreas.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
                  <Target className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-xs text-center">No weak areas tracked yet. Complete some resources to identify areas for improvement.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.weakAreas.slice(0, 3).map((wa) => (
                    <div key={wa.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                        <Target className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{wa.title}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">Confidence:</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  i <= wa.confidenceScore ? "bg-amber-400" : "bg-muted"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button asChild variant="ghost" size="sm" className="w-full text-xs">
                    <Link href="/weak-areas">View All</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
