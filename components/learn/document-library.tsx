"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  FileText,
  FileType,
  File,
  Globe,
  Clock,
  FolderOpen,
  Upload,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { UploadDialog } from "./upload-dialog";
import type { Document } from "@/db/schema";

export interface LibraryLimits {
  tier: string;
  documentsUsed: number;
  documentsLimit: number;
  aiMessagesPerDoc: number;
  canUpload: boolean;
}

const FILE_TYPE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  docx: FileType,
  text: File,
  url: Globe,
};

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
  docx: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  text: "bg-zinc-100 text-zinc-600 dark:bg-zinc-950/40 dark:text-zinc-400",
  url: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface DocumentLibraryProps {
  initialDocuments: Document[];
  limits: LibraryLimits;
}

export function DocumentLibrary({ initialDocuments, limits }: DocumentLibraryProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);

  const filtered = search.trim()
    ? documents.filter((d) =>
        d.title.toLowerCase().includes(search.toLowerCase())
      )
    : documents;

  function handleUploaded(doc: Document) {
    setDocuments((prev) => [doc, ...prev]);
    router.push(`/learn/${doc.id}`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-primary" />
            Learning Hub
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Upload documents and study with AI assistance
          </p>
        </div>
        <div className="flex items-center gap-3">
          {limits.documentsLimit !== -1 && (
            <Badge variant="secondary" className="text-xs">
              {limits.documentsUsed}/{limits.documentsLimit} documents
            </Badge>
          )}
          <Button
            onClick={() => setUploadOpen(true)}
            disabled={!limits.canUpload}
            className="rounded-xl gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Search */}
      {documents.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
      )}

      {/* Document grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            {search ? (
              <Search className="w-8 h-8 text-primary/40" />
            ) : (
              <Upload className="w-8 h-8 text-primary/40" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {search ? "No documents match your search" : "No documents yet"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {search
                ? "Try a different search term"
                : "Upload a PDF, Word doc, text file, or paste a URL to start studying with AI assistance."}
            </p>
          </div>
          {!search && (
            <Button
              onClick={() => setUploadOpen(true)}
              disabled={!limits.canUpload}
              className="rounded-xl gap-1.5"
            >
              <Upload className="w-4 h-4" />
              Upload Your First Document
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => {
            const Icon = FILE_TYPE_ICONS[doc.fileType] || FileText;
            const colorClass = FILE_TYPE_COLORS[doc.fileType] || FILE_TYPE_COLORS.text;

            return (
              <Link key={doc.id} href={`/learn/${doc.id}`}>
                <Card className="border-border/60 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all group cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", colorClass)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                          {doc.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="secondary" className="text-[10px] uppercase">
                            {doc.fileType}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {doc.wordCount.toLocaleString()} words
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(doc.createdAt)}
                      </span>
                      <span className="text-[11px] text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Sparkles className="w-3 h-3" />
                        Study with AI
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploaded={handleUploaded}
        canUpload={limits.canUpload}
      />
    </div>
  );
}
