import { useCallback } from "react";

import type { SubscriptionDTO } from "@/types";
import { Table, TableHeader, TableBody, TableHead, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { SubscriptionItemRow, SubscriptionItemCard } from "./SubscriptionItem";

interface SubscriptionListProps {
  subscriptions: SubscriptionDTO[];
  isLoading: boolean;
  onEdit: (subscription: SubscriptionDTO) => void;
  onDelete: (subscription: SubscriptionDTO) => void;
}

function SubscriptionListSkeleton() {
  return (
    <>
      {/* Desktop skeleton */}
      <div className="hidden md:block">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>

      {/* Mobile skeleton */}
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl sm:h-32" />
        ))}
      </div>
    </>
  );
}

export function SubscriptionList({
  subscriptions,
  isLoading,
  onEdit,
  onDelete,
}: SubscriptionListProps) {
  const handleEdit = useCallback(
    (subscription: SubscriptionDTO) => () => onEdit(subscription),
    [onEdit]
  );

  const handleDelete = useCallback(
    (subscription: SubscriptionDTO) => () => onDelete(subscription),
    [onDelete]
  );

  if (isLoading) {
    return <SubscriptionListSkeleton />;
  }

  if (subscriptions.length === 0) {
    return null;
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nazwa</TableHead>
              <TableHead>Koszt</TableHead>
              <TableHead>Cykl</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Następne rozliczenie</TableHead>
              <TableHead className="w-[100px]">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((subscription) => (
              <SubscriptionItemRow
                key={subscription.id}
                subscription={subscription}
                onEdit={handleEdit(subscription)}
                onDelete={handleDelete(subscription)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {subscriptions.map((subscription) => (
          <SubscriptionItemCard
            key={subscription.id}
            subscription={subscription}
            onEdit={handleEdit(subscription)}
            onDelete={handleDelete(subscription)}
          />
        ))}
      </div>
    </>
  );
}
