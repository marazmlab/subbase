import { useCallback, useState } from "react";
import type { z } from "zod";

/**
 * Stan formularza autentykacji
 */
interface FormState<TValues> {
  values: TValues;
  errors: Partial<Record<keyof TValues, string>>;
  isSubmitting: boolean;
  submitError: string | null;
}

/**
 * Opcje konfiguracyjne dla hooka useAuthForm
 */
interface UseAuthFormOptions<TValues> {
  /** Wartości początkowe formularza */
  initialValues: TValues;
  /** Schema Zod do walidacji */
  schema: z.ZodSchema<TValues>;
  /** Funkcja wywoływana przy submitcie (po walidacji) */
  onSubmit: (values: TValues) => Promise<void>;
  /** Callback wywoływany przy zmianie wartości */
  onValuesChange?: (values: TValues) => void;
}

/**
 * Generyczny hook do zarządzania formularzami autentykacji z integracją Zod.
 *
 * Funkcjonalności:
 * - Zarządzanie stanem formularza (values, errors, isSubmitting, submitError)
 * - Walidacja przez schema Zod przy blur i submit
 * - Obsługa błędów z API
 *
 * @example
 * const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useAuthForm({
 *   initialValues: { email: '', password: '' },
 *   schema: loginSchema,
 *   onSubmit: async (values) => { await login(values); }
 * });
 */
export function useAuthForm<TValues extends Record<string, unknown>>({
  initialValues,
  schema,
  onSubmit,
  onValuesChange,
}: UseAuthFormOptions<TValues>) {
  const [state, setState] = useState<FormState<TValues>>({
    values: initialValues,
    errors: {},
    isSubmitting: false,
    submitError: null,
  });

  /**
   * Waliduje pojedyncze pole i zwraca komunikat błędu (lub undefined)
   */
  const validateField = useCallback(
    (name: keyof TValues, value: unknown): string | undefined => {
      // Tworzymy partial object do walidacji
      const partialData = { ...state.values, [name]: value };

      const result = schema.safeParse(partialData);

      if (!result.success) {
        const fieldError = result.error.errors.find((err) => err.path[0] === name);
        return fieldError?.message;
      }

      return undefined;
    },
    [schema, state.values]
  );

  /**
   * Waliduje wszystkie pola i zwraca obiekt błędów
   */
  const validateAll = useCallback(
    (values: TValues): Partial<Record<keyof TValues, string>> => {
      const result = schema.safeParse(values);

      if (!result.success) {
        const errors: Partial<Record<keyof TValues, string>> = {};

        for (const err of result.error.errors) {
          const field = err.path[0] as keyof TValues;
          if (!errors[field]) {
            errors[field] = err.message;
          }
        }

        return errors;
      }

      return {};
    },
    [schema]
  );

  /**
   * Obsługuje zmianę wartości pola
   */
  const handleChange = useCallback(
    (name: keyof TValues, value: string) => {
      setState((prev) => {
        const newValues = { ...prev.values, [name]: value };

        // Wywołaj callback jeśli podany
        onValuesChange?.(newValues);

        return {
          ...prev,
          values: newValues,
          // Wyczyść błąd pola przy zmianie wartości
          errors: { ...prev.errors, [name]: undefined },
          // Wyczyść błąd submitowania przy zmianie wartości
          submitError: null,
        };
      });
    },
    [onValuesChange]
  );

  /**
   * Obsługuje opuszczenie pola (blur) - walidacja inline
   */
  const handleBlur = useCallback(
    (name: keyof TValues) => {
      const error = validateField(name, state.values[name]);

      setState((prev) => ({
        ...prev,
        errors: { ...prev.errors, [name]: error },
      }));
    },
    [validateField, state.values]
  );

  /**
   * Obsługuje submit formularza
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Waliduj używając aktualnego state
      const currentValues = state.values;
      const validationErrors = validateAll(currentValues);

      // Jeśli są błędy, ustaw je w state i przerwij
      if (Object.keys(validationErrors).length > 0) {
        setState((prev) => ({ ...prev, errors: validationErrors }));
        return;
      }

      // Ustaw isSubmitting
      setState((prev) => ({
        ...prev,
        isSubmitting: true,
        submitError: null,
      }));

      try {
        await onSubmit(currentValues);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Wystąpił błąd. Spróbuj ponownie później";

        setState((prev) => ({
          ...prev,
          submitError: message,
        }));
      } finally {
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
        }));
      }
    },
    [state.values, validateAll, onSubmit]
  );

  /**
   * Resetuje formularz do wartości początkowych
   */
  const reset = useCallback(() => {
    setState({
      values: initialValues,
      errors: {},
      isSubmitting: false,
      submitError: null,
    });
  }, [initialValues]);

  /**
   * Ustawia błąd submitowania (np. z API)
   */
  const setSubmitError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      submitError: error,
    }));
  }, []);

  /**
   * Aktualizuje wartości formularza (np. przy przywracaniu z zapisanego stanu)
   */
  const setValues = useCallback((values: TValues) => {
    setState((prev) => ({
      ...prev,
      values,
      errors: {},
      submitError: null,
    }));
  }, []);

  return {
    values: state.values,
    errors: state.errors,
    isSubmitting: state.isSubmitting,
    submitError: state.submitError,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setSubmitError,
    setValues,
  };
}
