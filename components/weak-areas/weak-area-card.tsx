"use client";

import { useTransition, useState } from "react";
import { updateWeakArea, deleteWeakArea } from "@/actions/weak-areas";
import { aiSuggestNext } from "@/actions/ai";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Loader2, Sparkles, ChevronUp, ChevronDown } from "lucide-react";

interface WeakAreaCardProps {
  id: string;
  title: string;
  description: string;
  confidenceScore: number;
  moduleName?: string;
}

export function WeakAreaCard({ id, title, description, confidenceScore, moduleName }: WeakAreaCardProps) {
  const [isPending, startTransition] = useTransition();
  const [aiTip, setAiTip] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [score, setScore] = useState(confidenceScore);

  function handleDelete() {
    startTransition(async () => {
      await deleteWeakArea(id);
    });
  }

  function adjustConfidence(delta: number) {
    const newScore = Math.min(5, Math.max(1, score + delta));
    setScore(newScore);
    startTransition(async () => {
      await updateWeakArea(id, { confidenceScore: newScore });
    });
  }

  async function getAiTip() {
    setLoadingAi(true);
    const tip = await aiSuggestNext();
    setAiTip(tip);
    setLoadingAi(false);
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              {moduleName && (
                <Badge variant="secondary" className="text-xs">
                  {moduleName}
                </Badge>
              )}
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Confidence:</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        i <= score ? "bg-amber-400" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex ml-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => adjustConfidence(-1)}
                    disabled={isPending || score <= 1}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => adjustConfidence(1)}
                    disabled={isPending || score >= 5}
                  >
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={getAiTip}
              disabled={loadingAi}
            >
              {loadingAi ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-primary" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {aiTip && (
          <div className="mt-3 rounded-lg bg-primary/5 border border-primary/10 p-3">
            <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Recommendation
            </p>
            <p className="text-sm whitespace-pre-wrap">{aiTip}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
