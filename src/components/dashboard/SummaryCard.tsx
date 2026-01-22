import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SummaryCardProps {
  label: string;
  value: number;
  currency: string;
  isLoading?: boolean;
}

export function SummaryCard({ label, value, currency, isLoading }: SummaryCardProps) {
  const formattedValue = new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <Skeleton className="mb-1.5 h-4 w-24 sm:mb-2" />
          <Skeleton className="h-7 w-32 sm:h-8" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4 sm:pt-6">
        <p className="mb-1 text-sm text-muted-foreground sm:mb-1.5">{label}</p>
        <p className="text-xl font-bold sm:text-2xl">{formattedValue}</p>
      </CardContent>
    </Card>
  );
}
