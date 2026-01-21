import { useState, useCallback, useMemo } from "react";

import type { SubscriptionFormValues, SubscriptionFormErrors } from "@/types/dashboard.types";
import { defaultFormValues } from "@/types/dashboard.types";
import { subscriptionFormSchema, validateField } from "@/lib/schemas/subscription-form.schema";

interface UseSubscriptionFormOptions {
  initialValues?: Partial<SubscriptionFormValues>;
  onSubmit: (values: SubscriptionFormValues) => Promise<void>;
}

interface UseSubscriptionFormReturn {
  values: SubscriptionFormValues;
  errors: SubscriptionFormErrors;
  touched: Partial<Record<keyof SubscriptionFormValues, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (field: keyof SubscriptionFormValues, value: string) => void;
  handleBlur: (field: keyof SubscriptionFormValues) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  reset: (newValues?: Partial<SubscriptionFormValues>) => void;
  setFieldValue: (field: keyof SubscriptionFormValues, value: string) => void;
  setFieldError: (field: keyof SubscriptionFormValues, error: string | undefined) => void;
}

export function useSubscriptionForm({
  initialValues,
  onSubmit,
}: UseSubscriptionFormOptions): UseSubscriptionFormReturn {
  const [values, setValues] = useState<SubscriptionFormValues>(() => ({
    ...defaultFormValues,
    ...initialValues,
  }));

  const [errors, setErrors] = useState<SubscriptionFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SubscriptionFormValues, boolean>>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Walidacja pojedynczego pola
  const validateSingleField = useCallback(
    (field: keyof SubscriptionFormValues, value: string): string | undefined => {
      return validateField(field, value, values);
    },
    [values]
  );

  // Walidacja całego formularza
  const validateForm = useCallback((): SubscriptionFormErrors => {
    const result = subscriptionFormSchema.safeParse(values);

    if (result.success) {
      return {};
    }

    const formErrors: SubscriptionFormErrors = {};

    for (const error of result.error.errors) {
      const path = error.path[0];
      if (typeof path === "string" && !formErrors[path as keyof SubscriptionFormValues]) {
        formErrors[path as keyof SubscriptionFormValues] = error.message;
      }
    }

    return formErrors;
  }, [values]);

  // Sprawdzenie czy formularz jest poprawny
  const isValid = useMemo(() => {
    const result = subscriptionFormSchema.safeParse(values);
    return result.success;
  }, [values]);

  // Obsługa zmiany wartości pola
  const handleChange = useCallback(
    (field: keyof SubscriptionFormValues, value: string) => {
      setValues((prev) => ({ ...prev, [field]: value }));

      // Walidacja w locie tylko jeśli pole było już dotknięte
      if (touched[field]) {
        const error = validateSingleField(field, value);
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    },
    [touched, validateSingleField]
  );

  // Obsługa utraty focusa
  const handleBlur = useCallback(
    (field: keyof SubscriptionFormValues) => {
      setTouched((prev) => ({ ...prev, [field]: true }));

      const error = validateSingleField(field, values[field]);
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    [values, validateSingleField]
  );

  // Ustawienie wartości pola bezpośrednio
  const setFieldValue = useCallback((field: keyof SubscriptionFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Ustawienie błędu pola bezpośrednio
  const setFieldError = useCallback(
    (field: keyof SubscriptionFormValues, error: string | undefined) => {
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    []
  );

  // Obsługa submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Oznacz wszystkie pola jako dotknięte
      const allTouched: Record<keyof SubscriptionFormValues, boolean> = {
        name: true,
        cost: true,
        currency: true,
        billing_cycle: true,
        status: true,
        start_date: true,
        next_billing_date: true,
        description: true,
      };
      setTouched(allTouched);

      // Walidacja
      const formErrors = validateForm();
      setErrors(formErrors);

      if (Object.keys(formErrors).length > 0) {
        return;
      }

      // Submit
      setIsSubmitting(true);

      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateForm, onSubmit]
  );

  // Reset formularza
  const reset = useCallback((newValues?: Partial<SubscriptionFormValues>) => {
    setValues({ ...defaultFormValues, ...newValues });
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
  };
}
