"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PenLine,
  Clock,
  FileText,
  ChevronRight,
  Star,
  BookOpen,
  BarChart3,
  CalendarDays,
} from "lucide-react";
import { WritingSession } from "@/components/writing-session";
import type { WritingPrompt, WritingAttempt } from "@/db/schema";

interface WritingHubProps {
  prompts: WritingPrompt[];
  stats: {
    totalAttempts: number;
    completedAttempts: number;
    avgWordCount: number;
    totalWritingTimeMinutes: number;
  };
  attempts: (WritingAttempt & { prompt: WritingPrompt })[];
}

export function WritingHub({ prompts, stats, attempts }: WritingHubProps) {
  const [activePrompt, setActivePrompt] = useState<WritingPrompt | null>(null);

  if (activePrompt) {
    return (
      <WritingSession
        prompt={activePrompt}
        onFinish={() => setActivePrompt(null)}
      />
    );
  }

  const completedAttempts = attempts.filter((a) => a.submittedAt !== null);

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats.completedAttempts > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100/60 flex items-center justify-center shrink-0">
                  <PenLine className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{stats.completedAttempts}</p>
                  <p className="text-[11px] text-muted-foreground">Essays Written</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100/60 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{stats.avgWordCount}</p>
                  <p className="text-[11px] text-muted-foreground">Avg Word Count</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-100/60 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{stats.totalWritingTimeMinutes}m</p>
                  <p className="text-[11px] text-muted-foreground">Total Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/60 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{prompts.length}</p>
                  <p className="text-[11px] text-muted-foreground">Available Prompts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Prompt cards */}
      <div>
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
          Choose a Prompt
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prompts.map((prompt) => {
            const promptAttempts = completedAttempts.filter((a) => a.promptId === prompt.id);
            const isOfficial = prompt.source === "lsac_official_sample";
            const perspectives = prompt.perspectives as { label: string; source: string; text: string }[];

            return (
              <Card
                key={prompt.id}
                className="border-border/60 hover:border-violet-300 transition-all group cursor-pointer"
                onClick={() => setActivePrompt(prompt)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base group-hover:text-violet-600 transition-colors">
                        {prompt.title}
                      </h3>
                      {isOfficial && (
                        <Badge className="bg-violet-100 text-violet-700 text-[10px]">
                          <Star className="w-3 h-3 mr-0.5" />
                          Official
                        </Badge>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-violet-600 transition-colors shrink-0 mt-1" />
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                    {prompt.keyQuestion}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {perspectives.length} perspectives
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      50 min
                    </span>
                    {promptAttempts.length > 0 && (
                      <Badge variant="secondary" className="text-[10px]">
                        {promptAttempts.length} attempt{promptAttempts.length !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Past essays */}
      {completedAttempts.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
            Past Essays
          </h3>
          <div className="space-y-2">
            {completedAttempts.slice(0, 10).map((attempt) => (
              <Card key={attempt.id} className="border-border/60">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-100/60 flex items-center justify-center shrink-0">
                    <PenLine className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{attempt.prompt.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {attempt.essay.substring(0, 120)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                    <span className="tabular-nums">{attempt.wordCount} words</span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {attempt.submittedAt
                        ? new Date(attempt.submittedAt).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
