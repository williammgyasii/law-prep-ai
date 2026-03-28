"use server";

import { db } from "@/db";
import { modules, resources, progress } from "@/db/schema";
import { eq, asc, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getModules() {
  return db.query.modules.findMany({
    orderBy: [asc(modules.order)],
    with: {
      resources: {
        with: { progress: true },
      },
    },
  });
}

export async function getModule(id: string) {
  return db.query.modules.findFirst({
    where: eq(modules.id, id),
    with: {
      resources: {
        orderBy: [asc(resources.order)],
        with: {
          progress: true,
          notes: true,
        },
      },
    },
  });
}

export async function createModule(input: {
  title: string;
  description?: string;
  color?: string;
  icon?: string;
}) {
  const existing = await db.select({ value: count() }).from(modules);
  const order = (existing[0]?.value ?? 0) + 1;

  const [mod] = await db
    .insert(modules)
    .values({
      title: input.title,
      description: input.description ?? "",
      color: input.color ?? "#4f46e5",
      icon: input.icon ?? "BookOpen",
      order,
    })
    .returning();

  revalidatePath("/modules");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return mod;
}

export async function updateModule(
  id: string,
  input: Partial<{ title: string; description: string; color: string; icon: string; order: number }>
) {
  const [mod] = await db
    .update(modules)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(modules.id, id))
    .returning();

  revalidatePath("/modules");
  revalidatePath(`/modules/${id}`);
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return mod;
}

export async function deleteModule(id: string) {
  await db.delete(modules).where(eq(modules.id, id));
  revalidatePath("/modules");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}
