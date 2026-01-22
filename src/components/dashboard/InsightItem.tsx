import { memo } from "react";
import { Lightbulb } from "lucide-react";

import type { AIInsightDTO } from "@/types";

interface InsightItemProps {
  insight: AIInsightDTO;
}

export const InsightItem = memo(function InsightItem({ insight }: InsightItemProps) {
  return (
    <div className="flex gap-2.5 rounded-lg border bg-muted/30 p-2.5 sm:gap-3 sm:p-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Lightbulb className="size-4 text-primary" />
      </div>
      <p className="text-sm leading-relaxed">{insight.message}</p>
    </div>
  );
});
