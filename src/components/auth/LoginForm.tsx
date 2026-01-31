import { Loader2 } from "lucide-react";

import { FormError } from "@/components/auth/FormError";
import { FormField } from "@/components/auth/FormField";
import { useAuthForm } from "@/components/hooks/useAuthForm";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/db/supabase.browser";
import { loginSchema, type LoginFormValues } from "@/lib/schemas/auth.schema";

/**
 * Mapuje błędy Supabase Auth na polskie komunikaty dla użytkownika.
 * Ze względów bezpieczeństwa nie rozróżnia "nieprawidłowy email" od "nieprawidłowe hasło".
 */
function mapAuthError(error: { message: string }): string {
  const message = error.message.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "Nieprawidłowy email lub hasło";
  }

  if (message.includes("email not confirmed")) {
    return "Potwierdź swój adres email";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "Nie można połączyć z serwerem. Sprawdź połączenie internetowe.";
  }

  return "Wystąpił błąd. Spróbuj ponownie później";
}

export interface LoginFormProps {
  /** Opcjonalne wartości początkowe */
  initialValues?: LoginFormValues;
  /** Callback wywoływany przy zmianie wartości formularza */
  onValuesChange?: (values: LoginFormValues) => void;
  /** Callback wywoływany po pomyślnym logowaniu (wymagany - rodzic decyduje o nawigacji) */
  onSuccess: () => void;
}

const defaultInitialValues: LoginFormValues = {
  email: "",
  password: "",
};

/**
 * Formularz logowania z walidacją i integracją Supabase Auth.
 */
export function LoginForm({
  initialValues = defaultInitialValues,
  onValuesChange,
  onSuccess,
}: LoginFormProps) {
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
    schema: loginSchema,
    onValuesChange,
    onSubmit: async (formValues) => {
      const supabase = createSupabaseBrowserClient();

      const { error } = await supabase.auth.signInWithPassword({
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
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
      <FormField
        id="login-email"
        label="Email"
        type="email"
        value={values.email}
        error={errors.email}
        disabled={isSubmitting}
        autoComplete="email"
        placeholder="jan@example.com"
        onChange={(value) => handleChange("email", value)}
        onBlur={() => handleBlur("email")}
        testId="login-email-input"
      />

      <FormField
        id="login-password"
        label="Hasło"
        type="password"
        value={values.password}
        error={errors.password}
        disabled={isSubmitting}
        autoComplete="current-password"
        onChange={(value) => handleChange("password", value)}
        onBlur={() => handleBlur("password")}
        testId="login-password-input"
      />

      <FormError message={submitError} />

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
        data-testid="login-submit-button"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            <span>Logowanie...</span>
          </>
        ) : (
          "Zaloguj się"
        )}
      </Button>
    </form>
  );
}
