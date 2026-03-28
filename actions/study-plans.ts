"use server";

import { db } from "@/db";
import { studyPlans, modules, resources } from "@/db/schema";
import { eq, desc, count, asc } from "drizzle-orm";
import { MOCK_USER_ID } from "@/lib/utils";
import { generateStudyPlan } from "@/lib/openai";
import { revalidatePath } from "next/cache";

export async function getStudyPlans() {
  return db.query.studyPlans.findMany({
    where: eq(studyPlans.userId, MOCK_USER_ID),
    orderBy: [desc(studyPlans.createdAt)],
  });
}

export async function createStudyPlan(input: {
  title: string;
  examDate?: string;
  availableDays: string[];
  minutesPerDay: number;
}) {
  const allModules = await db
    .select({ title: modules.title })
    .from(modules)
    .orderBy(asc(modules.order));

  const [totalResult] = await db.select({ value: count() }).from(resources);

  const plan = await generateStudyPlan({
    availableDays: input.availableDays,
    minutesPerDay: input.minutesPerDay,
    examDate: input.examDate || "Not set",
    modules: allModules.map((m) => m.title),
    totalResources: totalResult?.value ?? 0,
  });

  const [studyPlan] = await db
    .insert(studyPlans)
    .values({
      userId: MOCK_USER_ID,
      title: input.title,
      examDate: input.examDate ? new Date(input.examDate) : null,
      preferences: {
        availableDays: input.availableDays,
        minutesPerDay: input.minutesPerDay,
      },
      generatedPlan: plan,
    })
    .returning();

  revalidatePath("/planner");
  return studyPlan;
}

export async function deleteStudyPlan(id: string) {
  await db.delete(studyPlans).where(eq(studyPlans.id, id));
  revalidatePath("/planner");
}
