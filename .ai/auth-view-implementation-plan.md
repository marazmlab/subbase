# Plan implementacji widoku Autentykacji

## 1. Przegląd

Widok autentykacji służy jako punkt wejścia dla użytkowników aplikacji Subbase. Umożliwia rejestrację nowych kont oraz logowanie do istniejących kont. Widok jest zbudowany jako interaktywny komponent React osadzony w stronie Astro, wykorzystujący Supabase Auth do obsługi autentykacji. Głównym celem jest zapewnienie bezpiecznego, dostępnego i intuicyjnego procesu autentykacji z odpowiednią walidacją danych i informacją zwrotną dla użytkownika.

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

## 5. Typy

### 5.1 Typy formularza logowania

```typescript
/** Wartości formularza logowania */
interface LoginFormValues {
  email: string;
  password: string;
}

/** Błędy walidacji formularza logowania */
interface LoginFormErrors {
  email?: string;
  password?: string;
}
```

### 5.2 Typy formularza rejestracji

```typescript
/** Wartości formularza rejestracji */
interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

/** Błędy walidacji formularza rejestracji */
interface RegisterFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}
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

### 7.3 Klient Supabase

Wykorzystać istniejący klient z `src/db/supabase.client.ts`. W komponencie React utworzyć instancję klienta odpowiednią dla przeglądarki.

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

### Krok 1: Utworzenie strony Astro

Utworzyć plik `src/pages/login.astro`:
- Import Layout
- Sprawdzenie sesji użytkownika i przekierowanie zalogowanych na `/`
- Osadzenie komponentu AuthCard z dyrektywą `client:load`

### Krok 2: Implementacja komponentu FormField

Utworzyć plik `src/components/auth/FormField.tsx`:
- Zdefiniować interfejs `FormFieldProps`
- Zaimplementować komponent z Label, Input i komunikatem błędu
- Dodać atrybuty dostępności (htmlFor, aria-invalid, aria-describedby)

### Krok 3: Implementacja komponentu FormError

Utworzyć plik `src/components/auth/FormError.tsx`:
- Prosty komponent wyświetlający komunikat błędu
- Atrybuty role="alert" i aria-live="polite"
- Warunkowe renderowanie (null gdy brak błędu)

### Krok 4: Implementacja hooka useAuthForm

Utworzyć plik `src/lib/hooks/useAuthForm.ts`:
- Generyczny hook dla logiki formularzy
- Zarządzanie stanem values, errors, isSubmitting, submitError
- Funkcje handleChange, handleBlur, handleSubmit

### Krok 5: Implementacja LoginForm

Utworzyć plik `src/components/auth/LoginForm.tsx`:
- Użycie hooka useAuthForm z walidacją dla logowania
- Integracja z Supabase Auth signInWithPassword
- Mapowanie błędów Supabase na komunikaty
- Przekierowanie po sukcesie

### Krok 6: Implementacja RegisterForm

Utworzyć plik `src/components/auth/RegisterForm.tsx`:
- Użycie hooka useAuthForm z walidacją dla rejestracji
- Walidacja zgodności haseł
- Integracja z Supabase Auth signUp
- Mapowanie błędów Supabase na komunikaty
- Przekierowanie po sukcesie

### Krok 7: Implementacja AuthTabs

Utworzyć plik `src/components/auth/AuthTabs.tsx`:
- Wykorzystanie Tabs z Shadcn/ui
- Zarządzanie stanem aktywnej zakładki
- Przekazywanie children do TabsContent

### Krok 8: Implementacja AuthCard

Utworzyć plik `src/components/auth/AuthCard.tsx`:
- Wykorzystanie Card z Shadcn/ui
- Zarządzanie stanem formularzy (zachowanie przy przełączaniu)
- Kompozycja AuthTabs, LoginForm, RegisterForm

### Krok 9: Dodanie komponentów Shadcn/ui

Zainstalować wymagane komponenty przez CLI Shadcn:
- Input
- Label
- Tabs
- (Card już istnieje)
- (Button już istnieje)

### Krok 10: Stylowanie i responsywność

- Wyśrodkowanie karty na stronie (flex, items-center, justify-center)
- Maksymalna szerokość karty (max-w-md)
- Responsywne marginesy i paddingi
- Stylowanie stanów błędów pól formularza

### Krok 11: Testowanie dostępności

- Sprawdzenie nawigacji Tab
- Sprawdzenie czytników ekranu (aria-labels, role="alert")
- Sprawdzenie kontrastu kolorów
- Sprawdzenie fokusa na polach

### Krok 12: Testowanie integracyjne

- Test pomyślnego logowania
- Test pomyślnej rejestracji
- Test błędnych danych
- Test przełączania zakładek z zachowaniem danych
- Test przekierowania zalogowanych użytkowników
