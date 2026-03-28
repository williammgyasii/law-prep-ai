"use server";

import { db } from "@/db";
import { progress, resources } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { MOCK_USER_ID } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function updateProgress(
  resourceId: string,
  status: "not_started" | "in_progress" | "completed" | "review_later",
  confidenceScore?: number,
  timeSpentMinutes?: number
) {
  const userId = MOCK_USER_ID;

  const existing = await db.query.progress.findFirst({
    where: and(eq(progress.userId, userId), eq(progress.resourceId, resourceId)),
  });

  if (existing) {
    const [updated] = await db
      .update(progress)
      .set({
        status,
        completedAt: status === "completed" ? new Date() : null,
        ...(confidenceScore !== undefined && { confidenceScore }),
        ...(timeSpentMinutes !== undefined && { timeSpentMinutes }),
        updatedAt: new Date(),
      })
      .where(eq(progress.id, existing.id))
      .returning();

    revalidatePath("/dashboard");
    revalidatePath("/modules");
    return updated;
  }

  const [created] = await db
    .insert(progress)
    .values({
      userId,
      resourceId,
      status,
      completedAt: status === "completed" ? new Date() : null,
      confidenceScore,
      timeSpentMinutes: timeSpentMinutes ?? 0,
    })
    .returning();

  revalidatePath("/dashboard");
  revalidatePath("/modules");
  return created;
}

export async function ensureInProgress(resourceId: string) {
  const userId = MOCK_USER_ID;

  const existing = await db.query.progress.findFirst({
    where: and(eq(progress.userId, userId), eq(progress.resourceId, resourceId)),
  });

  if (existing) {
    if (existing.status === "not_started") {
      await db
        .update(progress)
        .set({ status: "in_progress", updatedAt: new Date() })
        .where(eq(progress.id, existing.id));
      revalidatePath("/dashboard");
      revalidatePath("/modules");
    }
    return;
  }

  await db.insert(progress).values({
    userId,
    resourceId,
    status: "in_progress",
  });
  revalidatePath("/dashboard");
  revalidatePath("/modules");
}

export async function getProgressStats() {
  const userId = MOCK_USER_ID;

  const [totalResult] = await db.select({ value: count() }).from(resources);
  const total = totalResult?.value ?? 0;

  const [completedResult] = await db
    .select({ value: count() })
    .from(progress)
    .where(and(eq(progress.userId, userId), eq(progress.status, "completed")));
  const completed = completedResult?.value ?? 0;

  const [inProgressResult] = await db
    .select({ value: count() })
    .from(progress)
    .where(and(eq(progress.userId, userId), eq(progress.status, "in_progress")));
  const inProgress = inProgressResult?.value ?? 0;

  const [reviewResult] = await db
    .select({ value: count() })
    .from(progress)
    .where(and(eq(progress.userId, userId), eq(progress.status, "review_later")));
  const reviewLater = reviewResult?.value ?? 0;

  return {
    total,
    completed,
    inProgress,
    reviewLater,
    notStarted: total - completed - inProgress - reviewLater,
  };
}
