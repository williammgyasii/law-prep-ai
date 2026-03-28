import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PROGRESS_STATUSES, DIFFICULTIES, RESOURCE_TYPES } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  const config = PROGRESS_STATUSES.find((s) => s.value === status);
  if (!config) return null;
  return (
    <Badge variant="secondary" className={cn("font-medium", config.color)}>
      {config.label}
    </Badge>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const config = DIFFICULTIES.find((d) => d.value === difficulty);
  if (!config) return null;
  return (
    <Badge variant="secondary" className={cn("font-medium", config.color)}>
      {config.label}
    </Badge>
  );
}

export function TypeBadge({ type }: { type: string }) {
  const config = RESOURCE_TYPES.find((t) => t.value === type);
  if (!config) return null;
  return (
    <Badge variant="outline" className="font-medium">
      {config.label}
    </Badge>
  );
}
