"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Bot, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DocumentListPanel } from "./document-list-panel";
import { DocumentViewer } from "./document-viewer";
import { AiChatPanel } from "./ai-chat-panel";
import type { Document, DocumentChat } from "@/db/schema";

export interface DocumentWithChats extends Document {
  chats: DocumentChat[];
}

export interface WorkspaceLimits {
  tier: string;
  documentsUsed: number;
  documentsLimit: number;
  aiMessagesPerDoc: number;
  canUpload: boolean;
}

interface LearnWorkspaceProps {
  initialDocuments: Document[];
  limits: WorkspaceLimits;
}

export function LearnWorkspace({ initialDocuments, limits }: LearnWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [activeDocId, setActiveDocId] = useState<string | null>(searchParams.get("doc"));
  const [activeDoc, setActiveDoc] = useState<DocumentWithChats | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<"docs" | "viewer" | "chat">("viewer");

  const activeDocument = documents.find((d) => d.id === activeDocId) ?? null;

  const loadDocumentDetail = useCallback(async (docId: string) => {
    setLoadingDoc(true);
    try {
      const { getDocument } = await import("@/actions/learn");
      const doc = await getDocument(docId);
      if (doc) {
        setActiveDoc(doc as DocumentWithChats);
      }
    } finally {
      setLoadingDoc(false);
    }
  }, []);

  const handleSelectDocument = useCallback((docId: string) => {
    setActiveDocId(docId);
    setActiveDoc(null);
    router.replace(`/learn?doc=${docId}`, { scroll: false });
    loadDocumentDetail(docId);
    setMobilePanel("viewer");
  }, [router, loadDocumentDetail]);

  const handleDocumentUploaded = useCallback((doc: Document) => {
    setDocuments((prev) => [doc, ...prev]);
    handleSelectDocument(doc.id);
  }, [handleSelectDocument]);

  const handleDocumentDeleted = useCallback((docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    if (activeDocId === docId) {
      setActiveDocId(null);
      setActiveDoc(null);
      router.replace("/learn", { scroll: false });
    }
  }, [activeDocId, router]);

  const initialDocParam = searchParams.get("doc");
  const hasLoadedInitial = useRef(false);

  useEffect(() => {
    if (initialDocParam && !hasLoadedInitial.current) {
      hasLoadedInitial.current = true;
      loadDocumentDetail(initialDocParam);
    }
  }, [initialDocParam, loadDocumentDetail]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-6">
      {/* Mobile tab bar */}
      <div className="flex lg:hidden border-b border-border/50 bg-background">
        <button
          onClick={() => setMobilePanel("docs")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
            mobilePanel === "docs" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
          )}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Documents
        </button>
        <button
          onClick={() => setMobilePanel("viewer")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
            mobilePanel === "viewer" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
          )}
        >
          Content
        </button>
        <button
          onClick={() => setMobilePanel("chat")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
            mobilePanel === "chat" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
          )}
        >
          <Bot className="w-3.5 h-3.5" />
          AI Chat
        </button>
      </div>

      {/* Desktop three-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: Document list */}
        <div className={cn(
          "border-r border-border/50 flex flex-col bg-muted/20 transition-all duration-200 overflow-hidden",
          leftOpen ? "w-[260px] min-w-[260px]" : "w-0 min-w-0 border-r-0",
          "max-lg:hidden",
          mobilePanel === "docs" ? "max-lg:flex! max-lg:w-full! max-lg:min-w-0! max-lg:border-r-0!" : ""
        )}>
          <DocumentListPanel
            documents={documents}
            activeDocId={activeDocId}
            onSelect={handleSelectDocument}
            onDocumentUploaded={handleDocumentUploaded}
            limits={limits}
          />
        </div>

        {/* Left panel toggle (desktop) */}
        <div className="hidden lg:flex items-start pt-3 -ml-px z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-l-none rounded-r-lg border border-l-0 border-border/50 bg-background"
            onClick={() => setLeftOpen(!leftOpen)}
          >
            {leftOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
          </Button>
        </div>

        {/* Center panel: Document viewer */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 overflow-hidden",
          "max-lg:hidden",
          mobilePanel === "viewer" ? "max-lg:flex!" : ""
        )}>
          <DocumentViewer
            document={activeDocument}
            documentDetail={activeDoc}
            loading={loadingDoc}
            onDeleted={handleDocumentDeleted}
          />
        </div>

        {/* Right panel toggle (desktop) */}
        <div className="hidden lg:flex items-start pt-3 -mr-px z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-r-none rounded-l-lg border border-r-0 border-border/50 bg-background"
            onClick={() => setRightOpen(!rightOpen)}
          >
            {rightOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
          </Button>
        </div>

        {/* Right panel: AI Chat */}
        <div className={cn(
          "border-l border-border/50 flex flex-col bg-background transition-all duration-200 overflow-hidden",
          rightOpen ? "w-[380px] min-w-[380px]" : "w-0 min-w-0 border-l-0",
          "max-lg:hidden",
          mobilePanel === "chat" ? "max-lg:flex! max-lg:w-full! max-lg:min-w-0! max-lg:border-l-0!" : ""
        )}>
          <AiChatPanel
            documentId={activeDocId}
            documentTitle={activeDocument?.title ?? null}
            initialMessages={activeDoc?.chats ?? []}
            aiMessagesLimit={limits.aiMessagesPerDoc}
          />
        </div>
      </div>
    </div>
  );
}
