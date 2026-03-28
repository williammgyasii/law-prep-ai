"use server";

import { db } from "@/db";
import { practiceQuestions, questionAttempts } from "@/db/schema";
import { eq, and, sql, desc, count, isNotNull } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export type SectionType = "logical_reasoning" | "reading_comprehension" | "analytical_reasoning";

export interface PracticeFilters {
  sectionType?: SectionType | "mixed";
  difficulty?: "easy" | "medium" | "hard";
  prepTest?: string;
  count: number;
}

export async function getPracticeQuestions(filters: PracticeFilters) {
  const { checkDailyPracticeLimit } = await import("@/actions/subscription");
  const limitCheck = await checkDailyPracticeLimit();

  if (!limitCheck.allowed) {
    return {
      questions: [],
      limitReached: true,
      used: limitCheck.used,
      limit: limitCheck.limit,
      tier: limitCheck.tier,
    };
  }

  const conditions = [];

  if (filters.sectionType && filters.sectionType !== "mixed") {
    conditions.push(eq(practiceQuestions.sectionType, filters.sectionType));
  }

  if (filters.difficulty) {
    conditions.push(eq(practiceQuestions.difficulty, filters.difficulty));
  }

  if (filters.prepTest) {
    conditions.push(eq(practiceQuestions.prepTestNumber, filters.prepTest));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const effectiveCount = limitCheck.limit === -1
    ? filters.count
    : Math.min(filters.count, limitCheck.limit - limitCheck.used);

  const questions = await db.query.practiceQuestions.findMany({
    where,
    limit: Math.max(1, effectiveCount),
    orderBy: sql`RANDOM()`,
  });

  return { questions, limitReached: false };
}

export async function getAvailablePrepTests() {
  const results = await db
    .selectDistinct({ prepTestNumber: practiceQuestions.prepTestNumber })
    .from(practiceQuestions)
    .where(isNotNull(practiceQuestions.prepTestNumber))
    .orderBy(practiceQuestions.prepTestNumber);

  return results
    .map((r) => r.prepTestNumber)
    .filter((pt): pt is string => pt !== null);
}

export async function submitAnswer(
  questionId: string,
  selectedAnswer: string,
  timeSpentSeconds: number | null
) {
  const question = await db.query.practiceQuestions.findFirst({
    where: eq(practiceQuestions.id, questionId),
  });

  if (!question) {
    return { success: false, error: "Question not found" };
  }

  const isCorrect = selectedAnswer === question.correctAnswer ? 1 : 0;
  const user = await getSessionUser();

  await db.insert(questionAttempts).values({
    userId: user.id!,
    questionId,
    selectedAnswer,
    isCorrect,
    timeSpentSeconds,
  });

  return {
    success: true,
    isCorrect: isCorrect === 1,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
  };
}

export async function getPracticeStats() {
  const user = await getSessionUser();
  const userId = user.id!;

  const allAttempts = await db.query.questionAttempts.findMany({
    where: eq(questionAttempts.userId, userId),
    with: { question: true },
    orderBy: [desc(questionAttempts.createdAt)],
  });

  if (allAttempts.length === 0) {
    return {
      totalAttempted: 0,
      totalCorrect: 0,
      accuracy: 0,
      bySection: {
        logical_reasoning: { attempted: 0, correct: 0, accuracy: 0 },
        reading_comprehension: { attempted: 0, correct: 0, accuracy: 0 },
        analytical_reasoning: { attempted: 0, correct: 0, accuracy: 0 },
      },
      recentAccuracy: 0,
      streak: 0,
    };
  }

  const totalAttempted = allAttempts.length;
  const totalCorrect = allAttempts.filter((a) => a.isCorrect === 1).length;
  const accuracy = Math.round((totalCorrect / totalAttempted) * 100);

  const bySection: Record<string, { attempted: number; correct: number; accuracy: number }> = {
    logical_reasoning: { attempted: 0, correct: 0, accuracy: 0 },
    reading_comprehension: { attempted: 0, correct: 0, accuracy: 0 },
    analytical_reasoning: { attempted: 0, correct: 0, accuracy: 0 },
  };

  for (const attempt of allAttempts) {
    const section = attempt.question.sectionType;
    bySection[section].attempted++;
    if (attempt.isCorrect === 1) bySection[section].correct++;
  }

  for (const section of Object.values(bySection)) {
    section.accuracy = section.attempted > 0
      ? Math.round((section.correct / section.attempted) * 100)
      : 0;
  }

  const recent = allAttempts.slice(0, 20);
  const recentCorrect = recent.filter((a) => a.isCorrect === 1).length;
  const recentAccuracy = recent.length > 0
    ? Math.round((recentCorrect / recent.length) * 100)
    : 0;

  let streak = 0;
  for (const attempt of allAttempts) {
    if (attempt.isCorrect === 1) streak++;
    else break;
  }

  return {
    totalAttempted,
    totalCorrect,
    accuracy,
    bySection,
    recentAccuracy,
    streak,
  };
}

export async function getQuestionCounts() {
  const results = await db
    .select({
      sectionType: practiceQuestions.sectionType,
      count: count(),
    })
    .from(practiceQuestions)
    .groupBy(practiceQuestions.sectionType);

  const counts: Record<string, number> = {
    logical_reasoning: 0,
    reading_comprehension: 0,
    analytical_reasoning: 0,
    total: 0,
  };

  for (const r of results) {
    counts[r.sectionType] = r.count;
    counts.total += r.count;
  }

  return counts;
}
