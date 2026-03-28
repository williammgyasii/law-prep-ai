"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import {
  FileText,
  Globe,
  ExternalLink,
  Sparkles,
  ListChecks,
  Layers,
  HelpCircle,
  Trash2,
  Loader2,
  RefreshCw,
  Upload,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  summarizeDocument,
  extractKeyPoints,
  generateFlashcards,
  deleteDocument,
  quizFromDocument,
} from "@/actions/learn";
import type { Document } from "@/db/schema";
import type { DocumentWithChats } from "./learn-workspace";

interface DocumentViewerProps {
  document: Document | null;
  documentDetail: DocumentWithChats | null;
  loading: boolean;
  onDeleted: (docId: string) => void;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export function DocumentViewer({ document, documentDetail, loading, onDeleted }: DocumentViewerProps) {
  const [activeTab, setActiveTab] = useState("content");
  const [summary, setSummary] = useState<string | null>(null);
  const [keyPoints, setKeyPoints] = useState<string[] | null>(null);
  const [flashcards, setFlashcards] = useState<{ front: string; back: string }[] | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizRevealed, setQuizRevealed] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const doc = documentDetail ?? document;

  const prevDocIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (doc?.id !== prevDocIdRef.current) {
      prevDocIdRef.current = doc?.id ?? null;
      setSummary(documentDetail?.summary ?? null);
      setKeyPoints(documentDetail?.keyPoints ?? null);
      setFlashcards(documentDetail?.flashcards ?? null);
      setQuiz(null);
      setFlippedCards(new Set());
      setQuizAnswers({});
      setQuizRevealed(false);
      setActiveTab("content");
    }
  }, [doc?.id, documentDetail]);

  if (!doc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-primary/40" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Learning Hub</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Select a document from the left panel or upload a new one to start studying with AI assistance.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Upload className="w-3.5 h-3.5" />
            Upload PDFs, DOCX, or URLs
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5" />
            AI summaries & flashcards
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleGenerate = (type: string) => {
    if (!doc) return;
    setGenerating(type);
    startTransition(async () => {
      try {
        if (type === "summary") {
          const result = await summarizeDocument(doc.id);
          if (result.summary) setSummary(result.summary);
        } else if (type === "keypoints") {
          const result = await extractKeyPoints(doc.id);
          if (result.keyPoints) setKeyPoints(result.keyPoints);
        } else if (type === "flashcards") {
          const result = await generateFlashcards(doc.id);
          if (result.flashcards) {
            setFlashcards(result.flashcards);
            setFlippedCards(new Set());
          }
        } else if (type === "quiz") {
          const result = await quizFromDocument(doc.id);
          if (result.questions) {
            setQuiz(result.questions);
            setQuizAnswers({});
            setQuizRevealed(false);
          }
        }
      } finally {
        setGenerating(null);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteDocument(doc.id);
      onDeleted(doc.id);
    });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Document header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold truncate">{doc.title}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="secondary" className="text-[10px]">
              {doc.fileType.toUpperCase()}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {doc.wordCount.toLocaleString()} words
            </span>
            {doc.fileType === "url" && doc.fileUrl && (
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                Source
              </a>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs gap-1 text-destructive hover:text-destructive shrink-0"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Delete</span>
        </Button>
      </div>

      {/* Tabs for content + AI tools */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-2 border-b border-border/50">
          <TabsList className="h-8 bg-transparent p-0 gap-0">
            <TabsTrigger value="content" className="text-xs h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3">
              Content
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              className="text-xs h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 gap-1"
              onClick={() => !summary && !generating && handleGenerate("summary")}
            >
              <Sparkles className="w-3 h-3" />
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="keypoints"
              className="text-xs h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 gap-1"
              onClick={() => !keyPoints && !generating && handleGenerate("keypoints")}
            >
              <ListChecks className="w-3 h-3" />
              Key Points
            </TabsTrigger>
            <TabsTrigger
              value="flashcards"
              className="text-xs h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 gap-1"
              onClick={() => !flashcards && !generating && handleGenerate("flashcards")}
            >
              <Layers className="w-3 h-3" />
              Flashcards
            </TabsTrigger>
            <TabsTrigger
              value="quiz"
              className="text-xs h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 gap-1"
              onClick={() => !quiz && !generating && handleGenerate("quiz")}
            >
              <HelpCircle className="w-3 h-3" />
              Quiz
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="content" className="flex-1 overflow-y-auto m-0 p-4">
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
        </TabsContent>

        <TabsContent value="summary" className="flex-1 overflow-y-auto m-0 p-4">
          {generating === "summary" ? (
            <LoadingState label="Generating summary..." />
          ) : summary ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Summary
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs gap-1 h-7"
                  onClick={() => handleGenerate("summary")}
                  disabled={!!generating}
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </Button>
              </div>
              <div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                {summary}
              </div>
            </div>
          ) : (
            <EmptyAiState label="Click to generate a summary" icon={Sparkles} onGenerate={() => handleGenerate("summary")} />
          )}
        </TabsContent>

        <TabsContent value="keypoints" className="flex-1 overflow-y-auto m-0 p-4">
          {generating === "keypoints" ? (
            <LoadingState label="Extracting key points..." />
          ) : keyPoints && keyPoints.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4 text-emerald-600" />
                  Key Points
                  <Badge variant="secondary" className="text-[10px]">{keyPoints.length}</Badge>
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs gap-1 h-7"
                  onClick={() => handleGenerate("keypoints")}
                  disabled={!!generating}
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </Button>
              </div>
              <ul className="space-y-2.5">
                {keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-foreground/80 leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <EmptyAiState label="Click to extract key points" icon={ListChecks} onGenerate={() => handleGenerate("keypoints")} />
          )}
        </TabsContent>

        <TabsContent value="flashcards" className="flex-1 overflow-y-auto m-0 p-4">
          {generating === "flashcards" ? (
            <LoadingState label="Generating flashcards..." />
          ) : flashcards && flashcards.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-violet-600" />
                  Flashcards
                  <Badge variant="secondary" className="text-[10px]">{flashcards.length}</Badge>
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs gap-1 h-7"
                  onClick={() => handleGenerate("flashcards")}
                  disabled={!!generating}
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {flashcards.map((card, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setFlippedCards((prev) => {
                        const next = new Set(prev);
                        if (next.has(i)) next.delete(i); else next.add(i);
                        return next;
                      });
                    }}
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
            </div>
          ) : (
            <EmptyAiState label="Click to generate flashcards" icon={Layers} onGenerate={() => handleGenerate("flashcards")} />
          )}
        </TabsContent>

        <TabsContent value="quiz" className="flex-1 overflow-y-auto m-0 p-4">
          {generating === "quiz" ? (
            <LoadingState label="Generating quiz questions..." />
          ) : quiz && quiz.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  Quiz
                  <Badge variant="secondary" className="text-[10px]">{quiz.length} questions</Badge>
                </h4>
                <div className="flex gap-1.5">
                  {!quizRevealed && Object.keys(quizAnswers).length === quiz.length && (
                    <Button
                      size="sm"
                      className="text-xs gap-1 h-7"
                      onClick={() => setQuizRevealed(true)}
                    >
                      Check Answers
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs gap-1 h-7"
                    onClick={() => handleGenerate("quiz")}
                    disabled={!!generating}
                  >
                    <RefreshCw className="w-3 h-3" />
                    New Quiz
                  </Button>
                </div>
              </div>
              {quizRevealed && (
                <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  Score: {quiz.filter((q, i) => quizAnswers[i] === q.correctIndex).length}/{quiz.length}
                </div>
              )}
              <div className="space-y-4">
                {quiz.map((q, qi) => (
                  <div key={qi} className="rounded-xl border border-border/50 p-4 space-y-2.5">
                    <p className="text-sm font-medium">
                      <span className="text-muted-foreground mr-1.5">{qi + 1}.</span>
                      {q.question}
                    </p>
                    <div className="space-y-1.5">
                      {q.options.map((opt, oi) => {
                        const selected = quizAnswers[qi] === oi;
                        const isCorrect = q.correctIndex === oi;
                        let optClass = "border-border/50 hover:border-primary/30";
                        if (quizRevealed) {
                          if (isCorrect) optClass = "border-emerald-500 bg-emerald-50 text-emerald-800";
                          else if (selected) optClass = "border-red-400 bg-red-50 text-red-800";
                        } else if (selected) {
                          optClass = "border-primary bg-primary/5";
                        }
                        return (
                          <button
                            key={oi}
                            onClick={() => !quizRevealed && setQuizAnswers((prev) => ({ ...prev, [qi]: oi }))}
                            disabled={quizRevealed}
                            className={cn(
                              "w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors",
                              optClass
                            )}
                          >
                            <span className="font-medium mr-1.5 text-muted-foreground">
                              {String.fromCharCode(65 + oi)}.
                            </span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyAiState label="Click to generate a quiz" icon={HelpCircle} onGenerate={() => handleGenerate("quiz")} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function EmptyAiState({
  label,
  icon: Icon,
  onGenerate,
}: {
  label: string;
  icon: React.ElementType;
  onGenerate: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <Icon className="w-8 h-8 text-muted-foreground/20" />
      <p className="text-sm text-muted-foreground">{label}</p>
      <Button size="sm" variant="outline" className="text-xs rounded-lg gap-1" onClick={onGenerate}>
        <Sparkles className="w-3 h-3" />
        Generate
      </Button>
    </div>
  );
}
