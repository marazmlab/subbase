# Plan implementacji widoku Autentykacji

## 1. Przegląd

Widok autentykacji służy jako punkt wejścia dla użytkowników aplikacji Subbase. Umożliwia rejestrację nowych kont oraz logowanie do istniejących kont. Widok jest zbudowany jako interaktywny komponent React osadzony w stronie Astro, wykorzystujący Supabase Auth do obsługi autentykacji. Głównym celem jest zapewnienie bezpiecznego, dostępnego i intuicyjnego procesu autentykacji z odpowiednią walidacją danych i informacją zwrotną dla użytkownika.

### 1.1 Powiązane dokumenty

- **PRD:** `.ai/prd.md` - sekcja Authentication w User Stories
- **UI Plan:** `.ai/ui-plan.md` - sekcja 2.1 Widok autentykacji
- **Middleware:** `src/middleware/index.ts` - obsługa sesji i klienta Supabase

### 1.2 Decyzje architektoniczne

- **Język komunikatów:** Polski (PL) - interfejs użytkownika w języku polskim
- **Walidacja:** Zod na frontendzie z polskimi komunikatami błędów
- **Sesje:** Cookie-based dla stron Astro, Bearer token dla API
- **Klient Supabase:** Wykorzystanie `@supabase/ssr` dla prawidłowej obsługi cookies w przeglądarce

## 2. Routing widoku

- **Ścieżka:** `/login`
- **Plik:** `src/pages/login.astro`
- **Ochrona:** Brak (widok publiczny)
- **Przekierowanie:** Zalogowani użytkownicy są przekierowywani na `/` (dashboard)

## 3. Struktura komponentów

```
login.astro
└── Layout
    └── AuthCard (React, client:load)
        ├── AuthTabs
        │   ├── TabsTrigger (Login)
        │   └── TabsTrigger (Register)
        ├── TabsContent (Login)
        │   └── LoginForm
        │       ├── FormField (email)
        │       ├── FormField (password)
        │       ├── FormError
        │       └── Button (submit)
        └── TabsContent (Register)
            └── RegisterForm
                ├── FormField (email)
                ├── FormField (password)
                ├── FormField (confirmPassword)
                ├── FormError
                └── Button (submit)
```

## 4. Szczegóły komponentów

### 4.1 AuthCard

- **Opis:** Główny kontener widoku autentykacji. Opakowuje całą sekcję formularzy w estetyczną kartę z cieniem i zaokrągleniami. Zarządza stanem przełączania między zakładkami oraz przechowuje dane formularzy.
- **Główne elementy:**
  - Card (Shadcn/ui) jako kontener zewnętrzny
  - CardHeader z tytułem "Subbase"
  - CardContent zawierający AuthTabs
- **Obsługiwane interakcje:**
  - Przełączanie między zakładkami logowania i rejestracji
- **Obsługiwana walidacja:** Brak (delegowana do formularzy)
- **Typy:**
  - `AuthTabValue`: `"login" | "register"`
  - `AuthFormData`: przechowuje dane obu formularzy
- **Propsy:** Brak (komponent najwyższego poziomu)

### 4.2 AuthTabs

- **Opis:** Komponent przełącznika między formularzem logowania a rejestracji. Oparty na komponencie Tabs z Shadcn/ui. Zachowuje wpisane dane przy przełączaniu między zakładkami.
- **Główne elementy:**
  - Tabs (Shadcn/ui) jako kontener
  - TabsList z dwoma TabsTrigger
  - Dwa TabsContent dla LoginForm i RegisterForm
- **Obsługiwane interakcje:**
  - Kliknięcie na zakładkę zmienia aktywny formularz
  - Nawigacja klawiaturą (strzałki lewo/prawo)
- **Obsługiwana walidacja:** Brak
- **Typy:**
  - `AuthTabValue`
- **Propsy:**
  - `activeTab: AuthTabValue` - aktualnie aktywna zakładka
  - `onTabChange: (tab: AuthTabValue) => void` - callback zmiany zakładki
  - `children: React.ReactNode` - zawartość zakładek

### 4.3 LoginForm

- **Opis:** Formularz logowania z polami email i hasło. Obsługuje walidację client-side przed wysłaniem oraz wyświetla błędy autentykacji z API.
- **Główne elementy:**
  - Element `<form>` z obsługą onSubmit
  - FormField dla email (Input type="email")
  - FormField dla password (Input type="password")
  - FormError dla błędów ogólnych
  - Button type="submit" ze stanem loading
