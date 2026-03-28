"use client";

import { useState, useTransition } from "react";
import { aiSummarize, aiExplain, aiQuiz } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, BookOpen, HelpCircle, Loader2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIPanelProps {
  title: string;
  type: string;
  notes: string;
  tags: string[];
}

const tools = [
  { key: "summary" as const, label: "Summarize", icon: Sparkles, description: "Get a concise summary" },
  { key: "explain" as const, label: "Explain", icon: BookOpen, description: "Simplified explanation" },
  { key: "quiz" as const, label: "Quiz Me", icon: HelpCircle, description: "Test your knowledge" },
];

export function AIPanel({ title, type, notes, tags }: AIPanelProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "explain" | "quiz" | null>(null);
  const [result, setResult] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  function handleAction(action: "summary" | "explain" | "quiz") {
    setActiveTab(action);
    startTransition(async () => {
      let response: string;
      switch (action) {
        case "summary":
          response = await aiSummarize(notes || `Topic: ${title}`);
          break;
        case "explain":
          response = await aiExplain(title, notes || "No notes yet", tags);
          break;
        case "quiz":
          response = await aiQuiz(title, type, notes || "No notes yet", tags);
          break;
      }
      setResult(response);
    });
  }

  return (
    <Card className="border-border/60 overflow-hidden">
      <CardHeader className="pb-3 bg-linear-to-br from-primary/4 to-transparent">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wand2 className="w-3.5 h-3.5 text-primary" />
          </div>
          AI Study Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-3 gap-1.5">
          {tools.map((tool) => (
            <button
              key={tool.key}
              onClick={() => handleAction(tool.key)}
              disabled={isPending}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all duration-150",
                activeTab === tool.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <tool.icon className="w-4 h-4" />
              <span className="text-[11px] font-medium leading-tight">{tool.label}</span>
            </button>
          ))}
        </div>

        {isPending && (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
            <span className="text-xs font-medium">Generating...</span>
          </div>
        )}

        {!isPending && result && (
          <div className="rounded-xl bg-muted/30 border border-border/40 p-4 max-h-[400px] overflow-y-auto">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{result}</div>
          </div>
        )}

        {!isPending && !result && (
          <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
            <div className="w-10 h-10 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs text-center max-w-[200px]">
              Select a tool above to get AI-powered study help
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
