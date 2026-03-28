"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Clock,
  PenLine,
  BookOpen,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Lightbulb,
  Send,
  RotateCcw,
} from "lucide-react";
import type { WritingPrompt } from "@/db/schema";
import {
  startWritingAttempt,
  savePrewritingNotes,
  submitEssay,
} from "@/actions/writing";

type Phase = "intro" | "prewriting" | "essay" | "submitted";

const PREWRITING_SECONDS = 15 * 60;
const ESSAY_SECONDS = 35 * 60;
const MIN_PREWRITING_SECONDS = 5 * 60;

interface WritingSessionProps {
  prompt: WritingPrompt;
  onFinish: () => void;
}

export function WritingSession({ prompt, onFinish }: WritingSessionProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [prewritingNotes, setPrewritingNotes] = useState("");
  const [essayText, setEssayText] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalPrewritingTime, setTotalPrewritingTime] = useState(0);
  const [totalEssayTime, setTotalEssayTime] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const wc = essayText.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(wc);
  }, [essayText]);

  const startTimer = useCallback((seconds: number, onTick: (left: number) => void, onExpire: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current);
    let remaining = seconds;
    setTimeLeft(remaining);
    timerRef.current = setInterval(() => {
      remaining--;
      onTick(remaining);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        onExpire();
      }
    }, 1000);
  }, []);

  const handleBegin = useCallback(() => {
    startTransition(async () => {
      const attempt = await startWritingAttempt(prompt.id);
      setAttemptId(attempt.id);
      setPhase("prewriting");
      startTimer(
        PREWRITING_SECONDS,
        (left) => setTotalPrewritingTime(PREWRITING_SECONDS - left),
        () => {
          setTotalPrewritingTime(PREWRITING_SECONDS);
          setPhase("essay");
          startTimer(
            ESSAY_SECONDS,
            (left) => setTotalEssayTime(ESSAY_SECONDS - left),
            () => handleAutoSubmit()
          );
        }
      );
    });
  }, [prompt.id, startTimer]);

  const handleMoveToEssay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (attemptId) {
      startTransition(async () => {
        await savePrewritingNotes(attemptId, prewritingNotes, totalPrewritingTime);
      });
    }
    setPhase("essay");
    startTimer(
      ESSAY_SECONDS,
      (left) => setTotalEssayTime(ESSAY_SECONDS - left),
      () => handleAutoSubmit()
    );
  }, [attemptId, prewritingNotes, totalPrewritingTime, startTimer]);

  const handleAutoSubmit = useCallback(() => {
    // Will be called by timer expiry
  }, []);

  const handleSubmit = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!attemptId) return;
    startTransition(async () => {
      await savePrewritingNotes(attemptId, prewritingNotes, totalPrewritingTime);
      await submitEssay(attemptId, essayText, totalEssayTime);
      setPhase("submitted");
    });
  }, [attemptId, prewritingNotes, essayText, totalPrewritingTime, totalEssayTime]);

  // Auto-submit when essay timer expires
  useEffect(() => {
    if (phase === "essay" && timeLeft <= 0 && attemptId && essayText.length > 0) {
      handleSubmit();
    }
  }, [phase, timeLeft, attemptId, essayText, handleSubmit]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const canAdvanceToEssay = totalPrewritingTime >= MIN_PREWRITING_SECONDS;

  // ─── Intro phase ───
  if (phase === "intro") {
    return (
      <div className="space-y-6">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PenLine className="w-5 h-5 text-violet-600" />
              LSAT Argumentative Writing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {prompt.directions}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl border border-border/60 p-4 text-center">
                <Clock className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                <p className="font-bold text-lg">15 min</p>
                <p className="text-xs text-muted-foreground">Prewriting Analysis</p>
              </div>
              <div className="rounded-xl border border-border/60 p-4 text-center">
                <PenLine className="w-5 h-5 text-violet-600 mx-auto mb-2" />
                <p className="font-bold text-lg">35 min</p>
                <p className="text-xs text-muted-foreground">Essay Writing</p>
              </div>
            </div>

            <Button
              onClick={handleBegin}
              disabled={isPending}
              size="lg"
              className="w-full rounded-xl text-base h-12"
            >
              Begin Prewriting Analysis
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Submitted phase ───
  if (phase === "submitted") {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center space-y-3 pt-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold">Essay Submitted</h2>
          <p className="text-muted-foreground text-sm">
            Your LSAT Writing response has been saved.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <FileText className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold tabular-nums">{wordCount}</p>
              <p className="text-[11px] text-muted-foreground">Words</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <Lightbulb className="w-5 h-5 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold tabular-nums">{formatTime(totalPrewritingTime)}</p>
              <p className="text-[11px] text-muted-foreground">Prewriting</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <PenLine className="w-5 h-5 text-violet-600 mx-auto mb-2" />
              <p className="text-2xl font-bold tabular-nums">{formatTime(totalEssayTime)}</p>
              <p className="text-[11px] text-muted-foreground">Writing</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Your Essay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl bg-muted/30 border border-border/60 p-5 max-h-96 overflow-y-auto">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{essayText}</p>
            </div>
          </CardContent>
        </Card>

        {prewritingNotes && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Your Prewriting Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl bg-muted/30 border border-border/60 p-5 max-h-48 overflow-y-auto">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{prewritingNotes}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center gap-3 pb-8">
          <Button variant="outline" onClick={onFinish} className="rounded-xl">
            <RotateCcw className="w-4 h-4" />
            Back to Prompts
          </Button>
        </div>
      </div>
    );
  }

  // ─── Prewriting / Essay phases ───
  const isPrewriting = phase === "prewriting";
  const timerTotal = isPrewriting ? PREWRITING_SECONDS : ESSAY_SECONDS;
  const timerPct = Math.round((timeLeft / timerTotal) * 100);
  const isLowTime = timeLeft < 120;

  const perspectives = prompt.perspectives as { label: string; source: string; text: string }[];
  const prewritingQs = prompt.prewritingQuestions as { id: string; text: string }[];

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 140px)" }}>
      {/* Timer bar */}
      <div className="flex items-center gap-4 mb-4 sticky top-0 bg-background z-10 pb-2">
        <Badge
          variant="secondary"
          className={cn(
            "text-xs font-semibold px-3 py-1",
            isPrewriting ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"
          )}
        >
          {isPrewriting ? "Prewriting Analysis" : "Essay Writing"}
        </Badge>
        <div className="flex-1">
          <Progress
            value={timerPct}
            className={cn("h-2", isLowTime && "animate-pulse")}
          />
        </div>
        <span className={cn(
          "flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums px-3 py-1 rounded-lg",
          isLowTime ? "bg-rose-100 text-rose-700" : "bg-muted text-foreground"
        )}>
          <Clock className="w-3.5 h-3.5" />
          {formatTime(timeLeft)}
        </span>
        {isPrewriting && (
          <span className="text-[11px] text-muted-foreground">
            {canAdvanceToEssay ? "You can move to essay" : `Wait ${formatTime(MIN_PREWRITING_SECONDS - totalPrewritingTime)}`}
          </span>
        )}
      </div>

      {/* Main content - split layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Prompt content */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Prompt
            </span>
          </div>
          <div className="flex-1 overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-5 lg:max-h-[calc(100vh-260px)] space-y-5">
            {/* Topic */}
            <div>
              <h3 className="font-bold text-base mb-2">{prompt.title}</h3>
              <p className="text-[13.5px] leading-[1.8] text-foreground/85">
                {prompt.topic}
              </p>
            </div>

            {/* Key Question */}
            <div className="rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-violet-600 mb-1">
                Key Question
              </p>
              <p className="text-sm font-semibold text-foreground leading-relaxed">
                {prompt.keyQuestion}
              </p>
            </div>

            {/* Perspectives */}
            {perspectives.map((p, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {p.label}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground italic">
                    {p.source}
                  </span>
                </div>
                <p className="text-[13px] leading-[1.8] text-foreground/80">
                  {p.text}
                </p>
              </div>
            ))}

            {/* Prewriting questions (shown during prewriting phase) */}
            {isPrewriting && prewritingQs.length > 0 && (
              <div className="border-t border-border/60 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-3">
                  Prewriting Questions
                </p>
                <ul className="space-y-2">
                  {prewritingQs.map((q) => (
                    <li key={q.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      {q.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right: Writing area */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isPrewriting ? (
                <Lightbulb className="w-4 h-4 text-amber-500" />
              ) : (
                <PenLine className="w-4 h-4 text-violet-600" />
              )}
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isPrewriting ? "Scratch Paper" : "Your Essay"}
              </span>
            </div>
            {!isPrewriting && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {wordCount} words
              </span>
            )}
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <Textarea
              value={isPrewriting ? prewritingNotes : essayText}
              onChange={(e) =>
                isPrewriting
                  ? setPrewritingNotes(e.target.value)
                  : setEssayText(e.target.value)
              }
              placeholder={
                isPrewriting
                  ? "Use this space to organize your thoughts, make notes, and plan your essay. These notes will be available during writing but won't be submitted."
                  : "Write your argumentative essay here. Take a clear position on the Key Question and address at least one of the perspectives provided."
              }
              className={cn(
                "flex-1 resize-none rounded-xl text-sm leading-relaxed p-5 lg:max-h-[calc(100vh-320px)] min-h-[300px]",
                isPrewriting
                  ? "border-amber-200 focus-visible:ring-amber-500/20"
                  : "border-violet-200 focus-visible:ring-violet-500/20"
              )}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 mt-3 border-t border-border/60">
            {isPrewriting ? (
              <>
                <p className="text-xs text-muted-foreground">
                  {canAdvanceToEssay
                    ? "You can proceed to writing your essay now."
                    : "Spend at least 5 minutes on prewriting before moving on."}
                </p>
                <Button
                  onClick={handleMoveToEssay}
                  disabled={!canAdvanceToEssay || isPending}
                  className="rounded-xl"
                >
                  Move to Essay
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </>
            ) : (
              <>
                {isLowTime && (
                  <p className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Less than 2 minutes remaining
                  </p>
                )}
                {!isLowTime && (
                  <p className="text-xs text-muted-foreground">
                    Your essay will auto-submit when time expires.
                  </p>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={isPending || essayText.trim().length < 10}
                  className="rounded-xl bg-violet-600 hover:bg-violet-700"
                >
                  <Send className="w-4 h-4" />
                  Submit Essay
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
