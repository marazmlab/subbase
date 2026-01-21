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
        <CardContent className="pt-6">
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{formattedValue}</p>
      </CardContent>
    </Card>
  );
}
