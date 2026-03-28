"use client";

import { useState, useCallback, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Brain,
  BookOpen,
  Puzzle,
  Shuffle,
  Zap,
  Loader2,
  FileText,
  PenLine,
} from "lucide-react";
import Link from "next/link";
import { PracticeQuestionCard } from "@/components/practice-question";
import { PracticeResults } from "@/components/practice-results";
import {
  getPracticeQuestions,
  submitAnswer,
  type SectionType,
} from "@/actions/practice";
import type { PracticeQuestion } from "@/db/schema";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import type { Tier } from "@/lib/tiers";

interface AttemptResult {
  questionId: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
  sectionType: string;
  questionText: string;
}

const SECTION_OPTIONS = [
  {
    value: "mixed" as const,
    label: "Mixed",
    description: "All section types",
    icon: Shuffle,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    value: "logical_reasoning" as const,
    label: "Logical Reasoning",
    description: "Arguments & inferences",
    icon: Brain,
    color: "text-cyan-600",
    bg: "bg-cyan-100/60 dark:bg-cyan-900/30",
  },
  {
    value: "reading_comprehension" as const,
    label: "Reading Comp.",
    description: "Passages & analysis",
    icon: BookOpen,
    color: "text-amber-600",
    bg: "bg-amber-100/60 dark:bg-amber-900/30",
  },
  {
    value: "analytical_reasoning" as const,
    label: "Logic Games",
    description: "Games & setups",
    icon: Puzzle,
    color: "text-emerald-600",
    bg: "bg-emerald-100/60 dark:bg-emerald-900/30",
  },
];

const COUNT_OPTIONS = [5, 10, 15, 25, 35];

interface PracticeSessionProps {
  questionCounts: Record<string, number>;
  prepTests: string[];
  initialPrepTest?: string;
  initialSection?: string;
}

type Phase = "setup" | "practice" | "results";

