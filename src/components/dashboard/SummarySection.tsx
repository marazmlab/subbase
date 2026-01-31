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
    <section aria-labelledby={headingId} className="space-y-3 sm:space-y-4" data-testid="summary-section">
      <h2 id={headingId} className="text-lg font-semibold">
        Podsumowanie
      </h2>

      {/* Status Counters - displayed above cost cards */}
      <div className="flex items-center">
        <StatusCounters
          activeCount={summary?.active_count ?? 0}
          pausedCount={summary?.paused_count ?? 0}
          cancelledCount={summary?.cancelled_count ?? 0}
          isLoading={isLoading}
        />
      </div>

      {/* Cost Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
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
      </div>
    </section>
  );
}
