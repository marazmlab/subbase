import { useId } from "react";
import { Loader2 } from "lucide-react";

import type { SubscriptionFormValues, SubscriptionFormErrors } from "@/types/dashboard.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SubscriptionFormProps {
  values: SubscriptionFormValues;
  errors: SubscriptionFormErrors;
  touched: Partial<Record<keyof SubscriptionFormValues, boolean>>;
  isSubmitting: boolean;
  onChange: (field: keyof SubscriptionFormValues, value: string) => void;
  onBlur: (field: keyof SubscriptionFormValues) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel?: string;
}

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  children: React.ReactNode;
}

function FormField({ id, label, error, touched, required, children }: FormFieldProps) {
  const showError = touched && error;

  return (
    <div className="space-y-1.5 sm:space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {showError && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function SubscriptionForm({
  values,
  errors,
  touched,
  isSubmitting,
  onChange,
  onBlur,
  onSubmit,
  onCancel,
  submitLabel = "Zapisz",
}: SubscriptionFormProps) {
  const baseId = useId();

  const fieldId = (name: string) => `${baseId}-${name}`;

  return (
    <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
      {/* Name */}
      <FormField
        id={fieldId("name")}
        label="Nazwa"
        error={errors.name}
        touched={touched.name}
        required
      >
        <Input
          id={fieldId("name")}
          value={values.name}
          onChange={(e) => onChange("name", e.target.value)}
          onBlur={() => onBlur("name")}
          placeholder="np. Netflix, Spotify"
          aria-invalid={touched.name && !!errors.name}
          disabled={isSubmitting}
        />
      </FormField>

      {/* Cost & Currency */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <FormField
          id={fieldId("cost")}
          label="Koszt"
          error={errors.cost}
          touched={touched.cost}
          required
        >
          <Input
            id={fieldId("cost")}
            type="text"
            inputMode="decimal"
            value={values.cost}
            onChange={(e) => onChange("cost", e.target.value)}
            onBlur={() => onBlur("cost")}
            placeholder="0.00"
            aria-invalid={touched.cost && !!errors.cost}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          id={fieldId("currency")}
          label="Waluta"
          error={errors.currency}
          touched={touched.currency}
          required
        >
          <Select
            value={values.currency}
            onValueChange={(value) => onChange("currency", value)}
            disabled={isSubmitting}
          >
            <SelectTrigger
              id={fieldId("currency")}
              className={cn("w-full", touched.currency && errors.currency && "border-destructive")}
              aria-invalid={touched.currency && !!errors.currency}
            >
              <SelectValue placeholder="Wybierz walutę" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PLN">PLN</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      {/* Billing Cycle & Status */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <FormField
          id={fieldId("billing_cycle")}
          label="Cykl rozliczeniowy"
          error={errors.billing_cycle}
          touched={touched.billing_cycle}
          required
        >
          <Select
            value={values.billing_cycle}
            onValueChange={(value) => onChange("billing_cycle", value)}
            disabled={isSubmitting}
          >
            <SelectTrigger
              id={fieldId("billing_cycle")}
              className={cn(
                "w-full",
                touched.billing_cycle && errors.billing_cycle && "border-destructive"
              )}
              aria-invalid={touched.billing_cycle && !!errors.billing_cycle}
            >
              <SelectValue placeholder="Wybierz cykl" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Miesięcznie</SelectItem>
              <SelectItem value="yearly">Rocznie</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          id={fieldId("status")}
          label="Status"
          error={errors.status}
          touched={touched.status}
          required
        >
          <Select
            value={values.status}
            onValueChange={(value) => onChange("status", value)}
            disabled={isSubmitting}
          >
            <SelectTrigger
              id={fieldId("status")}
              className={cn("w-full", touched.status && errors.status && "border-destructive")}
              aria-invalid={touched.status && !!errors.status}
            >
              <SelectValue placeholder="Wybierz status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Aktywna</SelectItem>
              <SelectItem value="paused">Wstrzymana</SelectItem>
              <SelectItem value="cancelled">Anulowana</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      {/* Dates */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <FormField
          id={fieldId("start_date")}
          label="Data rozpoczęcia"
          error={errors.start_date}
          touched={touched.start_date}
          required
        >
          <Input
            id={fieldId("start_date")}
            type="date"
            value={values.start_date}
            onChange={(e) => onChange("start_date", e.target.value)}
            onBlur={() => onBlur("start_date")}
            aria-invalid={touched.start_date && !!errors.start_date}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          id={fieldId("next_billing_date")}
          label="Następne rozliczenie"
          error={errors.next_billing_date}
          touched={touched.next_billing_date}
        >
          <Input
            id={fieldId("next_billing_date")}
            type="date"
            value={values.next_billing_date}
            onChange={(e) => onChange("next_billing_date", e.target.value)}
            onBlur={() => onBlur("next_billing_date")}
            aria-invalid={touched.next_billing_date && !!errors.next_billing_date}
            disabled={isSubmitting}
          />
        </FormField>
      </div>

      {/* Description */}
      <FormField
        id={fieldId("description")}
        label="Opis"
        error={errors.description}
        touched={touched.description}
      >
        <Textarea
          id={fieldId("description")}
          value={values.description}
          onChange={(e) => onChange("description", e.target.value)}
          onBlur={() => onBlur("description")}
          placeholder="Opcjonalny opis subskrypcji..."
          rows={3}
          aria-invalid={touched.description && !!errors.description}
          disabled={isSubmitting}
        />
      </FormField>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end sm:pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Anuluj
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
