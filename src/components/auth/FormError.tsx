import { AlertCircle } from "lucide-react";

export interface FormErrorProps {
  /** Komunikat błędu do wyświetlenia */
  message?: string | null;
}

/**
 * Komponent wyświetlający ogólny błąd formularza (np. błąd autentykacji z API).
 * Wyświetlany tylko gdy message jest truthy.
 */
export function FormError({ message }: FormErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
