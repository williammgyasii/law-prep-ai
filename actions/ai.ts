"use server";

import { summarizeNotes, explainSimply, generateQuiz, suggestNextLesson } from "@/lib/openai";
import { db } from "@/db";
import { progress, weakAreas, resources } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

export async function aiSummarize(notes: string) {
  return summarizeNotes(notes);
}

export async function aiExplain(title: string, notes: string, tags: string[]) {
  const { checkFeatureAccess } = await import("@/actions/subscription");
  const access = await checkFeatureAccess("ai_explanations");
  if (!access.allowed) {
    return `This feature requires the ${access.requiredTier === "pro" ? "Pro" : "Premium"} plan. Visit /pricing to upgrade.`;
  }
  return explainSimply(title, notes, tags);
}

export async function aiQuiz(title: string, type: string, notes: string, tags: string[]) {
  const { checkFeatureAccess } = await import("@/actions/subscription");
  const access = await checkFeatureAccess("ai_explanations");
  if (!access.allowed) {
    return `This feature requires the ${access.requiredTier === "pro" ? "Pro" : "Premium"} plan. Visit /pricing to upgrade.`;
  }
  return generateQuiz(title, type, notes, tags);
}

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function aiChat(
  messages: ChatMessage[],
  context: { resourceTitle: string; resourceType: string; tags: string[] }
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    const lastMsg = messages[messages.length - 1]?.content || "";
    return `⚠️ *AI-Generated Study Support (Mock — no API key set)*\n\nGreat question about "${context.resourceTitle}"! Here's what I can tell you:\n\n• This topic relates to ${context.tags.join(", ") || "LSAT preparation"}\n• The key concepts involve understanding the underlying principles and how they apply in practice\n• I'd recommend reviewing the material and trying to identify the main argument structure\n\nYour question was: "${lastMsg.slice(0, 100)}"\n\nFeel free to ask follow-up questions!`;
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an AI study assistant for LSAT preparation. The student is currently studying: "${context.resourceTitle}" (${context.resourceType}). Related topics: ${context.tags.join(", ")}. 

Help them understand concepts, answer questions, and provide study guidance. Be concise but thorough. Use markdown formatting for readability. Label your responses as AI-generated study support.`,
      },
      ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ],
    max_tokens: 800,
  });

  return response.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
}

export async function aiSuggestNext(): Promise<string> {
  const { checkFeatureAccess } = await import("@/actions/subscription");
  const access = await checkFeatureAccess("ai_explanations");
  if (!access.allowed) {
    return "AI suggestions require the Pro plan or above. Visit /pricing to upgrade.";
  }

  const user = await getSessionUser();
  const userId = user.id!;

  const completedProgress = await db.query.progress.findMany({
    where: and(eq(progress.userId, userId), eq(progress.status, "completed")),
    with: { resource: true },
  });

  const userWeakAreas = await db.query.weakAreas.findMany({
    where: eq(weakAreas.userId, userId),
  });

  const allResources = await db.query.resources.findMany({
    with: { progress: true },
  });

  const completedTitles = completedProgress.map((p) => p.resource.title);
  const weakAreaTitles = userWeakAreas.map((w) => w.title);
  const availableTitles = allResources
    .filter((r) => !r.progress.some((p) => p.userId === userId && p.status === "completed"))
    .map((r) => r.title);

  return suggestNextLesson(completedTitles, weakAreaTitles, availableTitles);
}
