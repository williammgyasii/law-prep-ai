"use client";

import { useEffect, useRef } from "react";
import { ensureInProgress } from "@/actions/progress";

interface AutoProgressProps {
  resourceId: string;
  currentStatus: string;
}

export function AutoProgress({ resourceId, currentStatus }: AutoProgressProps) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    if (currentStatus === "not_started") {
      hasRun.current = true;
      ensureInProgress(resourceId);
    }
  }, [resourceId, currentStatus]);

  return null;
}
