import {
  pgTable,
  text,
  integer,
  timestamp,
  pgEnum,
  json,
  uniqueIndex,
  index,
  primaryKey,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@/lib/ids";
import type { AdapterAccountType } from "next-auth/adapters";

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "pro",
  "premium",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "trialing",
  "unpaid",
]);

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
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  tier: subscriptionTierEnum("tier").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
}, (t) => [
  index("idx_sessions_user").on(t.userId),
]);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey().$defaultFn(createId),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tier: subscriptionTierEnum("tier").notNull(),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  stripeCurrentPeriodStart: timestamp("stripe_current_period_start"),
  stripeCurrentPeriodEnd: timestamp("stripe_current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("idx_subscriptions_user_status").on(t.userId, t.status),
]);

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
}, (t) => [
  index("idx_resources_module").on(t.moduleId, t.order),
]);

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
}, (t) => [
  index("idx_notes_user_resource").on(t.userId, t.resourceId),
]);

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
}, (t) => [
  index("idx_weak_areas_user").on(t.userId),
]);

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
}, (t) => [
  index("idx_study_plans_user").on(t.userId, t.createdAt),
]);

export const documentTypeEnum = pgEnum("document_type", [
  "pdf",
  "docx",
  "text",
  "url",
]);

export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant"]);

export const documents = pgTable("documents", {
  id: text("id").primaryKey().$defaultFn(createId),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  fileType: documentTypeEnum("file_type").notNull(),
  fileUrl: text("file_url").notNull().default(""),
  extractedText: text("extracted_text").notNull().default(""),
  wordCount: integer("word_count").notNull().default(0),
  tags: text("tags").array().notNull().default([]),
  summary: text("summary"),
  keyPoints: json("key_points").$type<string[]>(),
  flashcards: json("flashcards").$type<{ front: string; back: string }[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("idx_documents_user_created").on(t.userId, t.createdAt),
]);

export const documentChats = pgTable("document_chats", {
  id: text("id").primaryKey().$defaultFn(createId),
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("idx_doc_chats_doc_user").on(t.documentId, t.userId, t.createdAt),
  index("idx_doc_chats_doc_role").on(t.documentId, t.userId, t.role),
]);

export const lsatSectionTypeEnum = pgEnum("lsat_section_type", [
  "logical_reasoning",
  "reading_comprehension",
  "analytical_reasoning",
]);

export const practiceQuestions = pgTable("practice_questions", {
  id: text("id").primaryKey().$defaultFn(createId),
  sectionType: lsatSectionTypeEnum("section_type").notNull(),
  passage: text("passage").notNull(),
  question: text("question").notNull(),
  options: json("options").notNull().$type<string[]>(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  difficulty: difficultyEnum("difficulty").notNull().default("medium"),
  tags: text("tags").array().notNull().default([]),
  source: text("source").notNull().default("agieval"),
  prepTestNumber: text("prep_test_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("idx_pq_section_difficulty").on(t.sectionType, t.difficulty),
  index("idx_pq_prep_test").on(t.prepTestNumber),
]);

export const questionAttempts = pgTable("question_attempts", {
  id: text("id").primaryKey().$defaultFn(createId),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  questionId: text("question_id")
    .notNull()
    .references(() => practiceQuestions.id, { onDelete: "cascade" }),
  selectedAnswer: text("selected_answer").notNull(),
  isCorrect: integer("is_correct").notNull(),
  timeSpentSeconds: integer("time_spent_seconds"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("idx_attempts_user_created").on(t.userId, t.createdAt),
  index("idx_attempts_user_question").on(t.userId, t.questionId),
]);

export interface WritingPerspective {
  label: string;
  source: string;
  text: string;
}

export interface PrewritingQuestion {
  id: string;
  text: string;
}

export const writingPrompts = pgTable("writing_prompts", {
  id: text("id").primaryKey().$defaultFn(createId),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  keyQuestion: text("key_question").notNull(),
  perspectives: json("perspectives").notNull().$type<WritingPerspective[]>(),
  prewritingQuestions: json("prewriting_questions").notNull().$type<PrewritingQuestion[]>(),
  directions: text("directions").notNull(),
  source: text("source").notNull().default("lsac_sample"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const writingAttempts = pgTable("writing_attempts", {
  id: text("id").primaryKey().$defaultFn(createId),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  promptId: text("prompt_id")
    .notNull()
    .references(() => writingPrompts.id, { onDelete: "cascade" }),
  prewritingNotes: text("prewriting_notes").notNull().default(""),
  essay: text("essay").notNull().default(""),
  prewritingTimeSeconds: integer("prewriting_time_seconds"),
  essayTimeSeconds: integer("essay_time_seconds"),
  wordCount: integer("word_count").notNull().default(0),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("idx_writing_attempts_user").on(t.userId, t.createdAt),
]);

// ─── Relations ───────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  subscriptions: many(subscriptions),
  documents: many(documents),
  documentChats: many(documentChats),
  progress: many(progress),
  notes: many(notes),
  weakAreas: many(weakAreas),
  studyPlans: many(studyPlans),
  questionAttempts: many(questionAttempts),
  writingAttempts: many(writingAttempts),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, { fields: [documents.userId], references: [users.id] }),
  chats: many(documentChats),
}));

export const documentChatsRelations = relations(documentChats, ({ one }) => ({
  document: one(documents, { fields: [documentChats.documentId], references: [documents.id] }),
  user: one(users, { fields: [documentChats.userId], references: [users.id] }),
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

export const practiceQuestionsRelations = relations(practiceQuestions, ({ many }) => ({
  attempts: many(questionAttempts),
}));

export const questionAttemptsRelations = relations(questionAttempts, ({ one }) => ({
  user: one(users, { fields: [questionAttempts.userId], references: [users.id] }),
  question: one(practiceQuestions, { fields: [questionAttempts.questionId], references: [practiceQuestions.id] }),
}));

export const writingPromptsRelations = relations(writingPrompts, ({ many }) => ({
  attempts: many(writingAttempts),
}));

export const writingAttemptsRelations = relations(writingAttempts, ({ one }) => ({
  user: one(users, { fields: [writingAttempts.userId], references: [users.id] }),
  prompt: one(writingPrompts, { fields: [writingAttempts.promptId], references: [writingPrompts.id] }),
}));

// ─── Types ───────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type Progress = typeof progress.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type WeakArea = typeof weakAreas.$inferSelect;
export type StudyPlan = typeof studyPlans.$inferSelect;
export type PracticeQuestion = typeof practiceQuestions.$inferSelect;
export type QuestionAttempt = typeof questionAttempts.$inferSelect;
export type WritingPrompt = typeof writingPrompts.$inferSelect;
export type WritingAttempt = typeof writingAttempts.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type DocumentChat = typeof documentChats.$inferSelect;
