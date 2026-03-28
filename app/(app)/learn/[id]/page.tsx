import { notFound } from "next/navigation";
import { getDocument, getDocumentLimits } from "@/actions/learn";
import { DocumentWorkspace } from "@/components/learn/document-workspace";
import type { DocumentWithChats } from "@/components/learn/document-workspace";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [doc, limits] = await Promise.all([
    getDocument(id),
    getDocumentLimits(),
  ]);

  if (!doc) notFound();

  return (
    <DocumentWorkspace
      document={doc as DocumentWithChats}
      aiMessagesLimit={limits.aiMessagesPerDoc}
    />
  );
}