- **Obsługiwane interakcje:**
  - Wpisywanie tekstu w pola formularza
  - Kliknięcie przycisku "Zaloguj się"
  - Naciśnięcie Enter w formularzu
- **Obsługiwana walidacja:**
  - Email: wymagany, poprawny format (regex)
  - Hasło: wymagane, minimum 6 znaków
- **Typy:**
  - `LoginFormValues`
  - `LoginFormErrors`
- **Propsy:**
  - `initialValues?: LoginFormValues` - opcjonalne wartości początkowe
  - `onValuesChange?: (values: LoginFormValues) => void` - callback zmiany wartości
  - `onSuccess?: () => void` - callback po pomyślnym logowaniu

### 4.4 RegisterForm

- **Opis:** Formularz rejestracji z polami email, hasło i potwierdzenie hasła. Waliduje zgodność haseł przed wysłaniem.
- **Główne elementy:**
  - Element `<form>` z obsługą onSubmit
  - FormField dla email (Input type="email")
  - FormField dla password (Input type="password")
  - FormField dla confirmPassword (Input type="password")
  - FormError dla błędów ogólnych
  - Button type="submit" ze stanem loading
- **Obsługiwane interakcje:**
  - Wpisywanie tekstu w pola formularza
  - Kliknięcie przycisku "Zarejestruj się"
  - Naciśnięcie Enter w formularzu
- **Obsługiwana walidacja:**
  - Email: wymagany, poprawny format (regex)
  - Hasło: wymagane, minimum 6 znaków
  - Potwierdzenie hasła: wymagane, musi być identyczne z hasłem
- **Typy:**
  - `RegisterFormValues`
  - `RegisterFormErrors`
- **Propsy:**
  - `initialValues?: RegisterFormValues` - opcjonalne wartości początkowe
  - `onValuesChange?: (values: RegisterFormValues) => void` - callback zmiany wartości
  - `onSuccess?: () => void` - callback po pomyślnej rejestracji

### 4.5 FormField

- **Opis:** Uniwersalny wrapper dla pojedynczego pola formularza. Zawiera label, input oraz obszar komunikatu błędu z odpowiednimi atrybutami dostępności.
- **Główne elementy:**
  - Label (Shadcn/ui) powiązany z inputem przez htmlFor
  - Input (Shadcn/ui) z odpowiednim type
  - Span dla komunikatu błędu z role="alert"
- **Obsługiwane interakcje:**
  - Wpisywanie tekstu (onChange)
  - Opuszczenie pola (onBlur) dla walidacji inline
- **Obsługiwana walidacja:** Przekazana przez propsy
- **Typy:**
  - `FormFieldProps`
- **Propsy:**
  - `id: string` - unikalny identyfikator pola
  - `label: string` - etykieta pola
  - `type: "text" | "email" | "password"` - typ inputa
  - `value: string` - aktualna wartość
  - `error?: string` - komunikat błędu
  - `disabled?: boolean` - czy pole jest wyłączone
  - `autoFocus?: boolean` - czy pole ma być focusowane
  - `autoComplete?: string` - atrybut autocomplete
  - `onChange: (value: string) => void` - callback zmiany wartości
  - `onBlur?: () => void` - callback opuszczenia pola

### 4.6 FormError

- **Opis:** Komponent wyświetlający ogólny błąd formularza (np. błąd autentykacji z API).
- **Główne elementy:**
  - Div z role="alert" i aria-live="polite"
  - Ikona błędu (opcjonalna)
  - Tekst komunikatu błędu
- **Obsługiwane interakcje:** Brak (komponent prezentacyjny)
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:**
  - `message?: string | null` - komunikat błędu do wyświetlenia

## 5. Typy i Walidacja

### 5.1 Schematy walidacji Zod

Utworzyć plik `src/lib/schemas/auth.schema.ts`:

```typescript
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
```

### 5.2 Typy błędów formularzy

```typescript
/** Błędy walidacji formularza logowania */
type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

/** Błędy walidacji formularza rejestracji */
type RegisterFormErrors = Partial<Record<keyof RegisterFormValues, string>>;
```

### 5.3 Typy stanu autentykacji

