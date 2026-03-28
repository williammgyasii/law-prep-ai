import {
  pgTable,
  text,
  integer,
  timestamp,
  pgEnum,
  json,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@/lib/ids";

export const resourceTypeEnum = pgEnum("resource_type", [
  "video",
  "lesson",
  "drill",
  "practice_test",
  "article",
  "webinar",
  "podcast",
  "course_module",
]);

export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);

export const progressStatusEnum = pgEnum("progress_status", [
  "not_started",
  "in_progress",
  "completed",
  "review_later",
]);

// ─── Tables ──────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const modules = pgTable("modules", {
  id: text("id").primaryKey().$defaultFn(createId),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  order: integer("order").notNull().default(0),
  color: text("color").notNull().default("#4f46e5"),
  icon: text("icon").notNull().default("BookOpen"),
  source: text("source").notNull().default("manual"),
  sourceUrl: text("source_url"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const resources = pgTable("resources", {
  id: text("id").primaryKey().$defaultFn(createId),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  url: text("url").notNull().default(""),
  type: resourceTypeEnum("type").notNull().default("lesson"),
  difficulty: difficultyEnum("difficulty").notNull().default("medium"),
  estimatedMinutes: integer("estimated_minutes").notNull().default(30),
  moduleId: text("module_id")
    .notNull()
    .references(() => modules.id, { onDelete: "cascade" }),
  tags: text("tags").array().notNull().default([]),
  order: integer("order").notNull().default(0),
  source: text("source").notNull().default("manual"),
  imageUrl: text("image_url"),
  content: text("content"),
  duration: text("duration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const progress = pgTable(
  "progress",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    resourceId: text("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    status: progressStatusEnum("status").notNull().default("not_started"),
    completedAt: timestamp("completed_at"),
    confidenceScore: integer("confidence_score"),
    timeSpentMinutes: integer("time_spent_minutes").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("progress_user_resource_idx").on(table.userId, table.resourceId)]
);

export const notes = pgTable("notes", {
  id: text("id").primaryKey().$defaultFn(createId),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  resourceId: text("resource_id")
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("Untitled Note"),
  content: text("content").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const weakAreas = pgTable("weak_areas", {
  id: text("id").primaryKey().$defaultFn(createId),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  confidenceScore: integer("confidence_score").notNull().default(1),
  moduleId: text("module_id").references(() => modules.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const studyPlans = pgTable("study_plans", {
  id: text("id").primaryKey().$defaultFn(createId),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  examDate: timestamp("exam_date"),
  preferences: json("preferences").notNull().default({}),
  generatedPlan: json("generated_plan").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Relations ───────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  progress: many(progress),
  notes: many(notes),
  weakAreas: many(weakAreas),
  studyPlans: many(studyPlans),
}));

export const modulesRelations = relations(modules, ({ many }) => ({
  resources: many(resources),
  weakAreas: many(weakAreas),
}));

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  module: one(modules, { fields: [resources.moduleId], references: [modules.id] }),
  progress: many(progress),
  notes: many(notes),
}));

export const progressRelations = relations(progress, ({ one }) => ({
  user: one(users, { fields: [progress.userId], references: [users.id] }),
  resource: one(resources, { fields: [progress.resourceId], references: [resources.id] }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
  resource: one(resources, { fields: [notes.resourceId], references: [resources.id] }),
}));

export const weakAreasRelations = relations(weakAreas, ({ one }) => ({
  user: one(users, { fields: [weakAreas.userId], references: [users.id] }),
  module: one(modules, { fields: [weakAreas.moduleId], references: [modules.id] }),
}));

export const studyPlansRelations = relations(studyPlans, ({ one }) => ({
  user: one(users, { fields: [studyPlans.userId], references: [users.id] }),
}));

// ─── Types ───────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type Progress = typeof progress.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type WeakArea = typeof weakAreas.$inferSelect;
export type StudyPlan = typeof studyPlans.$inferSelect;
