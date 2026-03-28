import {
  GraduationCap,
  ExternalLink,
  FileText,
  Brain,
  BookOpen,
  Puzzle,
  PenLine,
  Zap,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { getQuestionCounts, getAvailablePrepTests, getPracticeStats } from "@/actions/practice";
import { db } from "@/db";
import { practiceQuestions, questionAttempts } from "@/db/schema";
import { eq, and, count, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

const SECTION_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  logical_reasoning: { label: "Logical Reasoning", icon: Brain, color: "text-cyan-600", bg: "bg-cyan-100/60" },
  reading_comprehension: { label: "Reading Comprehension", icon: BookOpen, color: "text-amber-600", bg: "bg-amber-100/60" },
  analytical_reasoning: { label: "Analytical Reasoning", icon: Puzzle, color: "text-emerald-600", bg: "bg-emerald-100/60" },
};

async function getPrepTestDetails(prepTests: string[], userId: string) {
  const details: {
    number: string;
    totalQuestions: number;
    sections: Record<string, number>;
    attempted: number;
    correct: number;
  }[] = [];

  for (const pt of prepTests) {
    const sectionCounts = await db
      .select({ sectionType: practiceQuestions.sectionType, count: count() })
      .from(practiceQuestions)
      .where(eq(practiceQuestions.prepTestNumber, pt))
      .groupBy(practiceQuestions.sectionType);

    const totalQuestions = sectionCounts.reduce((sum, s) => sum + s.count, 0);
    const sections: Record<string, number> = {};
    for (const s of sectionCounts) {
      sections[s.sectionType] = s.count;
    }

    const attemptData = await db
      .select({
        total: count(),
        correct: sql<number>`SUM(CASE WHEN ${questionAttempts.isCorrect} = 1 THEN 1 ELSE 0 END)`,
      })
      .from(questionAttempts)
      .innerJoin(practiceQuestions, eq(questionAttempts.questionId, practiceQuestions.id))
      .where(
        and(
          eq(questionAttempts.userId, userId),
          eq(practiceQuestions.prepTestNumber, pt)
        )
      );

    details.push({
      number: pt,
      totalQuestions,
      sections,
      attempted: attemptData[0]?.total ?? 0,
      correct: Number(attemptData[0]?.correct ?? 0),
    });
  }

  return details;
}

function PrepTestCard({ pt }: { pt: { number: string; totalQuestions: number; sections: Record<string, number>; attempted: number; correct: number } }) {
  const progressPct = pt.totalQuestions > 0 ? Math.round((pt.attempted / pt.totalQuestions) * 100) : 0;
  const accuracy = pt.attempted > 0 ? Math.round((pt.correct / pt.attempted) * 100) : null;

  return (
    <Card className="border-border/60 hover:border-primary/30 transition-all group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-base">PrepTest {pt.number}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pt.totalQuestions} questions
            </p>
          </div>
          {accuracy !== null && (
            <Badge
              variant="secondary"
              className={
                accuracy >= 70
                  ? "text-emerald-700 bg-emerald-50"
                  : accuracy >= 50
                    ? "text-amber-700 bg-amber-50"
                    : "text-rose-700 bg-rose-50"
              }
            >
              {accuracy}%
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {Object.entries(pt.sections).map(([section, sectionCount]) => {
            const meta = SECTION_META[section];
            if (!meta) return null;
            const Icon = meta.icon;
            return (
              <div key={section} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Icon className={`w-3 h-3 ${meta.color}`} />
                <span>{sectionCount}</span>
              </div>
            );
          })}
        </div>

        {pt.attempted > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span>{pt.attempted} / {pt.totalQuestions} attempted</span>
              <span>{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-1.5" />
          </div>
        )}

        <Button asChild size="sm" variant={pt.attempted > 0 ? "outline" : "default"} className="w-full rounded-xl">
          <Link href={`/practice?pt=${pt.number}`}>
            <Zap className="w-3.5 h-3.5" />
            {pt.attempted > 0 ? "Continue" : "Start"} Practice
            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default async function LSATPrepPage() {
  const [counts, prepTests, stats] = await Promise.all([
    getQuestionCounts(),
    getAvailablePrepTests(),
    getPracticeStats(),
  ]);

  const user = await getSessionUser();
  const prepTestDetails = await getPrepTestDetails(prepTests, user.id!);

  const totalAttempted = stats.totalAttempted;
  const overallAccuracy = stats.accuracy;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            LSAT Prep Library
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {counts.total.toLocaleString()} questions across {prepTests.length} official PrepTests
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <a
            href="https://app.lawhub.org/library"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="w-4 h-4" />
            Open LawHub
          </a>
        </Button>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{prepTests.length}</p>
                <p className="text-[11px] text-muted-foreground">PrepTests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-100/60 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{(counts.logical_reasoning || 0).toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground">Logical Reasoning</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100/60 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{(counts.reading_comprehension || 0).toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground">Reading Comp.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/60 flex items-center justify-center shrink-0">
                <Puzzle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{(counts.analytical_reasoning || 0).toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground">Logic Games</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {totalAttempted > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-2xl font-bold tabular-nums">{totalAttempted}</p>
                <p className="text-xs text-muted-foreground">Questions Attempted</p>
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{overallAccuracy}%</p>
                <p className="text-xs text-muted-foreground">Overall Accuracy</p>
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {Math.round((totalAttempted / counts.total) * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">Questions Covered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="preptests">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="preptests" className="gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            PrepTests
            <Badge variant="secondary" className="text-[10px] ml-1">
              {prepTests.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="sections" className="gap-1.5">
            <Brain className="w-3.5 h-3.5" />
            By Section
          </TabsTrigger>
          <TabsTrigger value="writing" className="gap-1.5">
            <PenLine className="w-3.5 h-3.5" />
            LSAT Writing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preptests" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {prepTestDetails.map((pt) => (
              <PrepTestCard key={pt.number} pt={pt} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sections" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(SECTION_META).map(([key, meta]) => {
              const Icon = meta.icon;
              const sectionCount = counts[key] || 0;
              const sectionStats = stats.bySection[key];
              const attempted = sectionStats?.attempted ?? 0;
              const accuracy = sectionStats?.accuracy ?? 0;

              return (
                <Card key={key} className="border-border/60">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${meta.bg}`}>
                        <Icon className={`w-6 h-6 ${meta.color}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">{meta.label}</h3>
                        <p className="text-xs text-muted-foreground">
                          {sectionCount.toLocaleString()} questions
                        </p>
                      </div>
                    </div>

                    {attempted > 0 && (
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{attempted} attempted</span>
                          <span>{accuracy}% accuracy</span>
                        </div>
                        <Progress value={accuracy} className="h-1.5" />
                      </div>
                    )}

                    <Button asChild size="sm" className="w-full rounded-xl">
                      <Link href={`/practice?section=${key}`}>
                        <Zap className="w-3.5 h-3.5" />
                        Practice {meta.label}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="writing" className="mt-4">
          <Card className="border-border/60">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-violet-100/60 flex items-center justify-center shrink-0">
                  <PenLine className="w-7 h-7 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">LSAT Argumentative Writing</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    The LSAT Writing section is a 50-minute timed exercise where you receive a debatable
                    issue with 3-4 perspectives and must write an argumentative essay taking a position.
                    It&apos;s administered separately from the multiple-choice sections.
                  </p>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-border/60 p-4">
                      <h4 className="font-semibold text-sm mb-2">Format</h4>
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                          <strong className="text-foreground/80">15 minutes</strong> for prewriting analysis with guided questions and digital scratch paper
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                          <strong className="text-foreground/80">35 minutes</strong> to write your argumentative essay
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                          You must take a position and address at least one of the provided perspectives
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                          Law schools receive your essay along with your LSAT score
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-xl border border-border/60 p-4">
                      <h4 className="font-semibold text-sm mb-2">A strong response will</h4>
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          Clearly state the thesis of your argument
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          Develop your thesis with specific examples and clear reasoning
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          Address complexities and potential counterarguments
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          Organize ideas clearly and use effectively chosen language
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button asChild className="rounded-xl bg-violet-600 hover:bg-violet-700">
                      <Link href="/writing">
                        <PenLine className="w-4 h-4" />
                        Practice Writing
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-xl">
                      <a
                        href="https://www.lsac.org/lsat-argumentative-writing-example"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Official LSAC Sample
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
