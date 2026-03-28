import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Clock, ListOrdered, ChevronRight, ChevronLeft, Play, MonitorPlay } from "lucide-react";
import { db } from "@/db";
import { resources, notes } from "@/db/schema";
import { eq, and, gt, lt, asc, desc } from "drizzle-orm";
import { MOCK_USER_ID, formatMinutes } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge, TypeBadge, StatusBadge } from "@/components/status-badge";
import { ResourceProgressControls } from "@/components/resource-progress-controls";
import { AISidebar } from "@/components/ai-sidebar";
import { AutoProgress } from "@/components/auto-progress";
import { LawHubEmbed } from "@/components/lawhub-embed";

async function getResourceData(id: string) {
  return db.query.resources.findFirst({
    where: eq(resources.id, id),
    with: {
      module: true,
      progress: true,
    },
  });
}

async function getNotesForResource(resourceId: string) {
  return db.query.notes.findMany({
    where: and(eq(notes.userId, MOCK_USER_ID), eq(notes.resourceId, resourceId)),
    orderBy: [desc(notes.updatedAt)],
  });
}

async function getAdjacentResources(moduleId: string, currentOrder: number) {
  const [prev, next] = await Promise.all([
    db.query.resources.findFirst({
      where: and(eq(resources.moduleId, moduleId), lt(resources.order, currentOrder)),
      orderBy: [desc(resources.order)],
      columns: { id: true, title: true },
    }),
    db.query.resources.findFirst({
      where: and(eq(resources.moduleId, moduleId), gt(resources.order, currentOrder)),
      orderBy: [asc(resources.order)],
      columns: { id: true, title: true },
    }),
  ]);
  return { prev, next };
}

function ArticleContent({ content }: { content: string }) {
  return (
    <div className="space-y-1">
      {content.split("\n").map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-3" />;
        if (trimmed.startsWith("# "))
          return <h2 key={i} className="text-xl font-bold mt-8 mb-3 first:mt-0">{trimmed.slice(2)}</h2>;
        if (trimmed.startsWith("## "))
          return <h3 key={i} className="text-lg font-semibold mt-6 mb-2">{trimmed.slice(3)}</h3>;
        if (trimmed.startsWith("### "))
          return <h4 key={i} className="text-sm font-semibold mt-5 mb-1.5 uppercase tracking-wide text-muted-foreground">{trimmed.slice(4)}</h4>;
        if (trimmed.startsWith("- "))
          return <li key={i} className="ml-5 text-[15px] leading-relaxed text-foreground/80 list-disc">{trimmed.slice(2)}</li>;
        return <p key={i} className="text-[15px] leading-[1.8] text-foreground/80">{trimmed}</p>;
      })}
    </div>
  );
}

function LessonContent({ content }: { content: string }) {
  return (
    <div className="space-y-4">
      {content.split("\n").map((para, i) => {
        const trimmed = para.trim();
        if (!trimmed) return <div key={i} className="h-2" />;
        return (
          <p key={i} className="text-[15px] leading-[1.8] text-foreground/80">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = await getResourceData(id);

  if (!resource) notFound();

  const userProgress = resource.progress.find((p) => p.userId === MOCK_USER_ID);
  const status = userProgress?.status || "not_started";
  const [userNotes, { prev: prevResource, next: nextResource }] = await Promise.all([
    getNotesForResource(id),
    getAdjacentResources(resource.moduleId, resource.order),
  ]);

  const notesData = userNotes.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    updatedAt: n.updatedAt,
  }));

  return (
    <div className="flex -m-6 min-h-[calc(100vh-3.5rem)]">
      {/* Auto-progress tracker */}
      <AutoProgress resourceId={resource.id} currentStatus={status} />

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-3">
            <Button asChild variant="ghost" size="icon" className="mt-0.5 rounded-xl shrink-0">
              <Link href={`/modules/${resource.moduleId}`}>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Link href={`/modules/${resource.moduleId}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  {resource.module.title}
                </Link>
                <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground truncate">{resource.title}</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">{resource.title}</h2>
              {resource.description && (
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{resource.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <TypeBadge type={resource.type} />
                <DifficultyBadge difficulty={resource.difficulty} />
                <StatusBadge status={status} />
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatMinutes(resource.estimatedMinutes)}
                </span>
                {resource.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    {resource.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress + external link bar */}
          <Card className="border-border/60">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
              <ResourceProgressControls resourceId={resource.id} currentStatus={status} />
              {resource.url && (
                <Button asChild variant="outline" size="sm" className="rounded-xl">
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5" />
                    {resource.type === "video" ? "Watch on LawHub" : "Open on LawHub"}
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* LawHub embed for video/multimedia lessons */}
          {resource.url && resource.url.includes("lawhublearning.lsac.org") && (
            <LawHubEmbed url={resource.url} title={resource.title} type={resource.type} />
          )}

          {/* Article content */}
          {resource.content && resource.type === "article" && (
            <Card className="border-border/60">
              <CardContent className="p-6 sm:p-8">
                <ArticleContent content={resource.content} />
              </CardContent>
            </Card>
          )}

          {/* Lesson overview (description text for course lessons) */}
          {resource.content && (resource.type === "lesson" || resource.type === "video" || resource.type === "drill") && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-primary" />
                  Lesson Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LessonContent content={resource.content} />
              </CardContent>
            </Card>
          )}

          {/* Prev / Next navigation */}
          <div className="flex items-center gap-3">
            {prevResource ? (
              <Link href={`/resources/${prevResource.id}`} className="flex-1 group">
                <Card className="border-border/60 hover:border-primary/20 transition-all">
                  <CardContent className="p-4 flex items-center gap-3">
                    <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Previous</p>
                      <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{prevResource.title}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
            {nextResource ? (
              <Link href={`/resources/${nextResource.id}`} className="flex-1 group">
                <Card className="border-primary/20 bg-primary/3 hover:bg-primary/5 transition-all">
                  <CardContent className="p-4 flex items-center justify-end gap-3">
                    <div className="min-w-0 text-right">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Next up</p>
                      <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{nextResource.title}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-primary shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>
      </div>

      {/* Right sidebar: AI chat + notes */}
      <AISidebar
        resourceId={resource.id}
        title={resource.title}
        type={resource.type}
        initialNotes={notesData}
        tags={resource.tags}
      />
    </div>
  );
}
