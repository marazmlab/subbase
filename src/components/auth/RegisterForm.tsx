import { Loader2 } from "lucide-react";

import { FormError } from "@/components/auth/FormError";
import { FormField } from "@/components/auth/FormField";
import { useAuthForm } from "@/components/hooks/useAuthForm";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/db/supabase.browser";
import { registerSchema, type RegisterFormValues } from "@/lib/schemas/auth.schema";

/**
 * Mapuje błędy Supabase Auth na polskie komunikaty dla użytkownika.
 */
function mapAuthError(error: { message: string }): string {
  const message = error.message.toLowerCase();

  if (message.includes("user already registered") || message.includes("already been registered")) {
    return "Konto z tym adresem email już istnieje";
  }

  if (message.includes("password should be at least")) {
    return "Hasło musi mieć minimum 6 znaków";
  }

  if (message.includes("invalid email")) {
    return "Podaj poprawny adres email";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "Nie można połączyć z serwerem. Sprawdź połączenie internetowe.";
  }

  return "Wystąpił błąd. Spróbuj ponownie później";
}

export interface RegisterFormProps {
  /** Opcjonalne wartości początkowe */
  initialValues?: RegisterFormValues;
  /** Callback wywoływany przy zmianie wartości formularza */
  onValuesChange?: (values: RegisterFormValues) => void;
  /** Callback wywoływany po pomyślnej rejestracji (wymagany - rodzic decyduje o nawigacji) */
  onSuccess: () => void;
}

const defaultInitialValues: RegisterFormValues = {
  email: "",
  password: "",
  confirmPassword: "",
};

/**
 * Formularz rejestracji z walidacją i integracją Supabase Auth.
 */
export function RegisterForm({
  initialValues = defaultInitialValues,
  onValuesChange,
  onSuccess,
}: RegisterFormProps) {
  const {
    values,
    errors,
    isSubmitting,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
    setSubmitError,
  } = useAuthForm({
    initialValues,
    schema: registerSchema,
    onValuesChange,
    onSubmit: async (formValues) => {
      const supabase = createSupabaseBrowserClient();

      const { error } = await supabase.auth.signUp({
        email: formValues.email,
        password: formValues.password,
      });

      if (error) {
        setSubmitError(mapAuthError(error));
        return;
      }

      onSuccess();
    },
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        id="register-email"
        label="Email"
        type="email"
        value={values.email}
        error={errors.email}
        disabled={isSubmitting}
        autoComplete="email"
        placeholder="jan@example.com"
        onChange={(value) => handleChange("email", value)}
        onBlur={() => handleBlur("email")}
      />

      <FormField
        id="register-password"
        label="Hasło"
        type="password"
        value={values.password}
        error={errors.password}
        disabled={isSubmitting}
        autoComplete="new-password"
        onChange={(value) => handleChange("password", value)}
        onBlur={() => handleBlur("password")}
      />

      <FormField
        id="register-confirm-password"
        label="Potwierdź hasło"
        type="password"
        value={values.confirmPassword}
        error={errors.confirmPassword}
        disabled={isSubmitting}
        autoComplete="new-password"
        onChange={(value) => handleChange("confirmPassword", value)}
        onBlur={() => handleBlur("confirmPassword")}
      />

      <FormError message={submitError} />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            <span>Rejestracja...</span>
          </>
        ) : (
          "Zarejestruj się"
        )}
      </Button>
    </form>
  );
}
