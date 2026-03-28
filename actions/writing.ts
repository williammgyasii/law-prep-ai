"use server";

import { db } from "@/db";
import { writingPrompts, writingAttempts } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function getWritingPrompts() {
  const user = await getSessionUser();
  const { getUserTier, getLimit } = await import("@/lib/subscription");
  const tier = await getUserTier(user.id!);
  const accessCount = getLimit(tier, "writingPromptsAccess");

  const allPrompts = await db.query.writingPrompts.findMany({
    orderBy: [writingPrompts.createdAt],
  });

  if (accessCount === -1) return { prompts: allPrompts, tier, limited: false };

  return {
    prompts: allPrompts.slice(0, accessCount),
    tier,
    limited: allPrompts.length > accessCount,
    totalAvailable: allPrompts.length,
  };
}

export async function getWritingPrompt(promptId: string) {
  return db.query.writingPrompts.findFirst({
    where: eq(writingPrompts.id, promptId),
  });
}

export async function startWritingAttempt(promptId: string) {
  const user = await getSessionUser();
  const [attempt] = await db
    .insert(writingAttempts)
    .values({
      userId: user.id!,
      promptId,
    })
    .returning();

  return attempt;
}

export async function savePrewritingNotes(attemptId: string, notes: string, timeSeconds: number) {
  await db
    .update(writingAttempts)
    .set({
      prewritingNotes: notes,
      prewritingTimeSeconds: timeSeconds,
    })
    .where(eq(writingAttempts.id, attemptId));
}

export async function submitEssay(
  attemptId: string,
  essay: string,
  essayTimeSeconds: number
) {
  const wordCount = essay.trim().split(/\s+/).filter(Boolean).length;

  await db
    .update(writingAttempts)
    .set({
      essay,
      essayTimeSeconds,
      wordCount,
      submittedAt: new Date(),
    })
    .where(eq(writingAttempts.id, attemptId));

  return { wordCount };
}

export async function getWritingAttempts() {
  const user = await getSessionUser();
  return db.query.writingAttempts.findMany({
    where: eq(writingAttempts.userId, user.id!),
    with: { prompt: true },
    orderBy: [desc(writingAttempts.createdAt)],
  });
}

export async function getWritingAttempt(attemptId: string) {
  return db.query.writingAttempts.findFirst({
    where: eq(writingAttempts.id, attemptId),
    with: { prompt: true },
  });
}

export async function getWritingStats() {
  const user = await getSessionUser();
  const attempts = await db.query.writingAttempts.findMany({
    where: eq(writingAttempts.userId, user.id!),
  });

  const completed = attempts.filter((a) => a.submittedAt !== null);
  const totalWords = completed.reduce((sum, a) => sum + a.wordCount, 0);
  const avgWords = completed.length > 0 ? Math.round(totalWords / completed.length) : 0;
  const totalTime = completed.reduce(
    (sum, a) => sum + (a.prewritingTimeSeconds ?? 0) + (a.essayTimeSeconds ?? 0),
    0
  );

  return {
    totalAttempts: attempts.length,
    completedAttempts: completed.length,
    avgWordCount: avgWords,
    totalWritingTimeMinutes: Math.round(totalTime / 60),
  };
}
