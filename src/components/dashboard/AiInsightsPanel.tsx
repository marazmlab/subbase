import { useState, useCallback, useId } from "react";
import { ChevronDown, Sparkles, Loader2, AlertCircle } from "lucide-react";

import type { SubscriptionDTO, AIInsightsDataDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { InsightItem } from "./InsightItem";

interface AiInsightsPanelProps {
  subscriptions: SubscriptionDTO[];
  aiInsights: AIInsightsDataDTO | null;
  isGenerating: boolean;
  error: string | null;
  onGenerateInsights: (subscriptionIds?: string[]) => Promise<void>;
}

function formatTimestamp(isoString: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoString));
}

export function AiInsightsPanel({
  subscriptions,
  aiInsights,
  isGenerating,
  error,
  onGenerateInsights,
}: AiInsightsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const headingId = useId();

  const handleGenerate = useCallback(async () => {
    // Generuj dla wszystkich aktywnych subskrypcji
    await onGenerateInsights();
  }, [onGenerateInsights]);

  const hasSubscriptions = subscriptions.length > 0;

  return (
    <Card data-testid="ai-insights-panel">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="p-0">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50 sm:p-6"
              aria-expanded={isExpanded}
              aria-controls="ai-insights-content"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                <h2 id={headingId} className="text-lg font-semibold">
                  Wglądy AI
                </h2>
              </div>
              <ChevronDown
                className={cn("size-5 text-muted-foreground transition-transform duration-200", {
                  "rotate-180": isExpanded,
                })}
              />
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent id="ai-insights-content">
          <CardContent className="space-y-3 border-t pt-3 sm:space-y-4 sm:pt-4">
            {/* Generate button */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {hasSubscriptions
                  ? "Wygeneruj analizę swoich subskrypcji za pomocą AI."
                  : "Dodaj subskrypcje, aby móc wygenerować wglądy AI."}
              </p>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !hasSubscriptions}
                size="sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Generowanie...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generuj wglądy AI
                  </>
                )}
              </Button>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Insights list */}
            {aiInsights && aiInsights.insights.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                {aiInsights.insights.map((insight, index) => (
                  <InsightItem key={index} insight={insight} />
                ))}
              </div>
            )}

            {/* Empty insights state */}
            {aiInsights && aiInsights.insights.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                Brak wglądów do wyświetlenia.
              </p>
            )}

            {/* Footer with timestamp and disclaimer */}
            {aiInsights && (
              <div className="space-y-1.5 border-t pt-3 text-xs text-muted-foreground sm:space-y-2 sm:pt-4">
                <p>
                  Wygenerowano: {formatTimestamp(aiInsights.generated_at)} • Przeanalizowano{" "}
                  {aiInsights.subscription_count}{" "}
                  {aiInsights.subscription_count === 1 ? "subskrypcję" : "subskrypcji"}
                </p>
                <p className="italic">
                  Uwaga: Wglądy są generowane przez AI i mają charakter informacyjny. Zawsze
                  weryfikuj sugestie przed podjęciem decyzji finansowych.
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
