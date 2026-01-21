import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface StatusCountersProps {
  activeCount: number;
  pausedCount: number;
  cancelledCount: number;
  isLoading?: boolean;
}

export function StatusCounters({
  activeCount,
  pausedCount,
  cancelledCount,
  isLoading,
}: StatusCountersProps) {
  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Statusy subskrypcji">
      <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/25 dark:text-green-400">
        Aktywne: {activeCount}
      </Badge>
      <Badge className="bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 dark:text-yellow-400">
        Wstrzymane: {pausedCount}
      </Badge>
      <Badge className="bg-red-500/15 text-red-700 hover:bg-red-500/25 dark:text-red-400">
        Anulowane: {cancelledCount}
      </Badge>
    </div>
  );
}
