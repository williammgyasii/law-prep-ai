"use server";

import { db } from "@/db";
import { weakAreas } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { MOCK_USER_ID } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getWeakAreas() {
  return db.query.weakAreas.findMany({
    where: eq(weakAreas.userId, MOCK_USER_ID),
    with: { module: true },
    orderBy: [asc(weakAreas.confidenceScore)],
  });
}

export async function createWeakArea(input: {
  title: string;
  description?: string;
  confidenceScore?: number;
  moduleId?: string;
}) {
  const [wa] = await db
    .insert(weakAreas)
    .values({
      userId: MOCK_USER_ID,
      title: input.title,
      description: input.description ?? "",
      confidenceScore: input.confidenceScore ?? 1,
      moduleId: input.moduleId || null,
    })
    .returning();

  revalidatePath("/weak-areas");
  revalidatePath("/dashboard");
  return wa;
}

export async function updateWeakArea(
  id: string,
  input: Partial<{ title: string; description: string; confidenceScore: number; moduleId: string }>
) {
  const [wa] = await db
    .update(weakAreas)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(weakAreas.id, id))
    .returning();

  revalidatePath("/weak-areas");
  revalidatePath("/dashboard");
  return wa;
}

export async function deleteWeakArea(id: string) {
  await db.delete(weakAreas).where(eq(weakAreas.id, id));
  revalidatePath("/weak-areas");
  revalidatePath("/dashboard");
}
