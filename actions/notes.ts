"use server";

import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getNotesForResource(resourceId: string) {
  const user = await getSessionUser();
  return db.query.notes.findMany({
    where: and(eq(notes.userId, user.id!), eq(notes.resourceId, resourceId)),
    orderBy: [desc(notes.updatedAt)],
  });
}

export async function getNote(resourceId: string) {
  const user = await getSessionUser();
  return db.query.notes.findFirst({
    where: and(eq(notes.userId, user.id!), eq(notes.resourceId, resourceId)),
  });
}

export async function createNote(resourceId: string, title: string) {
  const user = await getSessionUser();
  const [created] = await db
    .insert(notes)
    .values({ userId: user.id!, resourceId, title, content: "" })
    .returning();

  revalidatePath(`/resources/${resourceId}`);
  return created;
}

export async function saveNote(resourceId: string, content: string) {
  const user = await getSessionUser();
  const userId = user.id!;

  const existing = await db.query.notes.findFirst({
    where: and(eq(notes.userId, userId), eq(notes.resourceId, resourceId)),
  });

  if (existing) {
    const [updated] = await db
      .update(notes)
      .set({ content, updatedAt: new Date() })
      .where(eq(notes.id, existing.id))
      .returning();

    revalidatePath(`/resources/${resourceId}`);
    return updated;
  }

  const [created] = await db
    .insert(notes)
    .values({ userId, resourceId, content })
    .returning();

  revalidatePath(`/resources/${resourceId}`);
  return created;
}

export async function updateNote(noteId: string, data: { title?: string; content?: string }) {
  const [updated] = await db
    .update(notes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(notes.id, noteId))
    .returning();

  if (updated) {
    revalidatePath(`/resources/${updated.resourceId}`);
  }
  return updated;
}

export async function deleteNote(noteId: string) {
  const [deleted] = await db
    .delete(notes)
    .where(eq(notes.id, noteId))
    .returning();

  if (deleted) {
    revalidatePath(`/resources/${deleted.resourceId}`);
  }
  return deleted;
}
