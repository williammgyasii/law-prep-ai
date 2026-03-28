"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ListChecks,
  Layers,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  summarizeDocument,
  extractKeyPoints,
  generateFlashcards,
  deleteDocument,
} from "@/actions/learn";

interface DocumentActionsProps {
  documentId: string;
  initialDoc: {
    summary: string | null;
    keyPoints: string[] | null;
    flashcards: { front: string; back: string }[] | null;
  };
}

export function DocumentActions({ documentId, initialDoc }: DocumentActionsProps) {
  const router = useRouter();
  const [summary, setSummary] = useState(initialDoc.summary);
  const [keyPoints, setKeyPoints] = useState(initialDoc.keyPoints);
  const [flashcards, setFlashcards] = useState(initialDoc.flashcards);
  const [loading, setLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  const handleSummarize = async () => {
    setLoading("summary");
    const result = await summarizeDocument(documentId);
    if (result.summary) setSummary(result.summary);
    setLoading(null);
    setExpanded("summary");
  };

  const handleKeyPoints = async () => {
    setLoading("keypoints");
    const result = await extractKeyPoints(documentId);
    if (result.keyPoints) setKeyPoints(result.keyPoints);
    setLoading(null);
    setExpanded("keypoints");
  };

  const handleFlashcards = async () => {
    setLoading("flashcards");
    const result = await generateFlashcards(documentId);
    if (result.flashcards) setFlashcards(result.flashcards);
    setLoading(null);
    setExpanded("flashcards");
  };

  const handleDelete = async () => {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    await deleteDocument(documentId);
    router.push("/learn");
    router.refresh();
  };

  const toggleFlip = (idx: number) => {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="space-y-3 mb-4">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="rounded-lg text-xs gap-1.5"
          onClick={handleSummarize}
          disabled={loading !== null}
        >
          {loading === "summary" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {summary ? "Re-summarize" : "Summarize"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-lg text-xs gap-1.5"
          onClick={handleKeyPoints}
          disabled={loading !== null}
        >
          {loading === "keypoints" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ListChecks className="w-3.5 h-3.5" />}
          Key Points
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-lg text-xs gap-1.5"
          onClick={handleFlashcards}
          disabled={loading !== null}
        >
          {loading === "flashcards" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
          Flashcards
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-lg text-xs gap-1.5 text-destructive hover:text-destructive ml-auto"
          onClick={handleDelete}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </Button>
      </div>

      {/* Summary */}
      {summary && (
        <Card className="border-border/50">
          <CardHeader
            className="pb-0 cursor-pointer"
            onClick={() => setExpanded(expanded === "summary" ? null : "summary")}
          >
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Summary
              {expanded === "summary" ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
            </CardTitle>
          </CardHeader>
          {expanded === "summary" && (
            <CardContent className="pt-3">
              <div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                {summary}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Key Points */}
      {keyPoints && keyPoints.length > 0 && (
        <Card className="border-border/50">
          <CardHeader
            className="pb-0 cursor-pointer"
            onClick={() => setExpanded(expanded === "keypoints" ? null : "keypoints")}
          >
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-emerald-600" />
              Key Points
              <Badge variant="secondary" className="text-[10px] ml-1">{keyPoints.length}</Badge>
              {expanded === "keypoints" ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
            </CardTitle>
          </CardHeader>
          {expanded === "keypoints" && (
            <CardContent className="pt-3">
              <ul className="space-y-2">
                {keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-foreground/80 leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          )}
        </Card>
      )}

      {/* Flashcards */}
      {flashcards && flashcards.length > 0 && (
        <Card className="border-border/50">
          <CardHeader
            className="pb-0 cursor-pointer"
            onClick={() => setExpanded(expanded === "flashcards" ? null : "flashcards")}
          >
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-600" />
              Flashcards
              <Badge variant="secondary" className="text-[10px] ml-1">{flashcards.length}</Badge>
              {expanded === "flashcards" ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
            </CardTitle>
          </CardHeader>
          {expanded === "flashcards" && (
            <CardContent className="pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {flashcards.map((card, i) => (
                  <button
                    key={i}
                    onClick={() => toggleFlip(i)}
                    className="text-left p-3 rounded-xl border border-border/50 hover:border-primary/30 transition-all min-h-[80px]"
                  >
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      {flippedCards.has(i) ? "Answer" : "Question"}
                    </p>
                    <p className="text-sm leading-relaxed">
                      {flippedCards.has(i) ? card.back : card.front}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Click to {flippedCards.has(i) ? "see question" : "reveal answer"}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
