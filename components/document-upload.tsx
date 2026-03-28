"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Link2, Loader2, X, File } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  canUpload: boolean;
  onLimitReached?: () => void;
}

export function DocumentUpload({ canUpload, onLimitReached }: DocumentUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"file" | "url">("file");
  const [url, setUrl] = useState("");

  const handleUpload = useCallback(async (file: File) => {
    if (!canUpload) {
      onLimitReached?.();
      return;
    }

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

      router.push(`/learn/${data.document.id}`);
      router.refresh();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [canUpload, onLimitReached, router]);

  const handleUrlSubmit = async () => {
    if (!canUpload) {
      onLimitReached?.();
      return;
    }
    if (!url.trim()) return;

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

      setUrl("");
      router.push(`/learn/${data.document.id}`);
      router.refresh();
    } catch {
      setError("Failed to fetch URL. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
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
        <Card
          className={cn(
            "border-dashed border-2 transition-all cursor-pointer",
            dragOver ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30",
            uploading && "pointer-events-none opacity-60"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-8 gap-2">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-muted-foreground/50" />
            )}
            <div className="text-center">
              <p className="text-sm font-medium">
                {uploading ? "Processing..." : "Drop a file here or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOCX, TXT, or Markdown
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="Paste an article URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
            disabled={uploading}
            className="flex-1"
          />
          <Button
            onClick={handleUrlSubmit}
            disabled={uploading || !url.trim()}
            size="sm"
            className="rounded-lg"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            Fetch
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md,.markdown"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          <X className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
