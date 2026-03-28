import { Zap } from "lucide-react";
import { getQuestionCounts, getPracticeStats, getAvailablePrepTests } from "@/actions/practice";
import { PracticeSession } from "@/components/practice-session";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PracticePageProps {
  searchParams: Promise<{ pt?: string; section?: string }>;
}

export default async function PracticePage({ searchParams }: PracticePageProps) {
  const params = await searchParams;
  const [counts, stats, prepTests] = await Promise.all([
    getQuestionCounts(),
    getPracticeStats(),
    getAvailablePrepTests(),
  ]);

  const hasQuestions = counts.total > 0;
  const ptRange = prepTests.length > 0
    ? `PrepTests ${prepTests[0]}\u2013${prepTests[prepTests.length - 1]}`
    : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Practice
          </h2>
          {hasQuestions && (
            <p className="text-muted-foreground mt-1 text-sm">
              {counts.total.toLocaleString()} real LSAT questions from {ptRange}
            </p>
          )}
        </div>
        {stats.totalAttempted > 0 && (
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs py-1 px-2.5">
              {stats.totalAttempted} attempted
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs py-1 px-2.5 text-emerald-700 bg-emerald-50"
            >
              {stats.accuracy}% accuracy
            </Badge>
            {stats.streak > 0 && (
              <Badge
                variant="secondary"
                className="text-xs py-1 px-2.5 text-amber-700 bg-amber-50"
              >
                {stats.streak} streak
              </Badge>
            )}
          </div>
        )}
      </div>

      {!hasQuestions ? (
        <Card className="border-border/60">
          <CardContent className="p-8 text-center">
            <Zap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-1">No Questions Available</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Practice questions haven&apos;t been loaded yet. Please contact the site
              administrator to set up the LSAT question database.
            </p>
            <Button asChild variant="outline" className="rounded-xl mt-4">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <PracticeSession
          questionCounts={counts}
          prepTests={prepTests}
          initialPrepTest={params.pt}
          initialSection={params.section}
        />
      )}
    </div>
  );
}