export function PracticeSession({ questionCounts, prepTests, initialPrepTest, initialSection }: PracticeSessionProps) {
  const validSections: (SectionType | "mixed")[] = ["mixed", "logical_reasoning", "reading_comprehension", "analytical_reasoning"];
  const defaultSection = initialSection && validSections.includes(initialSection as SectionType)
    ? (initialSection as SectionType)
    : "mixed";

  const [phase, setPhase] = useState<Phase>("setup");
  const [sectionType, setSectionType] = useState<SectionType | "mixed">(defaultSection);
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedPrepTest, setSelectedPrepTest] = useState<string>(
    initialPrepTest && prepTests.includes(initialPrepTest) ? initialPrepTest : "any"
  );
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [currentResult, setCurrentResult] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const [limitInfo, setLimitInfo] = useState<{
    reached: boolean;
    used: number;
    limit: number;
    tier: string;
  } | null>(null);

  const handleStart = useCallback(() => {
    startTransition(async () => {
      const result = await getPracticeQuestions({
        sectionType,
        prepTest: selectedPrepTest === "any" ? undefined : selectedPrepTest,
        count: questionCount,
      });
      if (result.limitReached) {
        setLimitInfo({
          reached: true,
          used: result.used ?? 0,
          limit: result.limit ?? 0,
          tier: result.tier ?? "free",
        });
        return;
      }
      const qs = result.questions ?? [];
      if (qs.length === 0) return;
      setQuestions(qs);
      setCurrentIdx(0);
      setResults([]);
      setCurrentResult(null);
      setLimitInfo(null);
      setPhase("practice");
    });
  }, [sectionType, questionCount, selectedPrepTest]);

  const handleAnswer = useCallback(
    (questionId: string, selectedAnswer: string, timeSpent: number) => {
      startTransition(async () => {
        const res = await submitAnswer(questionId, selectedAnswer, timeSpent);
        if (!res.success) return;

        setCurrentResult({
          isCorrect: res.isCorrect ?? false,
          correctAnswer: res.correctAnswer ?? "",
        });

        setResults((prev) => [
          ...prev,
          {
            questionId,
            selectedAnswer,
            correctAnswer: res.correctAnswer ?? "",
            isCorrect: res.isCorrect ?? false,
            timeSpent,
            sectionType: questions[currentIdx].sectionType,
            questionText: questions[currentIdx].question,
          },
        ]);
      });
    },
    [questions, currentIdx]
  );

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      setPhase("results");
    } else {
      setCurrentIdx((i) => i + 1);
      setCurrentResult(null);
    }
  }, [currentIdx, questions.length]);

  const handleRetry = useCallback(() => {
    setCurrentIdx(0);
    setResults([]);
    setCurrentResult(null);
    setPhase("practice");
  }, []);

  const handleNewSession = useCallback(() => {
    setPhase("setup");
    setQuestions([]);
    setResults([]);
    setCurrentResult(null);
    setCurrentIdx(0);
  }, []);

  if (phase === "results") {
    return (
      <PracticeResults
        results={results}
        onRetry={handleRetry}
        onNewSession={handleNewSession}
      />
    );
  }

  if (phase === "practice" && questions.length > 0) {
    const progressPct = Math.round(((currentIdx + (currentResult ? 1 : 0)) / questions.length) * 100);
    const correctSoFar = results.filter((r) => r.isCorrect).length;

    return (
      <div className="flex flex-col" style={{ minHeight: "calc(100vh - 180px)" }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <Progress value={progressPct} className="h-2" />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
            <span className="text-emerald-600 font-semibold tabular-nums">{correctSoFar}</span>
            <span>/</span>
            <span className="tabular-nums">{results.length}</span>
            <span>correct</span>
          </div>
        </div>

        <div className="flex-1">
          <PracticeQuestionCard
            key={questions[currentIdx].id}
            question={questions[currentIdx]}
            questionNumber={currentIdx + 1}
            totalQuestions={questions.length}
            onAnswer={handleAnswer}
            onNext={handleNext}
            result={currentResult}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section picker */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Section Type</CardTitle>
          <CardDescription>
            Choose which LSAT section to practice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {SECTION_OPTIONS.map((opt) => {
              const isSelected = sectionType === opt.value;
              const sectionCount =
                opt.value === "mixed"
                  ? questionCounts.total || 0
                  : questionCounts[opt.value] || 0;

              return (
                <button
                  key={opt.value}
                  onClick={() => setSectionType(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/50 hover:border-primary/30"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", opt.bg)}>
                    <opt.icon className={cn("w-5 h-5", opt.color)} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{opt.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {sectionCount.toLocaleString()} questions
                    </p>
                  </div>
                </button>
              );
            })}
            {/* LSAT Writing - essay section */}
            <Link
              href="/writing"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border/50 hover:border-violet-300 text-center transition-all group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-100/60 dark:bg-violet-900/30">
                <PenLine className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Writing</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Timed essay
                </p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* PrepTest filter */}
        {prepTests.length > 0 && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                PrepTest
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedPrepTest} onValueChange={setSelectedPrepTest}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Any PrepTest" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any PrepTest</SelectItem>
                  {prepTests.map((pt) => (
                    <SelectItem key={pt} value={pt}>
                      PrepTest {pt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Question count */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Questions per Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {COUNT_OPTIONS.map((c) => (
                <Button
                  key={c}
                  variant={questionCount === c ? "default" : "outline"}
                  className="rounded-xl flex-1"
                  size="sm"
                  onClick={() => setQuestionCount(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {limitInfo?.reached && (
        <UpgradePrompt
          feature="Daily Practice Limit Reached"
          description={`You've used ${limitInfo.used}/${limitInfo.limit} questions today. Upgrade for unlimited practice.`}
          currentTier={limitInfo.tier as Tier}
          compact
        />
      )}

      <Button
        onClick={handleStart}
        disabled={isPending || (limitInfo?.reached ?? false)}
        size="lg"
        className="w-full rounded-xl text-base h-12"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading Questions...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Start Practice
          </>
        )}
      </Button>
    </div>
  );
}
