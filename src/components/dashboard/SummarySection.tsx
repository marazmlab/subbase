import { useId } from "react";

import type { SubscriptionSummaryDTO } from "@/types";
import { SummaryCard } from "./SummaryCard";
import { StatusCounters } from "./StatusCounters";

interface SummarySectionProps {
  summary: SubscriptionSummaryDTO | null;
  isLoading: boolean;
}

export function SummarySection({ summary, isLoading }: SummarySectionProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <h2 id={headingId} className="text-lg font-semibold">
        Podsumowanie
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          label="Koszt miesięczny"
          value={summary?.monthly_total ?? 0}
          currency={summary?.currency ?? "PLN"}
          isLoading={isLoading}
        />
        <SummaryCard
          label="Koszt roczny"
          value={summary?.yearly_total ?? 0}
          currency={summary?.currency ?? "PLN"}
          isLoading={isLoading}
        />
        <div className="flex items-center sm:col-span-2 lg:col-span-1">
          <StatusCounters
            activeCount={summary?.active_count ?? 0}
            pausedCount={summary?.paused_count ?? 0}
            cancelledCount={summary?.cancelled_count ?? 0}
            isLoading={isLoading}
          />
        </div>
      </div>
    </section>
  );
}
