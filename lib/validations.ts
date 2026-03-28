import { z } from "zod";

export const moduleSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).default(""),
  order: z.number().int().min(0).default(0),
  color: z.string().default("#4f46e5"),
  icon: z.string().default("BookOpen"),
});

export const resourceSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).default(""),
  url: z.string().url("Must be a valid URL").or(z.literal("")).default(""),
  type: z.enum(["video", "lesson", "drill", "practice_test", "article"]).default("lesson"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  estimatedMinutes: z.number().int().min(1).max(480).default(30),
  moduleId: z.string().min(1, "Module is required"),
  tags: z.array(z.string()).default([]),
  order: z.number().int().min(0).default(0),
});

export const progressSchema = z.object({
  resourceId: z.string().min(1),
  status: z.enum(["not_started", "in_progress", "completed", "review_later"]),
  confidenceScore: z.number().int().min(1).max(5).optional(),
  timeSpentMinutes: z.number().int().min(0).optional(),
});

export const noteSchema = z.object({
  resourceId: z.string().min(1),
  content: z.string().max(10000),
});

export const weakAreaSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).default(""),
  confidenceScore: z.number().int().min(1).max(5).default(1),
  moduleId: z.string().optional(),
});

export const studyPlanSchema = z.object({
  title: z.string().min(1).max(200),
  examDate: z.string().optional(),
  availableDays: z.array(z.string()).min(1, "Select at least one day"),
  minutesPerDay: z.number().int().min(15).max(480),
});

export type ModuleInput = z.infer<typeof moduleSchema>;
export type ResourceInput = z.infer<typeof resourceSchema>;
export type ProgressInput = z.infer<typeof progressSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type WeakAreaInput = z.infer<typeof weakAreaSchema>;
export type StudyPlanInput = z.infer<typeof studyPlanSchema>;
