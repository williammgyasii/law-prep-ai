"use server";

import { db } from "@/db";
import { documents, documentChats } from "@/db/schema";
import { eq, and, desc, count, asc } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { getUserTier, getLimit } from "@/lib/subscription";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

export async function getUserDocuments() {
  const user = await getSessionUser();
  return db.query.documents.findMany({
    where: eq(documents.userId, user.id!),
    orderBy: [desc(documents.createdAt)],
  });
}

export async function getDocument(docId: string) {
  const user = await getSessionUser();
  const doc = await db.query.documents.findFirst({
    where: and(eq(documents.id, docId), eq(documents.userId, user.id!)),
    with: { chats: { orderBy: [asc(documentChats.createdAt)] } },
  });
  return doc ?? null;
}

export async function deleteDocument(docId: string) {
  const user = await getSessionUser();
  await db
    .delete(documents)
    .where(and(eq(documents.id, docId), eq(documents.userId, user.id!)));
  return { success: true };
}

export async function updateDocumentTitle(docId: string, title: string) {
  const user = await getSessionUser();
  await db
    .update(documents)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(documents.id, docId), eq(documents.userId, user.id!)));
  return { success: true };
}

export async function getDocumentCount() {
  const user = await getSessionUser();
  const [result] = await db
    .select({ count: count() })
    .from(documents)
    .where(eq(documents.userId, user.id!));
  return result?.count ?? 0;
}

export async function getDocumentLimits() {
  const user = await getSessionUser();
  const tier = await getUserTier(user.id!);
  const docLimit = getLimit(tier, "documentsTotal");
  const msgLimit = getLimit(tier, "aiMessagesPerDoc");
  const [result] = await db
    .select({ count: count() })
    .from(documents)
    .where(eq(documents.userId, user.id!));
  const used = result?.count ?? 0;

  return {
    tier,
    documentsUsed: used,
    documentsLimit: docLimit,
    aiMessagesPerDoc: msgLimit,
    canUpload: docLimit === -1 || used < docLimit,
  };
}

async function getChatMessageCount(docId: string, userId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(documentChats)
    .where(
      and(
        eq(documentChats.documentId, docId),
        eq(documentChats.userId, userId),
        eq(documentChats.role, "user")
      )
    );
  return result?.count ?? 0;
}

function truncateText(text: string, maxChars: number = 12000): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n\n[Document truncated for context window...]";
}

export async function summarizeDocument(docId: string) {
  const user = await getSessionUser();
  const doc = await db.query.documents.findFirst({
    where: and(eq(documents.id, docId), eq(documents.userId, user.id!)),
  });
  if (!doc) return { error: "Document not found" };

  const context = truncateText(doc.extractedText);

  if (!process.env.OPENAI_API_KEY) {
    const summary = `**Summary of "${doc.title}"**\n\nThis document contains ${doc.wordCount} words. Key themes include legal analysis and argumentation. [AI summary unavailable — no API key configured]`;
    await db.update(documents).set({ summary }).where(eq(documents.id, docId));
    return { summary };
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a legal study assistant. Provide a clear, structured summary of the following document. Highlight key arguments, holdings, and important legal concepts. Use markdown formatting.",
      },
      { role: "user", content: `Summarize this document:\n\n${context}` },
    ],
    max_tokens: 800,
  });

  const summary = response.choices[0]?.message?.content || "Unable to generate summary.";
  await db.update(documents).set({ summary }).where(eq(documents.id, docId));
  return { summary };
}

export async function extractKeyPoints(docId: string) {
  const user = await getSessionUser();
  const doc = await db.query.documents.findFirst({
    where: and(eq(documents.id, docId), eq(documents.userId, user.id!)),
  });
  if (!doc) return { error: "Document not found" };

  const context = truncateText(doc.extractedText);

  if (!process.env.OPENAI_API_KEY) {
    const keyPoints = [
      "Key legal argument identified in the document",
      "Important precedent or holding referenced",
      "Critical reasoning or analysis point",
      "[AI key points unavailable — no API key configured]",
    ];
    await db.update(documents).set({ keyPoints }).where(eq(documents.id, docId));
    return { keyPoints };
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a legal study assistant. Extract the key points from this document as a JSON array of strings. Each point should be a concise, self-contained statement. Return ONLY a JSON array, no other text.",
      },
      { role: "user", content: context },
    ],
    max_tokens: 600,
  });

  try {
    const raw = response.choices[0]?.message?.content || "[]";
    const keyPoints = JSON.parse(raw) as string[];
    await db.update(documents).set({ keyPoints }).where(eq(documents.id, docId));
    return { keyPoints };
  } catch {
    return { keyPoints: ["Failed to parse key points. Please try again."] };
  }
}

