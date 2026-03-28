"use server";

import { db } from "@/db";
import { resources } from "@/db/schema";
import { eq, asc, count, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getResources(moduleId?: string) {
  return db.query.resources.findMany({
    where: moduleId ? eq(resources.moduleId, moduleId) : undefined,
    orderBy: [asc(resources.order)],
    with: {
      module: true,
      progress: true,
      notes: true,
    },
  });
}

export async function getResource(id: string) {
  return db.query.resources.findFirst({
    where: eq(resources.id, id),
    with: {
      module: true,
      progress: true,
      notes: true,
    },
  });
}

export async function createResource(input: {
  title: string;
  description?: string;
  url?: string;
  type?: "video" | "lesson" | "drill" | "practice_test" | "article";
  difficulty?: "easy" | "medium" | "hard";
  estimatedMinutes?: number;
  moduleId: string;
  tags?: string[];
}) {
  const existing = await db
    .select({ value: count() })
    .from(resources)
    .where(eq(resources.moduleId, input.moduleId));
  const order = (existing[0]?.value ?? 0) + 1;

  const [resource] = await db
    .insert(resources)
    .values({
      title: input.title,
      description: input.description ?? "",
      url: input.url ?? "",
      type: input.type ?? "lesson",
      difficulty: input.difficulty ?? "medium",
      estimatedMinutes: input.estimatedMinutes ?? 30,
      moduleId: input.moduleId,
      tags: input.tags ?? [],
      order,
    })
    .returning();

  revalidatePath("/modules");
  revalidatePath(`/modules/${input.moduleId}`);
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return resource;
}

export async function updateResource(
  id: string,
  input: Partial<{
    title: string;
    description: string;
    url: string;
    type: "video" | "lesson" | "drill" | "practice_test" | "article";
    difficulty: "easy" | "medium" | "hard";
    estimatedMinutes: number;
    moduleId: string;
    tags: string[];
    order: number;
  }>
) {
  const [resource] = await db
    .update(resources)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(resources.id, id))
    .returning();

  revalidatePath("/modules");
  revalidatePath(`/resources/${id}`);
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return resource;
}

export async function deleteResource(id: string) {
  const existing = await db.query.resources.findFirst({
    where: eq(resources.id, id),
    columns: { moduleId: true },
  });

  await db.delete(resources).where(eq(resources.id, id));

  if (existing) {
    revalidatePath(`/modules/${existing.moduleId}`);
  }
  revalidatePath("/modules");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}
