import { FolderOpen, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onAddClick: () => void;
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
        <FolderOpen className="size-6 text-muted-foreground" />
      </div>

      <h3 className="mt-4 text-lg font-semibold">Brak subskrypcji</h3>

      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Nie masz jeszcze żadnych subskrypcji. Dodaj pierwszą, aby rozpocząć śledzenie swoich
        wydatków.
      </p>

      <Button onClick={onAddClick} className="mt-6">
        <Plus className="size-4" />
        Dodaj pierwszą subskrypcję
      </Button>
    </div>
  );
}