export async function generateFlashcards(docId: string) {
  const user = await getSessionUser();
  const doc = await db.query.documents.findFirst({
    where: and(eq(documents.id, docId), eq(documents.userId, user.id!)),
  });
  if (!doc) return { error: "Document not found" };

  const context = truncateText(doc.extractedText);

  if (!process.env.OPENAI_API_KEY) {
    const flashcards = [
      { front: "What is the main argument?", back: "The document presents a legal analysis. [Mock — no API key]" },
      { front: "What precedent is cited?", back: "Key legal precedent referenced in the text. [Mock — no API key]" },
    ];
    await db.update(documents).set({ flashcards }).where(eq(documents.id, docId));
    return { flashcards };
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: 'You are a legal study assistant. Generate study flashcards from this document. Return a JSON array of objects with "front" (question) and "back" (answer) fields. Generate 5-8 flashcards covering the most important concepts. Return ONLY a JSON array, no other text.',
      },
      { role: "user", content: context },
    ],
    max_tokens: 800,
  });

  try {
    const raw = response.choices[0]?.message?.content || "[]";
    const flashcards = JSON.parse(raw) as { front: string; back: string }[];
    await db.update(documents).set({ flashcards }).where(eq(documents.id, docId));
    return { flashcards };
  } catch {
    return { flashcards: [{ front: "Error", back: "Failed to generate flashcards. Please try again." }] };
  }
}

export async function chatWithDocument(docId: string, message: string) {
  const user = await getSessionUser();
  const tier = await getUserTier(user.id!);
  const msgLimit = getLimit(tier, "aiMessagesPerDoc");

  if (msgLimit !== -1) {
    const used = await getChatMessageCount(docId, user.id!);
    if (used >= msgLimit) {
      return {
        error: "Message limit reached for this document. Upgrade your plan for more AI conversations.",
        tier,
      };
    }
  }

  const doc = await db.query.documents.findFirst({
    where: and(eq(documents.id, docId), eq(documents.userId, user.id!)),
  });
  if (!doc) return { error: "Document not found" };

  await db.insert(documentChats).values({
    documentId: docId,
    userId: user.id!,
    role: "user",
    content: message,
  });

  const previousChats = await db.query.documentChats.findMany({
    where: and(eq(documentChats.documentId, docId), eq(documentChats.userId, user.id!)),
    orderBy: [asc(documentChats.createdAt)],
    limit: 20,
  });

  const context = truncateText(doc.extractedText);

  let reply: string;

  if (!process.env.OPENAI_API_KEY) {
    reply = `**AI Study Assistant** (Mock — no API key)\n\nGreat question about "${doc.title}"! Based on the document content (${doc.wordCount} words), I would analyze the key legal concepts and provide relevant insights.\n\nYour question: "${message.slice(0, 100)}"\n\nPlease configure an OpenAI API key for full AI responses.`;
  } else {
    const chatHistory = previousChats.slice(-10).map((c) => ({
      role: c.role as "user" | "assistant",
      content: c.content,
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a legal study assistant helping a student understand a document titled "${doc.title}". Here is the document content for context:\n\n${context}\n\nAnswer questions about this document clearly and accurately. Use markdown formatting. If the question is not related to the document, gently redirect to the document content.`,
        },
        ...chatHistory,
      ],
      max_tokens: 800,
    });

    reply = response.choices[0]?.message?.content || "Unable to generate a response. Please try again.";
  }

  const [chatMsg] = await db
    .insert(documentChats)
    .values({
      documentId: docId,
      userId: user.id!,
      role: "assistant",
      content: reply,
    })
    .returning();

  return { reply, chatId: chatMsg.id };
}
