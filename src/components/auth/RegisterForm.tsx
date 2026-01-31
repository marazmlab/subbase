import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { useState } from "react";

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
 * Po pomyślnej rejestracji wyświetla informację o wysłaniu emaila weryfikacyjnego.
 */
export function RegisterForm({
  initialValues = defaultInitialValues,
  onValuesChange,
}: RegisterFormProps) {
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

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

      // Zapisz email i pokaż komunikat o weryfikacji
      setRegisteredEmail(formValues.email);
      setRegistrationSuccess(true);

      // Nie przekierowuj od razu - użytkownik musi potwierdzić email
      // onSuccess zostanie wywołane gdy użytkownik kliknie link w emailu
    },
  });

  // Widok sukcesu z informacją o weryfikacji emaila
  if (registrationSuccess) {
    return (
      <div className="space-y-4 text-center" data-testid="register-success-message">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Rejestracja przebiegła pomyślnie!</h3>
          <p className="text-sm text-muted-foreground">Wysłaliśmy link aktywacyjny na adres:</p>
          <p className="font-medium text-foreground">{registeredEmail}</p>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4 text-left">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="space-y-1 text-sm">
              <p className="font-medium">Potwierdź swój adres email</p>
              <p className="text-muted-foreground">
                Kliknij w link aktywacyjny, aby dokończyć rejestrację i móc się zalogować. Jeśli nie
                widzisz wiadomości, sprawdź folder spam.
              </p>
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            window.location.href = "/login";
          }}
          data-testid="register-success-go-to-login-button"
        >
          Przejdź do logowania
        </Button>
      </div>
    );
  }

  // Formularz rejestracji
  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form">
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
        testId="register-email-input"
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
        testId="register-password-input"
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
        testId="register-confirm-password-input"
      />

      <FormError message={submitError} />

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
        data-testid="register-submit-button"
      >
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
