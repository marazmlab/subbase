import { ChevronLeft, ChevronRight } from "lucide-react";

import type { PaginationDTO } from "@/types";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  pagination: PaginationDTO;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function Pagination({ pagination, onPageChange, isLoading }: PaginationProps) {
  const { page, total_pages } = pagination;

  if (total_pages <= 1) {
    return null;
  }

  const hasPrevious = page > 1;
  const hasNext = page < total_pages;

  return (
    <nav
      className="flex items-center justify-between border-t pt-4"
      aria-label="Nawigacja paginacji"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrevious || isLoading}
        aria-label="Poprzednia strona"
      >
        <ChevronLeft className="size-4" />
        <span className="hidden sm:inline">Poprzednia</span>
      </Button>

      <span className="text-sm text-muted-foreground">
        Strona {page} z {total_pages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNext || isLoading}
        aria-label="Następna strona"
      >
        <span className="hidden sm:inline">Następna</span>
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}