```typescript
/** Aktywna zakładka */
type AuthTabValue = "login" | "register";

/** Stan głównego komponentu AuthCard */
interface AuthCardState {
  activeTab: AuthTabValue;
  loginFormValues: LoginFormValues;
  registerFormValues: RegisterFormValues;
}

/** Stan formularza */
interface FormState<TValues, TErrors> {
  values: TValues;
  errors: TErrors;
  isSubmitting: boolean;
  submitError: string | null;
}
```

### 5.4 Typy propsów komponentów

```typescript
/** Props dla FormField */
interface FormFieldProps {
  id: string;
  label: string;
  type: "text" | "email" | "password";
  value: string;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

/** Props dla FormError */
interface FormErrorProps {
  message?: string | null;
}
```

## 6. Zarządzanie stanem

### 6.1 Stan lokalny komponentów

Każdy formularz (LoginForm, RegisterForm) zarządza własnym stanem przy użyciu `useState`:

- `values` - wartości pól formularza
- `errors` - błędy walidacji poszczególnych pól
- `isSubmitting` - czy trwa wysyłanie żądania
- `submitError` - błąd ogólny z API

### 6.2 Stan współdzielony w AuthCard

AuthCard przechowuje:
- `activeTab` - aktualnie wybrana zakładka
- `loginFormValues` - zachowane wartości formularza logowania
- `registerFormValues` - zachowane wartości formularza rejestracji

Dzięki temu dane formularzy są zachowywane przy przełączaniu między zakładkami.

### 6.3 Custom Hook useAuthForm

Rekomendowany hook do zarządzania logiką formularza:

```typescript
function useAuthForm<TValues, TErrors>(
  initialValues: TValues,
  validate: (values: TValues) => TErrors,
  onSubmit: (values: TValues) => Promise<void>
) {
  // Zwraca: values, errors, isSubmitting, submitError, handleChange, handleBlur, handleSubmit
}
```

## 7. Integracja API

### 7.1 Logowanie

- **Metoda:** Supabase Auth `signInWithPassword`
- **Żądanie:**
  ```typescript
  const { data, error } = await supabase.auth.signInWithPassword({
    email: values.email,
    password: values.password,
  });
  ```
- **Odpowiedź sukcesu:** Obiekt `User` i `Session`
- **Obsługa błędów:** Mapowanie `AuthError` na komunikaty użytkownika

### 7.2 Rejestracja

- **Metoda:** Supabase Auth `signUp`
- **Żądanie:**
  ```typescript
  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
  });
  ```
- **Odpowiedź sukcesu:** Obiekt `User` (może wymagać potwierdzenia email)
- **Obsługa błędów:** Mapowanie `AuthError` na komunikaty użytkownika

### 7.3 Klient Supabase dla przeglądarki

Dla komponentów React w przeglądarce należy utworzyć dedykowany klient Supabase z obsługą cookies:

```typescript
// src/db/supabase.browser.ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/db/database.types";

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );
}
```

**Uwaga:** Wymaga dodania zmiennych środowiskowych z prefiksem `PUBLIC_` dla dostępu po stronie klienta.

## 7A. Integracja z Middleware

### 7A.1 Działanie middleware (`src/middleware/index.ts`)

Middleware automatycznie:
- Tworzy instancję klienta Supabase i ustawia `context.locals.supabase`
- Weryfikuje sesję użytkownika i ustawia `context.locals.user`
- Dla stron Astro używa cookie-based session
- Dla API routes używa Bearer token z nagłówka Authorization

### 7A.2 Wykorzystanie w stronie login.astro

```astro
---
// src/pages/login.astro
import Layout from "@/layouts/Layout.astro";
import { AuthCard } from "@/components/auth/AuthCard";

// Middleware ustawia locals.user - sprawdź czy zalogowany
const user = Astro.locals.user;

// Przekieruj zalogowanych użytkowników na dashboard
if (user) {
  return Astro.redirect("/");
}
---

<Layout title="Logowanie - Subbase">
  <main class="min-h-screen flex items-center justify-center">
    <AuthCard client:load />
  </main>
</Layout>
```

### 7A.3 Obsługa po zalogowaniu

Po pomyślnym zalogowaniu przez Supabase Auth:
1. Supabase automatycznie ustawia cookies sesji
2. Przekierowanie na `/` przez `window.location.href = "/"`
3. Middleware odczyta sesję z cookies i ustawi `locals.user`
4. Dashboard sprawdzi `locals.user` i wyrenderuje dane użytkownika

## 8. Interakcje użytkownika

