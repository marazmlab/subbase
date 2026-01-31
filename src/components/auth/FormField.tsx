import { useId } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  /** Unikalny identyfikator pola */
  id?: string;
  /** Etykieta pola */
  label: string;
  /** Typ inputa */
  type: "text" | "email" | "password";
  /** Aktualna wartość */
  value: string;
  /** Komunikat błędu */
  error?: string;
  /** Czy pole jest wyłączone */
  disabled?: boolean;
  /** Czy pole ma być focusowane */
  autoFocus?: boolean;
  /** Atrybut autocomplete */
  autoComplete?: string;
  /** Placeholder tekst */
  placeholder?: string;
  /** Callback zmiany wartości */
  onChange: (value: string) => void;
  /** Callback opuszczenia pola */
  onBlur?: () => void;
  /** Test ID dla e2e testów */
  testId?: string;
}

/**
 * Uniwersalny wrapper dla pojedynczego pola formularza.
 * Zawiera label, input oraz obszar komunikatu błędu z odpowiednimi atrybutami dostępności.
 */
export function FormField({
  id: externalId,
  label,
  type,
  value,
  error,
  disabled = false,
  autoComplete,
  placeholder,
  onChange,
  onBlur,
  testId,
}: FormFieldProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId;
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={cn(error && "text-destructive")}>
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        disabled={disabled}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        data-test-id={testId}
      />
      {error && (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-sm font-medium text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}
