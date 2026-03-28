import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Globe,
  Sparkles,
  ListChecks,
  Layers,
  Loader2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDocument, getDocumentLimits } from "@/actions/learn";
import { DocumentChat } from "@/components/document-chat";
import { DocumentActions } from "./actions-client";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [doc, limits] = await Promise.all([
    getDocument(id),
    getDocumentLimits(),
  ]);

  if (!doc) notFound();

  const userMessageCount = doc.chats.filter((c) => c.role === "user").length;
  const chatMessages = doc.chats.map((c) => ({
    id: c.id,
    role: c.role as "user" | "assistant",
    content: c.content,
  }));

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]">
      {/* Left: Document content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <Button asChild variant="ghost" size="icon" className="rounded-xl shrink-0">
            <Link href="/learn">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{doc.title}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-[10px]">
                {doc.fileType.toUpperCase()}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {doc.wordCount.toLocaleString()} words
              </span>
              {doc.fileType === "url" && doc.fileUrl && (
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Source
                </a>
              )}
            </div>
          </div>
        </div>

        <DocumentActions documentId={doc.id} initialDoc={doc} />

        <Card className="flex-1 border-border/50 overflow-hidden">
          <CardContent className="p-6 overflow-y-auto h-full">
            <div className="prose prose-sm max-w-none">
              {doc.extractedText.split("\n").map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} className="h-3" />;
                return (
                  <p key={i} className="text-sm leading-relaxed text-foreground/80 mb-2">
                    {trimmed}
                  </p>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: AI Chat */}
      <Card className="lg:w-[380px] border-border/50 flex flex-col overflow-hidden shrink-0 h-full">
        <DocumentChat
          documentId={doc.id}
          documentTitle={doc.title}
          initialMessages={chatMessages}
          aiMessagesLimit={limits.aiMessagesPerDoc}
          userMessageCount={userMessageCount}
        />
      </Card>
    </div>
  );
}