| Interakcja | Komponent | Rezultat |
|------------|-----------|----------|
| Wpisanie tekstu w pole email | FormField | Aktualizacja wartości w stanie, walidacja inline po blur |
| Wpisanie tekstu w pole hasła | FormField | Aktualizacja wartości w stanie, ukryte znaki |
| Kliknięcie zakładki "Rejestracja" | AuthTabs | Przełączenie na formularz rejestracji, zachowanie danych logowania |
| Kliknięcie zakładki "Logowanie" | AuthTabs | Przełączenie na formularz logowania, zachowanie danych rejestracji |
| Kliknięcie "Zaloguj się" | LoginForm | Walidacja, wysłanie żądania, przekierowanie lub błąd |
| Kliknięcie "Zarejestruj się" | RegisterForm | Walidacja, wysłanie żądania, przekierowanie lub błąd |
| Naciśnięcie Tab | Wszystkie | Nawigacja między polami formularza |
| Naciśnięcie Enter | Formularze | Wysłanie aktywnego formularza |
| Naciśnięcie Escape | Brak | Brak akcji (brak modali) |

## 9. Warunki i walidacja

### 9.1 Walidacja email

- **Warunek:** Pole nie może być puste
- **Warunek:** Musi zawierać poprawny format email (wyrażenie regularne)
- **Komunikat błędu (puste):** "Email jest wymagany"
- **Komunikat błędu (format):** "Podaj poprawny adres email"
- **Moment walidacji:** onBlur oraz onSubmit

### 9.2 Walidacja hasła

- **Warunek:** Pole nie może być puste
- **Warunek:** Minimum 6 znaków
- **Komunikat błędu (puste):** "Hasło jest wymagane"
- **Komunikat błędu (długość):** "Hasło musi mieć minimum 6 znaków"
- **Moment walidacji:** onBlur oraz onSubmit

### 9.3 Walidacja potwierdzenia hasła (tylko rejestracja)

- **Warunek:** Pole nie może być puste
- **Warunek:** Musi być identyczne z polem hasła
- **Komunikat błędu (puste):** "Potwierdzenie hasła jest wymagane"
- **Komunikat błędu (niezgodność):** "Hasła muszą być identyczne"
- **Moment walidacji:** onBlur oraz onSubmit

### 9.4 Wpływ walidacji na interfejs

- Pola z błędami otrzymują klasę CSS dla czerwonej ramki
- Pola z błędami mają atrybut `aria-invalid="true"`
- Komunikaty błędów pojawiają się pod polami
- Przycisk submit jest aktywny, ale walidacja blokuje wysłanie
- Podczas wysyłania przycisk jest wyłączony i pokazuje spinner

## 10. Obsługa błędów

### 10.1 Błędy walidacji client-side

- Wyświetlane inline pod odpowiednimi polami
- Blokują wysłanie formularza
- Znikają po poprawieniu danych

### 10.2 Błędy autentykacji Supabase

| Błąd Supabase | Komunikat dla użytkownika |
|---------------|---------------------------|
| Invalid login credentials | "Nieprawidłowy email lub hasło" |
| Email not confirmed | "Potwierdź swój adres email" |
| User already registered | "Konto z tym adresem email już istnieje" |
| Password should be at least 6 characters | "Hasło musi mieć minimum 6 znaków" |
| Inne błędy | "Wystąpił błąd. Spróbuj ponownie później" |

### 10.3 Błędy sieciowe

- Wyświetlany komunikat: "Nie można połączyć z serwerem. Sprawdź połączenie internetowe."
- Przycisk submit wraca do stanu aktywnego
- Użytkownik może ponowić próbę

### 10.4 Względy bezpieczeństwa w błędach

- Komunikaty błędów logowania NIE rozróżniają "nieprawidłowy email" od "nieprawidłowe hasło"
- Zapobiega to enumeracji kont użytkowników
- Używany ogólny komunikat: "Nieprawidłowy email lub hasło"

## 11. Kroki implementacji

### Krok 1: Konfiguracja środowiska

1. Dodać zmienne środowiskowe dla klienta przeglądarki w `.env`:
   ```
   PUBLIC_SUPABASE_URL=...
   PUBLIC_SUPABASE_ANON_KEY=...
   ```
2. Zainstalować `@supabase/ssr`:
   ```bash
   npm install @supabase/ssr
   ```

