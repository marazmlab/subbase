import { memo } from "react";
import { Pencil, Trash2 } from "lucide-react";

import type { SubscriptionDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableRow, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

interface SubscriptionItemProps {
  subscription: SubscriptionDTO;
  onEdit: () => void;
  onDelete: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  active: "Aktywna",
  paused: "Wstrzymana",
  cancelled: "Anulowana",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/15 text-green-700 dark:text-green-400",
  paused: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  cancelled: "bg-red-500/15 text-red-700 dark:text-red-400",
};

const CYCLE_LABELS: Record<string, string> = {
  monthly: "Miesięcznie",
  yearly: "Rocznie",
};

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "—";

  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateString));
}

/** Desktop version - table row */
export const SubscriptionItemRow = memo(function SubscriptionItemRow({
  subscription,
  onEdit,
  onDelete,
}: SubscriptionItemProps) {
  return (
    <TableRow data-testid="subscription-item">
      <TableCell className="font-medium">{subscription.name}</TableCell>
      <TableCell>{formatCurrency(subscription.cost, subscription.currency)}</TableCell>
      <TableCell>
        <Badge variant="outline">{CYCLE_LABELS[subscription.billing_cycle]}</Badge>
      </TableCell>
      <TableCell>
        <Badge className={STATUS_COLORS[subscription.status]}>
          {STATUS_LABELS[subscription.status]}
        </Badge>
      </TableCell>
      <TableCell>{formatDate(subscription.next_billing_date)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label={`Edytuj ${subscription.name}`}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label={`Usuń ${subscription.name}`}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

/** Mobile version - card */
export const SubscriptionItemCard = memo(function SubscriptionItemCard({
  subscription,
  onEdit,
  onDelete,
}: SubscriptionItemProps) {
  return (
    <Card data-testid="subscription-item">
      <CardContent className="pt-2">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
            <h3 className="truncate font-medium">{subscription.name}</h3>
            <p className="text-base font-bold sm:text-lg">
              {formatCurrency(subscription.cost, subscription.currency)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onEdit}
              aria-label={`Edytuj ${subscription.name}`}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onDelete}
              aria-label={`Usuń ${subscription.name}`}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-3">
          <Badge variant="outline">{CYCLE_LABELS[subscription.billing_cycle]}</Badge>
          <Badge className={STATUS_COLORS[subscription.status]}>
            {STATUS_LABELS[subscription.status]}
          </Badge>
        </div>

        {subscription.next_billing_date && (
          <p className="mt-1.5 text-sm text-muted-foreground sm:mt-2">
            Następne rozliczenie: {formatDate(subscription.next_billing_date)}
          </p>
        )}
      </CardContent>
    </Card>
  );
});
