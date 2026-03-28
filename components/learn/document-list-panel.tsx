"use client";

import { useState } from "react";
import { Search, Plus, FileText, FileType, File, Globe, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { UploadDialog } from "./upload-dialog";
import type { Document } from "@/db/schema";
import type { WorkspaceLimits } from "./learn-workspace";

const FILE_TYPE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  docx: FileType,
  text: File,
  url: Globe,
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface DocumentListPanelProps {
  documents: Document[];
  activeDocId: string | null;
  onSelect: (docId: string) => void;
  onDocumentUploaded: (doc: Document) => void;
  limits: WorkspaceLimits;
}

export function DocumentListPanel({
  documents,
  activeDocId,
  onSelect,
  onDocumentUploaded,
  limits,
}: DocumentListPanelProps) {
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);

  const filtered = search.trim()
    ? documents.filter((d) =>
        d.title.toLowerCase().includes(search.toLowerCase())
      )
    : documents;

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-2 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Documents</h3>
          <div className="flex items-center gap-1.5">
            {limits.documentsLimit !== -1 && (
              <Badge variant="secondary" className="text-[10px]">
                {limits.documentsUsed}/{limits.documentsLimit}
              </Badge>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-lg"
              onClick={() => setUploadOpen(true)}
              disabled={!limits.canUpload}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs rounded-lg"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 gap-2">
            <FileText className="w-8 h-8 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground">
              {search ? "No documents match your search" : "No documents yet"}
            </p>
            {!search && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs rounded-lg gap-1"
                onClick={() => setUploadOpen(true)}
              >
                <Plus className="w-3 h-3" />
                Upload
              </Button>
            )}
          </div>
        ) : (
          <div className="p-1.5 space-y-0.5">
            {filtered.map((doc) => {
              const Icon = FILE_TYPE_ICONS[doc.fileType] || FileText;
              const isActive = doc.id === activeDocId;

              return (
                <button
                  key={doc.id}
                  onClick={() => onSelect(doc.id)}
                  className={cn(
                    "w-full text-left rounded-lg px-2.5 py-2 transition-colors group",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/60 text-foreground"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={cn(
                      "w-3.5 h-3.5 mt-0.5 shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate leading-tight">
                        {doc.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {doc.fileType}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {doc.wordCount.toLocaleString()}w
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-auto">
                          <Clock className="w-2.5 h-2.5" />
                          {timeAgo(doc.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploaded={onDocumentUploaded}
        canUpload={limits.canUpload}
      />
    </div>
  );
}
