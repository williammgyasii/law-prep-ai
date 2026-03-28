"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock, ChevronRight, BookOpen } from "lucide-react";
import type { PracticeQuestion } from "@/db/schema";

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

interface PracticeQuestionCardProps {
  question: PracticeQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (questionId: string, selectedAnswer: string, timeSpent: number) => void;
  onNext: () => void;
  result: { isCorrect: boolean; correctAnswer: string } | null;
}

export function PracticeQuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  onNext,
  result,
}: PracticeQuestionCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (result) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, result]);

  const handleSelect = useCallback(
    (idx: string) => {
      if (result) return;
      setSelected(idx);
    },
    [result]
  );

  const handleSubmit = useCallback(() => {
    if (selected === null) return;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    onAnswer(question.id, selected, timeSpent);
  }, [selected, startTime, question.id, onAnswer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const sectionLabel = {
    logical_reasoning: "Logical Reasoning",
    reading_comprehension: "Reading Comprehension",
    analytical_reasoning: "Analytical Reasoning",
  }[question.sectionType];

  const hasPassage = question.passage && question.passage.length > 30;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-1 pb-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs font-semibold">
            {sectionLabel}
          </Badge>
          {question.prepTestNumber && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              PrepTest {question.prepTestNumber}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="font-semibold tabular-nums">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="flex items-center gap-1.5 tabular-nums font-mono text-xs bg-muted px-2.5 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(elapsed)}
          </span>
        </div>
      </div>

      {/* Main content area - split layout for passages */}
      <div className={cn(
        "flex-1 mt-4",
        hasPassage ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : ""
      )}>
        {/* Passage panel */}
        {hasPassage && (
          <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Passage
              </span>
            </div>
            <div className="flex-1 overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-5 lg:max-h-[calc(100vh-320px)]">
              <p className="text-[13.5px] leading-[1.9] text-foreground/85 whitespace-pre-wrap selection:bg-primary/20">
                {question.passage}
              </p>
            </div>
          </div>
        )}

        {/* Question + answers panel */}
        <div className="flex flex-col min-h-0">
          <div className={cn(
            "flex-1 overflow-y-auto",
            hasPassage && "lg:max-h-[calc(100vh-320px)]"
          )}>
            {/* Question stem */}
            <div className="mb-5">
              <p className="text-[15px] font-semibold leading-relaxed text-foreground">
                {questionNumber}. {question.question}
              </p>
            </div>

            {/* Answer choices */}
            <div className="space-y-2.5">
              {question.options.map((option, idx) => {
                if (!option) return null;
                const idxStr = String(idx);
                const isSelected = selected === idxStr;
                const isCorrectAnswer = result && result.correctAnswer === idxStr;
                const isWrongSelection = result && isSelected && !result.isCorrect;

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idxStr)}
                    disabled={!!result}
                    className={cn(
                      "w-full text-left p-3.5 rounded-xl border-2 transition-all duration-150 flex items-start gap-3 group",
                      !result && !isSelected && "border-border/50 hover:border-primary/40 hover:bg-primary/2",
                      !result && isSelected && "border-primary bg-primary/5 shadow-sm shadow-primary/10",
                      isCorrectAnswer && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
                      isWrongSelection && "border-rose-500 bg-rose-50 dark:bg-rose-950/30",
                      result && !isCorrectAnswer && !isWrongSelection && "border-border/30 opacity-50"
                    )}
                  >
                    <span
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                        !result && !isSelected && "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                        !result && isSelected && "bg-primary text-primary-foreground",
                        isCorrectAnswer && "bg-emerald-500 text-white",
                        isWrongSelection && "bg-rose-500 text-white",
                        result && !isCorrectAnswer && !isWrongSelection && "bg-muted/50 text-muted-foreground/60"
                      )}
                    >
                      {OPTION_LETTERS[idx]}
                    </span>
                    <span className="text-sm leading-relaxed pt-1 flex-1">{option}</span>
                    {isCorrectAnswer && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-1" />
                    )}
                    {isWrongSelection && (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {result && (
              <div className={cn(
                "mt-4 rounded-xl p-4 border",
                result.isCorrect
                  ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                  : "bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800"
              )}>
                <p className={cn(
                  "text-sm font-semibold flex items-center gap-2",
                  result.isCorrect ? "text-emerald-800 dark:text-emerald-300" : "text-rose-800 dark:text-rose-300"
                )}>
                  {result.isCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Correct!
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Incorrect — the correct answer is ({OPTION_LETTERS[Number(result.correctAnswer)]}).
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-border/60">
            {!result && (
              <Button
                onClick={handleSubmit}
                disabled={selected === null}
                className="rounded-xl px-6"
                size="lg"
              >
                Confirm Answer
              </Button>
            )}
            {result && (
              <Button onClick={onNext} className="rounded-xl px-6" size="lg">
                {questionNumber < totalQuestions ? (
                  <>
                    Next Question
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  "View Results"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
