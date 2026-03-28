"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Link2, Loader2, X, File } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Document } from "@/db/schema";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded: (doc: Document) => void;
  canUpload: boolean;
}

export function UploadDialog({ open, onOpenChange, onUploaded, canUpload }: UploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"file" | "url">("file");
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = useCallback(async (file: File) => {
    if (!canUpload) return;
    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }

      onUploaded(data.document);
      onOpenChange(false);
      setUrl("");
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [canUpload, onUploaded, onOpenChange]);

  const handleUrlSubmit = async () => {
    if (!canUpload || !url.trim()) return;
    setError("");
    setUploading(true);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch URL");
        return;
      }

      onUploaded(data.document);
      onOpenChange(false);
      setUrl("");
    } catch {
      setError("Failed to fetch URL. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Upload Document</DialogTitle>
          <DialogDescription>
            Add a PDF, Word doc, text file, or paste a URL.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-1 p-0.5 rounded-lg bg-muted/50 w-fit">
            <button
              onClick={() => setMode("file")}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-all",
                mode === "file" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <File className="w-3 h-3 inline mr-1" />
              File
            </button>
            <button
              onClick={() => setMode("url")}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-all",
                mode === "url" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Link2 className="w-3 h-3 inline mr-1" />
              URL
            </button>
          </div>

          {mode === "file" ? (
            <div
              className={cn(
                "border-dashed border-2 rounded-xl transition-all cursor-pointer p-6",
                dragOver ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30",
                uploading && "pointer-events-none opacity-60"
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleUpload(file);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-muted-foreground/50" />
                )}
                <p className="text-sm font-medium">
                  {uploading ? "Processing..." : "Drop a file or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground">PDF, DOCX, TXT, or Markdown</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Paste an article URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                disabled={uploading}
                className="flex-1 rounded-lg"
              />
              <Button
                onClick={handleUrlSubmit}
                disabled={uploading || !url.trim()}
                size="sm"
                className="rounded-lg"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md,.markdown"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="hidden"
          />

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              <X className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
