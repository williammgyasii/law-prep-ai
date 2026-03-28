"use client";

import { useState, useTransition } from "react";
import { updateProgress } from "@/actions/progress";
import { Button } from "@/components/ui/button";
import { PROGRESS_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ProgressControlsProps {
  resourceId: string;
  currentStatus: string;
}

export function ResourceProgressControls({ resourceId, currentStatus }: ProgressControlsProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    startTransition(async () => {
      await updateProgress(
        resourceId,
        newStatus as "not_started" | "in_progress" | "completed" | "review_later"
      );
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PROGRESS_STATUSES.map((s) => (
        <Button
          key={s.value}
          variant={status === s.value ? "default" : "outline"}
          size="sm"
          disabled={isPending}
          onClick={() => handleStatusChange(s.value)}
          className={cn(status === s.value && "pointer-events-none")}
        >
          {s.label}
        </Button>
      ))}
    </div>
  );
}