### Krok 2: Instalacja komponentów Shadcn/ui

Zainstalować wymagane komponenty przez CLI Shadcn:
```bash
npx shadcn@latest add input label tabs
```
(Card i Button już istnieją w projekcie)

### Krok 3: Utworzenie klienta Supabase dla przeglądarki

Utworzyć plik `src/db/supabase.browser.ts`:
- Export funkcji `createSupabaseBrowserClient()`
- Konfiguracja z `@supabase/ssr` dla obsługi cookies

### Krok 4: Utworzenie schematów walidacji

Utworzyć plik `src/lib/schemas/auth.schema.ts`:
- `loginSchema` z walidacją email i hasła
- `registerSchema` z walidacją zgodności haseł
- Export typów `LoginFormValues` i `RegisterFormValues`

### Krok 5: Implementacja hooka useAuthForm

Utworzyć plik `src/lib/hooks/useAuthForm.ts`:
- Generyczny hook dla logiki formularzy z integracją Zod
- Zarządzanie stanem: values, errors, isSubmitting, submitError
- Funkcje: handleChange, handleBlur, handleSubmit, reset
- Walidacja przez schema Zod przy blur i submit

### Krok 6: Implementacja komponentów pomocniczych

Utworzyć pliki:
- `src/components/auth/FormField.tsx` - wrapper dla pola formularza
- `src/components/auth/FormError.tsx` - komunikat błędu ogólnego

### Krok 7: Implementacja formularzy

Utworzyć pliki:
- `src/components/auth/LoginForm.tsx` - formularz logowania
- `src/components/auth/RegisterForm.tsx` - formularz rejestracji

Każdy formularz:
- Używa hooka `useAuthForm` z odpowiednim schematem Zod
- Integruje się z Supabase Auth (`signInWithPassword` / `signUp`)
- Mapuje błędy Supabase na polskie komunikaty
- Przekierowuje na `/` po sukcesie

### Krok 8: Implementacja kontenerów

Utworzyć pliki:
- `src/components/auth/AuthTabs.tsx` - przełącznik zakładek
- `src/components/auth/AuthCard.tsx` - główny kontener z zachowaniem stanu formularzy

### Krok 9: Utworzenie strony Astro

Utworzyć plik `src/pages/login.astro`:
- Sprawdzenie `Astro.locals.user` (ustawiane przez middleware)
- Przekierowanie zalogowanych na `/`
- Osadzenie `AuthCard` z dyrektywą `client:load`

### Krok 10: Stylowanie i responsywność

- Wyśrodkowanie karty (flex, items-center, justify-center, min-h-screen)
- Maksymalna szerokość (max-w-md)
- Responsywne paddingi
- Stylowanie stanów błędów (czerwona ramka, aria-invalid)

### Krok 11: Testowanie manualne

Scenariusze do przetestowania:
- [ ] Logowanie z poprawnymi danymi → przekierowanie na /
- [ ] Logowanie z błędnymi danymi → komunikat "Nieprawidłowy email lub hasło"
- [ ] Rejestracja nowego konta → przekierowanie na /
- [ ] Rejestracja z istniejącym emailem → komunikat błędu
- [ ] Rejestracja z niezgodnymi hasłami → komunikat inline
- [ ] Przełączanie zakładek → dane zachowane
- [ ] Dostęp do /login gdy zalogowany → przekierowanie na /
- [ ] Nawigacja Tab między polami
- [ ] Submit formularza przez Enter

---

## 12. Historia zmian dokumentu

### v1.1 (2026-01-21)

Zmiany wprowadzone po code review:

1. **Dodano sekcję 1.1 Powiązane dokumenty** - jawne odniesienia do PRD, UI Plan i middleware
2. **Dodano sekcję 1.2 Decyzje architektoniczne** - język PL, walidacja Zod, sesje cookie-based
3. **Zaktualizowano sekcję 5 Typy** - dodano schematy Zod z polskimi komunikatami (`auth.schema.ts`)
4. **Dodano sekcję 7A Integracja z Middleware** - opis działania middleware i wykorzystania w login.astro
5. **Dodano sekcję 7.3** - specyfikacja klienta Supabase dla przeglądarki (`@supabase/ssr`)
6. **Przeorganizowano kroki implementacji** - logiczna kolejność: środowisko → typy/schematy → hooki → komponenty → strona
7. **Rozszerzono scenariusze testowe** - konkretne przypadki z checklistą
