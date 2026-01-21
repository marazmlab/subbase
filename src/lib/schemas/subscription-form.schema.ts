import { z } from "zod";

/**
 * Schema walidacji formularza subskrypcji (frontend)
 * Wszystkie komunikaty błędów są w języku polskim
 *
 * Uwaga: cost jest stringiem w formularzu, konwersja na number przy submit
 */
/** Bazowy schemat obiektu (bez refinements) - używany do walidacji pojedynczych pól */
const subscriptionFormBaseSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana").max(255, "Nazwa może mieć maksymalnie 255 znaków"),
  cost: z
    .string()
    .min(1, "Koszt jest wymagany")
    .refine((val) => !isNaN(parseFloat(val)), "Koszt musi być liczbą")
    .refine((val) => parseFloat(val) > 0, "Koszt musi być większy od 0")
    .refine((val) => parseFloat(val) <= 100000, "Koszt nie może przekraczać 100 000")
    .refine(
      (val) => /^\d+([.,]\d{1,2})?$/.test(val.replace(",", ".")),
      "Koszt może mieć maksymalnie 2 miejsca po przecinku"
    ),
  currency: z.string().length(3, "Waluta musi mieć 3 znaki"),
  billing_cycle: z.enum(["monthly", "yearly"], {
    errorMap: () => ({ message: "Wybierz cykl rozliczeniowy" }),
  }),
  status: z.enum(["active", "paused", "cancelled"], {
    errorMap: () => ({ message: "Wybierz status" }),
  }),
  start_date: z
    .string()
    .min(1, "Data rozpoczęcia jest wymagana")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Nieprawidłowy format daty"),
  next_billing_date: z
    .string()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Nieprawidłowy format daty")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(1000, "Opis może mieć maksymalnie 1000 znaków")
    .optional()
    .or(z.literal("")),
});

/** Pełny schemat z walidacją cross-field */
export const subscriptionFormSchema = subscriptionFormBaseSchema.refine(
  (data) => !data.next_billing_date || data.next_billing_date >= data.start_date,
  {
    message: "Data następnego rozliczenia nie może być wcześniejsza niż data rozpoczęcia",
    path: ["next_billing_date"],
  }
);

export type SubscriptionFormSchema = z.infer<typeof subscriptionFormSchema>;

/**
 * Funkcja pomocnicza do walidacji pojedynczego pola
 * Zwraca komunikat błędu lub undefined jeśli pole jest poprawne
 */
export function validateField(
  fieldName: keyof SubscriptionFormSchema,
  value: string,
  formValues?: Partial<SubscriptionFormSchema>
): string | undefined {
  // Dla walidacji pojedynczego pola, używamy bazowego schematu (bez refinements)
  const fieldSchema = subscriptionFormBaseSchema.shape[fieldName];

  if (!fieldSchema) {
    return undefined;
  }

  const result = fieldSchema.safeParse(value);

  if (!result.success) {
    return result.error.errors[0]?.message;
  }

  // Dodatkowa walidacja dla next_billing_date (zależna od start_date)
  if (fieldName === "next_billing_date" && value && formValues?.start_date) {
    if (value < formValues.start_date) {
      return "Data następnego rozliczenia nie może być wcześniejsza niż data rozpoczęcia";
    }
  }

  return undefined;
}

/**
 * Waliduje cały formularz i zwraca obiekt z błędami
 */
export function validateForm(values: SubscriptionFormSchema): Record<string, string> {
  const result = subscriptionFormSchema.safeParse(values);

  if (result.success) {
    return {};
  }

  const errors: Record<string, string> = {};

  for (const error of result.error.errors) {
    const path = error.path[0];
    if (typeof path === "string" && !errors[path]) {
      errors[path] = error.message;
    }
  }

  return errors;
}
