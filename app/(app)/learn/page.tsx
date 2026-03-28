import Link from "next/link";
import {
  FileText,
  FolderOpen,
  Clock,
  Trash2,
  ChevronRight,
  FileType,
  Globe,
  File,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserDocuments, getDocumentLimits } from "@/actions/learn";
import { DocumentUpload } from "@/components/document-upload";
import { UpgradePrompt } from "@/components/upgrade-prompt";

const FILE_TYPE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  docx: FileType,
  text: File,
  url: Globe,
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default async function LearnPage() {
  const [docs, limits] = await Promise.all([
    getUserDocuments(),
    getDocumentLimits(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            Learning Hub
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Upload documents, articles, and case briefs for AI-assisted study
          </p>
        </div>
        {limits.documentsLimit !== -1 && (
          <Badge variant="secondary" className="text-xs">
            {limits.documentsUsed}/{limits.documentsLimit} documents
          </Badge>
        )}
      </div>

      <DocumentUpload canUpload={limits.canUpload} />

      {!limits.canUpload && (
        <UpgradePrompt
          feature="Upload More Documents"
          description={`You've reached your ${limits.documentsLimit} document limit. Upgrade for more uploads.`}
          currentTier={limits.tier}
          compact
        />
      )}

      {docs.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <FolderOpen className="w-12 h-12 text-muted-foreground/20" />
            <div className="text-center">
              <p className="text-sm font-medium">No documents yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Upload a PDF, Word doc, text file, or paste a URL to get started with AI-assisted learning.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {docs.map((doc) => {
            const Icon = FILE_TYPE_ICONS[doc.fileType] || FileText;
            return (
              <Link key={doc.id} href={`/learn/${doc.id}`} className="group">
                <Card className="border-border/50 hover:border-primary/30 transition-all h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {doc.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px]">
                            {doc.fileType.toUpperCase()}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {doc.wordCount.toLocaleString()} words
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {timeAgo(doc.createdAt)}
                          {doc.summary && (
                            <Badge variant="secondary" className="text-[9px] ml-1">
                              Summarized
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
