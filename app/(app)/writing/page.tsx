import { PenLine } from "lucide-react";
import { getWritingPrompts, getWritingStats, getWritingAttempts } from "@/actions/writing";
import { WritingHub } from "@/components/writing/writing-hub";
import { Badge } from "@/components/ui/badge";
import { UpgradePrompt } from "@/components/shared/upgrade-prompt";
import type { Tier } from "@/lib/tiers";

export default async function WritingPage() {
  const [promptsResult, stats, attempts] = await Promise.all([
    getWritingPrompts(),
    getWritingStats(),
    getWritingAttempts(),
  ]);

  const { prompts, tier, limited, totalAvailable } = promptsResult;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <PenLine className="w-6 h-6 text-violet-600" />
            LSAT Writing
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Practice argumentative writing in the official LSAT format — 15 min prewriting + 35 min essay
          </p>
        </div>
        {stats.completedAttempts > 0 && (
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs py-1 px-2.5">
              {stats.completedAttempts} completed
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs py-1 px-2.5 text-violet-700 bg-violet-50"
            >
              {stats.avgWordCount} avg words
            </Badge>
          </div>
        )}
      </div>

      {limited && (
        <UpgradePrompt
          feature="Unlock All Writing Prompts"
          description={`You have access to ${prompts.length} of ${totalAvailable} prompts. Upgrade for more.`}
          currentTier={tier as Tier}
          compact
        />
      )}

      <WritingHub prompts={prompts} stats={stats} attempts={attempts} />
    </div>
  );
}
