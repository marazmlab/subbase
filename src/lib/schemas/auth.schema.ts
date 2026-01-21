import { z } from "zod";

/** Schema walidacji formularza logowania */
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email jest wymagany" })
    .min(1, "Email jest wymagany")
    .email("Podaj poprawny adres email"),
  password: z
    .string({ required_error: "Hasło jest wymagane" })
    .min(1, "Hasło jest wymagane")
    .min(6, "Hasło musi mieć minimum 6 znaków"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

/** Schema walidacji formularza rejestracji */
export const registerSchema = z
  .object({
    email: z
      .string({ required_error: "Email jest wymagany" })
      .min(1, "Email jest wymagany")
      .email("Podaj poprawny adres email"),
    password: z
      .string({ required_error: "Hasło jest wymagane" })
      .min(1, "Hasło jest wymagane")
      .min(6, "Hasło musi mieć minimum 6 znaków"),
    confirmPassword: z
      .string({ required_error: "Potwierdzenie hasła jest wymagane" })
      .min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

/** Błędy walidacji formularza logowania */
export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

/** Błędy walidacji formularza rejestracji */
export type RegisterFormErrors = Partial<Record<keyof RegisterFormValues, string>>;
