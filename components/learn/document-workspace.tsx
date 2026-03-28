"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PanelRightClose, PanelRightOpen, Bot, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DocumentViewer } from "./document-viewer";
import { AiChatPanel } from "./ai-chat-panel";
import type { Document, DocumentChat } from "@/db/schema";

export interface DocumentWithChats extends Document {
  chats: DocumentChat[];
}

interface DocumentWorkspaceProps {
  document: DocumentWithChats;
  aiMessagesLimit: number;
}

export function DocumentWorkspace({ document, aiMessagesLimit }: DocumentWorkspaceProps) {
  const router = useRouter();
  const [rightOpen, setRightOpen] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<"document" | "chat">("document");

  function handleDeleted() {
    router.push("/learn");
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-6">
      {/* Mobile tab bar */}
      <div className="flex lg:hidden border-b border-border/50 bg-background">
        <button
          onClick={() => setMobilePanel("document")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
            mobilePanel === "document" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
          )}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Document
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

      {/* Desktop two-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: Document viewer */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 overflow-hidden",
          "max-lg:hidden",
          mobilePanel === "document" ? "max-lg:flex!" : ""
        )}>
          <DocumentViewer
            document={document}
            documentDetail={document}
            loading={false}
            onDeleted={handleDeleted}
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
            documentId={document.id}
            documentTitle={document.title}
            initialMessages={document.chats}
            aiMessagesLimit={aiMessagesLimit}
          />
        </div>
      </div>
    </div>
  );
}
