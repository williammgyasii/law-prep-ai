import Link from "next/link";
import { Plus, ArrowRight, BookOpen } from "lucide-react";
import { db } from "@/db";
import { modules } from "@/db/schema";
import { asc } from "drizzle-orm";
import { getProgressPercentage } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DynamicIcon } from "@/components/icons";
import { EmptyState } from "@/components/empty-state";

async function getModulesData() {
  return db.query.modules.findMany({
    orderBy: [asc(modules.order)],
    with: {
      resources: {
        with: { progress: true },
      },
    },
  });
}

export default async function ModulesPage() {
  const allModules = await getModulesData();

  if (allModules.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No modules yet"
        description="Create your first study module to start organizing your LSAT prep."
      >
        <Button asChild>
          <Link href="/admin">
            <Plus className="w-4 h-4" />
            Create Module
          </Link>
        </Button>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Study Modules</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {allModules.length} modules &middot;{" "}
            {allModules.reduce((a, m) => a + m.resources.length, 0)} resources
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/admin">
            <Plus className="w-4 h-4" />
            Manage
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {allModules.map((mod) => {
          const total = mod.resources.length;
          const done = mod.resources.filter((r) =>
            r.progress.some((p) => p.status === "completed")
          ).length;
          const inProg = mod.resources.filter((r) =>
            r.progress.some((p) => p.status === "in_progress")
          ).length;
          const pct = getProgressPercentage(done, total);

          return (
            <Link key={mod.id} href={`/modules/${mod.id}`} className="group">
              <Card className="h-full border-border/60 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 hover:-translate-y-0.5 overflow-hidden">
                <div
                  className="h-1.5 w-full"
                  style={{ background: `linear-gradient(90deg, ${mod.color}, ${mod.color}88)` }}
                />
                <CardContent className="p-5 pt-4">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: mod.color + "15", color: mod.color }}
                    >
                      <DynamicIcon name={mod.icon} className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h3 className="font-semibold text-[15px] group-hover:text-primary transition-colors mb-1">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{mod.description}</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] font-medium">
                        {total} resources
                      </Badge>
                      {inProg > 0 && (
                        <Badge variant="secondary" className="text-[10px] text-blue-600 bg-blue-50 font-medium">
                          {inProg} active
                        </Badge>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                        <span>{done} of {total} completed</span>
                        <span className="font-bold tabular-nums">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
