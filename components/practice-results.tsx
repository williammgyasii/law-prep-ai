"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Trophy,
  Target,
  Clock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  BarChart3,
  ArrowRight,
} from "lucide-react";

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

interface AttemptResult {
  questionId: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
  sectionType: string;
  questionText: string;
}

interface PracticeResultsProps {
  results: AttemptResult[];
  onRetry: () => void;
  onNewSession: () => void;
}

export function PracticeResults({ results, onRetry, onNewSession }: PracticeResultsProps) {
  const correct = results.filter((r) => r.isCorrect).length;
  const total = results.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const totalTime = results.reduce((acc, r) => acc + r.timeSpent, 0);
  const avgTime = total > 0 ? Math.round(totalTime / total) : 0;

  const bySection: Record<string, { correct: number; total: number }> = {};
  for (const r of results) {
    if (!bySection[r.sectionType]) {
      bySection[r.sectionType] = { correct: 0, total: 0 };
    }
    bySection[r.sectionType].total++;
    if (r.isCorrect) bySection[r.sectionType].correct++;
  }

  const sectionLabels: Record<string, string> = {
    logical_reasoning: "Logical Reasoning",
    reading_comprehension: "Reading Comprehension",
    analytical_reasoning: "Analytical Reasoning",
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const scoreColor = accuracy >= 80 ? "text-emerald-600" : accuracy >= 60 ? "text-amber-600" : "text-rose-600";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-3 pt-4">
        <div className={cn(
          "inline-flex items-center justify-center w-20 h-20 rounded-2xl",
          accuracy >= 80 ? "bg-emerald-100 dark:bg-emerald-950/40" :
          accuracy >= 60 ? "bg-amber-100 dark:bg-amber-950/40" :
          "bg-rose-100 dark:bg-rose-950/40"
        )}>
          <Trophy className={cn("w-10 h-10", scoreColor)} />
        </div>
        <div>
          <h2 className="text-3xl font-bold tabular-nums">{accuracy}%</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {correct} of {total} correct in {formatTime(totalTime)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Target className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className={cn("text-2xl font-bold tabular-nums", scoreColor)}>{accuracy}%</p>
            <p className="text-[11px] text-muted-foreground">Accuracy</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold tabular-nums">
              {correct}<span className="text-base text-muted-foreground">/{total}</span>
            </p>
            <p className="text-[11px] text-muted-foreground">Correct</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold tabular-nums">{formatTime(avgTime)}</p>
            <p className="text-[11px] text-muted-foreground">Avg / Question</p>
          </CardContent>
        </Card>
      </div>

      {Object.keys(bySection).length > 1 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Performance by Section
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(bySection).map(([section, data]) => {
              const pct = Math.round((data.correct / data.total) * 100);
              return (
                <div key={section} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {sectionLabels[section] || section}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {data.correct}/{data.total} ({pct}%)
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Question Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {results.map((r, idx) => (
            <div
              key={r.questionId}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl border",
                r.isCorrect
                  ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                  : "border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/20"
              )}
            >
              <span
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  r.isCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                )}
              >
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2">{r.questionText}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge variant="secondary" className="text-[10px]">
                    {sectionLabels[r.sectionType] || r.sectionType}
                  </Badge>
                  {!r.isCorrect && (
                    <span className="text-[11px] text-muted-foreground">
                      You chose ({OPTION_LETTERS[Number(r.selectedAnswer)]}) — correct was ({OPTION_LETTERS[Number(r.correctAnswer)]})
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground ml-auto tabular-nums">
                    {formatTime(r.timeSpent)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 justify-center pb-8">
        <Button variant="outline" onClick={onRetry} className="rounded-xl">
          <RotateCcw className="w-4 h-4" />
          Retry Same Set
        </Button>
        <Button onClick={onNewSession} className="rounded-xl">
          New Practice Session
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
