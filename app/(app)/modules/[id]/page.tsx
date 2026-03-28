import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Clock, StickyNote, Sparkles, BookOpen, ChevronRight } from "lucide-react";
import { db } from "@/db";
import { modules, resources } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { formatMinutes, getProgressPercentage } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DynamicIcon } from "@/components/icons";
import { StatusBadge, DifficultyBadge, TypeBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";

async function getModuleData(id: string) {
  return db.query.modules.findFirst({
    where: eq(modules.id, id),
    with: {
      resources: {
        orderBy: [asc(resources.order)],
        with: {
          progress: true,
          notes: true,
        },
      },
    },
  });
}

export default async function ModuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mod = await getModuleData(id);

  if (!mod) notFound();

  const total = mod.resources.length;
  const done = mod.resources.filter((r) => r.progress.some((p) => p.status === "completed")).length;
  const pct = getProgressPercentage(done, total);

  return (
    <div className="space-y-6">
      {/* Header with gradient accent */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ background: `linear-gradient(135deg, ${mod.color}, transparent 60%)` }}
        />
        <div className="relative flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="rounded-xl shrink-0">
            <Link href="/modules">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: mod.color + "18", color: mod.color }}
          >
            <DynamicIcon name={mod.icon} className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold tracking-tight">{mod.title}</h2>
            <p className="text-muted-foreground text-sm mt-0.5 line-clamp-1">{mod.description}</p>
          </div>
        </div>
        <div className="relative mt-5 ml-[92px]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground font-medium">{done} of {total} resources completed</span>
            <span className="font-bold tabular-nums" style={{ color: mod.color }}>{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>
      </div>

      {mod.resources.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No resources yet"
          description="Add resources to this module from the admin area."
        >
          <Button asChild>
            <Link href="/admin">Add Resources</Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {mod.resources.map((resource, index) => {
            const status = resource.progress[0]?.status || "not_started";
            const hasNotes = resource.notes.length > 0 && resource.notes[0].content.length > 0;

            return (
              <Link key={resource.id} href={`/resources/${resource.id}`} className="block group">
                <Card className="border-border/60 hover:shadow-md hover:shadow-primary/5 transition-all duration-150 hover:border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {resource.imageUrl ? (
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-muted">
                          <Image
                            src={resource.imageUrl}
                            alt={resource.title}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-muted-foreground/50">{index + 1}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">
                          {resource.title}
                        </h3>
                        {resource.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 mb-2">
                            {resource.description}
                          </p>
                        )}
                        <div className="flex items-center flex-wrap gap-1.5">
                          <StatusBadge status={status} />
                          <TypeBadge type={resource.type} />
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatMinutes(resource.estimatedMinutes)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasNotes && (
                          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                            <StickyNote className="w-3.5 h-3.5 text-amber-600" />
                          </div>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
