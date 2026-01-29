# Specyfikacja Techniczna Modułu Autentykacji — Subbase

## 1. Wprowadzenie

Niniejsza specyfikacja opisuje architekturę modułu rejestracji, logowania i odzyskiwania hasła użytkowników w aplikacji Subbase. Dokument powstał na podstawie wymagań US-001, US-002 i US-003 z Product Requirements Document oraz stosując stos technologiczny: Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui oraz Supabase Auth.

Aplikacja wykorzystuje hybrydowe podejście do renderowania:
- **Tryb SSR (Server-Side Rendering)** — strony Astro renderowane po stronie serwera w trybie `output: "server"`
- **Komponenty React** — dynamiczne komponenty klienckie wstrzykiwane do stron Astro z użyciem dyrektywy `client:load`
- **API Routes** — endpointy Astro API zwracające JSON dla operacji CRUD na subskrypcjach

### 1.1. Zakres Specyfikacji

Specyfikacja obejmuje:
1. **Architekturę interfejsu użytkownika** — strony Astro, komponenty React, formularze autentykacji
2. **Logikę backendową** — middleware, klienty Supabase, endpointy API
3. **System autentykacji** — integracja Supabase Auth, zarządzanie sesją, izolacja danych użytkowników

### 1.2. Status Implementacji

**Cała funkcjonalność autentykacji wymagana przez MVP została już zaimplementowana zgodnie z US-001, US-002, US-003.** 

Niniejsza specyfikacja:
- Dokumentuje istniejącą architekturę
- Weryfikuje zgodność z wymaganiami PRD
- Wskazuje przyszłe rozszerzenia (POZA ZAKRESEM MVP) dla celów roadmap

**Status zgodności z PRD:**
- ✅ US-001 (Rejestracja i Logowanie): 100% zaimplementowane
- ✅ US-002 (Przekierowania i Wylogowanie): 100% zaimplementowane  
- ✅ US-003 (Izolacja Danych): 100% zaimplementowane

### 1.3. Wyniki Weryfikacji PRD (2026-01-29)

Dokument został zweryfikowany pod kątem sprzeczności i nadmiarowych założeń względem PRD. Wyniki:

**✅ ZGODNOŚCI:**
- Wszystkie wymagania z US-001, US-002, US-003 są w pełni pokryte
- Architektura middleware, RLS i flow autentykacji zgodna z PRD
- Komunikaty błędów i UX zgodne z wymogami PRD

**⚠️ ROZWIĄZANE SPRZECZNOŚCI:**
1. **Email Confirmation:** Wyraźnie zadokumentowano, że **MUSI być wyłączona** w Supabase dla MVP (US-001 wymaga automatycznego logowania)
2. **Password Reset:** Przeniesiono do sekcji "POZA ZAKRESEM MVP" (brak wymagań w PRD)
3. **HTTP Interceptor:** Oznaczono jako "POZA ZAKRESEM MVP" (acceptable behavior dla MVP: wylogowanie przy wygasłym tokenie)
4. **AI Insights Error Handling:** Wyraźnie oddzielono concerns (moduł autentykacji vs. dashboard logic)

**📋 NADMIAROWE SEKCJE (zachowane dla roadmap):**
- Sekcja 4.4: Password Reset (wyraźnie oznaczona jako "POZA ZAKRESEM MVP")
- Sekcja 9.4: Rekomendacje na przyszłość (wyraźnie oznaczona jako roadmap)

**✅ KRYTYCZNE DECYZJE KONFIGURACYJNE:**
```
Supabase Configuration dla MVP:
- Email confirmations: OFF (WYMAGANE dla US-001)
- Rate limiting: ON (default - wystarczające dla MVP)
- Password reset templates: Niewymagane (poza zakresem MVP)
```

---

## 2. Architektura Interfejsu Użytkownika

### 2.1. Tryby Widoku Aplikacji

Aplikacja działa w dwóch głównych trybach widoku:

#### 2.1.1. Tryb Non-Auth (Niezalogowany)

Użytkownik niezalogowany ma dostęp **wyłącznie** do strony logowania:

| Strona | Ścieżka | Opis |
|--------|---------|------|
| **Strona logowania** | `/login` | Strona zawierająca formularz logowania i rejestracji |

**Mechanizm przekierowań:**
- Użytkownik niezalogowany próbujący uzyskać dostęp do `/` (dashboard) jest **automatycznie przekierowany** na `/login`
- Przekierowanie realizowane przez middleware Astro po stronie serwera (SSR)

#### 2.1.2. Tryb Auth (Zalogowany)

Użytkownik zalogowany ma dostęp do:

| Strona | Ścieżka | Opis |
|--------|---------|------|
| **Dashboard** | `/` | Główna strona aplikacji z listą subskrypcji, podsumowaniem kosztów i przyciskiem generowania AI insights |

**Mechanizm przekierowań:**
- Użytkownik zalogowany próbujący uzyskać dostęp do `/login` jest **automatycznie przekierowany** na `/` (dashboard)
- Przekierowanie realizowane przez middleware Astro po stronie serwera (SSR)

### 2.2. Strony Astro (Server-Side Rendered)

#### 2.2.1. Strona `/login` — `src/pages/login.astro`

**Opis:** Strona autentykacji z formularzem logowania i rejestracji.

**Logika SSR:**
```typescript
// Middleware ustawia locals.user po weryfikacji sesji z cookies
const user = Astro.locals.user;

// Przekieruj zalogowanych użytkowników na dashboard
if (user) {
  return Astro.redirect("/");
}
```

**Struktura renderowanego widoku:**
```html
<Layout title="Logowanie - Subbase">
  <main class="flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
    <AuthCard client:load />
  </main>
</Layout>
```

**Kluczowe elementy:**
- **Layout** — bazowy layout Astro z meta-tagami i stylami globalnymi
- **AuthCard** — komponent React wstrzykiwany z dyrektywą `client:load` (hydratacja natychmiastowa po załadowaniu strony)
- **Centrowane wyrównanie** — użycie Flexbox dla wyśrodkowania karty na ekranie

#### 2.2.2. Strona `/` (Dashboard) — `src/pages/index.astro`

**Opis:** Główna strona aplikacji dostępna tylko dla zalogowanych użytkowników.

**Logika SSR:**
```typescript
// Middleware automatycznie ustawia locals.user
const user = Astro.locals.user;

// Przekieruj niezalogowanych użytkowników na stronę logowania
if (!user) {
  return Astro.redirect("/login");
}
```

**Struktura renderowanego widoku:**
```html
<Layout title="Dashboard - Subbase">
  <DashboardLayout client:load />
</Layout>
```

**Kluczowe elementy:**
- **DashboardLayout** — główny kontener zarządzający stanem dashboardu (lista subskrypcji, summary, AI insights)
- **Komponent React** — wstrzyknięty z dyrektywą `client:load`

### 2.3. Komponenty Autentykacji (React)

System autentykacji składa się z hierarchii komponentów React zlokalizowanych w katalogu `src/components/auth/`:

```
src/components/auth/
├── index.ts                  # Barrel export
├── AuthCard.tsx              # Główny kontener widoku autentykacji
├── AuthTabs.tsx              # Przełącznik Login/Register
├── LoginForm.tsx             # Formularz logowania
├── RegisterForm.tsx          # Formularz rejestracji
├── FormField.tsx             # Uniwersalny komponent pola formularza
├── FormError.tsx             # Komponent komunikatu błędu
└── AuthTopBar.tsx            # Top bar z przełącznikiem motywu
```

#### 2.3.1. AuthCard — `src/components/auth/AuthCard.tsx`

**Odpowiedzialność:**
- Główny kontener widoku autentykacji
- Zarządzanie stanem aktywnej zakładki (`login` | `register`)
- Zachowywanie wartości formularzy przy przełączaniu między zakładkami (state preservation)
- Obsługa sukcesu logowania/rejestracji (przekierowanie na `/`)

**Kluczowe funkcjonalności:**

1. **State preservation przy przełączaniu zakładek:**
```typescript
const [loginFormValues, setLoginFormValues] = useState<LoginFormValues>({
  email: "",
  password: "",
});

const [registerFormValues, setRegisterFormValues] = useState<RegisterFormValues>({
  email: "",
  password: "",
  confirmPassword: "",
});
```

2. **Callback sukcesu autentykacji:**
```typescript
const handleAuthSuccess = useCallback(() => {
  window.location.href = "/";
}, []);
```

**Struktura komponentu:**
```tsx
<ThemeProvider>
  <AuthTopBar />
  <Card className="w-full max-w-md">
    <CardHeader className="text-center">
      <CardTitle className="text-2xl">Subbase</CardTitle>
      <CardDescription>
        {activeTab === "login" ? "Zaloguj się do swojego konta" : "Utwórz nowe konto"}
      </CardDescription>
    </CardHeader>

    <CardContent>
      <AuthTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        loginContent={<LoginForm {...loginProps} />}
        registerContent={<RegisterForm {...registerProps} />}
      />
    </CardContent>
  </Card>
</ThemeProvider>
```

**Integracja z Shadcn/ui:**
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` — komponenty z `@/components/ui/card`
- `ThemeProvider` — dostawca kontekstu motywu (jasny/ciemny)

#### 2.3.2. AuthTabs — `src/components/auth/AuthTabs.tsx`

**Odpowiedzialność:**
- Przełącznik między formularzem logowania a rejestracją
- Implementacja komponentu `Tabs` z Shadcn/ui

**Kontrakt (props):**
```typescript
export type AuthTabValue = "login" | "register";

export interface AuthTabsProps {
  activeTab: AuthTabValue;
  onTabChange: (tab: AuthTabValue) => void;
  loginContent: React.ReactNode;
  registerContent: React.ReactNode;
}
```

**Kluczowe funkcjonalności:**
- Grid layout dla przycisków zakładek (50/50)
- Controlled component — rodzic zarządza stanem `activeTab`

**Wymagania accessibility:**
- Nawigacja klawiaturą (Tab, Enter)
- Semantyczne atrybuty ARIA z komponentu Tabs

#### 2.3.3. LoginForm — `src/components/auth/LoginForm.tsx`

**Odpowiedzialność:**
- Formularz logowania z walidacją klient-side
- Integracja z Supabase Auth (`signInWithPassword`)
- Mapowanie błędów API na polskie komunikaty

**Kontrakt (props):**
```typescript
export interface LoginFormProps {
  initialValues?: LoginFormValues;
  onValuesChange?: (values: LoginFormValues) => void;
  onSuccess: () => void;  // Wymagany - rodzic decyduje o nawigacji
}
```

**Pola formularza:**
1. **Email** — `type="email"`, walidacja regex, autocomplete="email"
2. **Hasło** — `type="password"`, min 6 znaków, autocomplete="current-password"

**Walidacja (Zod schema — `src/lib/schemas/auth.schema.ts`):**
```typescript
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
```

**Proces logowania:**
```typescript
const onSubmit = async (formValues) => {
  const supabase = createSupabaseBrowserClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formValues.email,
    password: formValues.password,
  });

  if (error) {
    setSubmitError(mapAuthError(error));
    return;
  }

  onSuccess(); // Przekierowanie do dashboardu
};
```

**Mapowanie błędów API na komunikaty PL:**
| Błąd Supabase | Komunikat dla użytkownika |
|---------------|---------------------------|
| `invalid login credentials` | "Nieprawidłowy email lub hasło" |
| `email not confirmed` | "Potwierdź swój adres email" |
| `network` / `fetch` | "Nie można połączyć z serwerem. Sprawdź połączenie internetowe." |
| Inne | "Wystąpił błąd. Spróbuj ponownie później" |

**Wymagania bezpieczeństwa (zgodnie z US-001):**
- ✅ Nie rozróżniaj w komunikacie czy błędny był email czy hasło (zapobiega enumeracji kont)

**Wymagania UX:**
- ✅ Spinner przy submit (`<Loader2 className="animate-spin" />`)
- ✅ Dezaktywacja przycisków podczas ładowania
- ✅ Błędy inline pod polami
- ✅ Obsługa Enter (submit) i Tab (nawigacja)

#### 2.3.4. RegisterForm — `src/components/auth/RegisterForm.tsx`

**Odpowiedzialność:**
- Formularz rejestracji z walidacją klient-side
- Integracja z Supabase Auth (`signUp`)
- Mapowanie błędów API na polskie komunikaty

**Kontrakt (props):**
```typescript
export interface RegisterFormProps {
  initialValues?: RegisterFormValues;
  onValuesChange?: (values: RegisterFormValues) => void;
  onSuccess: () => void;
}
```

**Pola formularza:**
1. **Email** — `type="email"`, walidacja regex, autocomplete="email"
2. **Hasło** — `type="password"`, min 6 znaków, autocomplete="new-password"
3. **Potwierdzenie hasła** — `type="password"`, musi być identyczne z hasłem, autocomplete="new-password"

**Walidacja (Zod schema — `src/lib/schemas/auth.schema.ts`):**
```typescript
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
```

**Proces rejestracji:**
```typescript
const onSubmit = async (formValues) => {
  const supabase = createSupabaseBrowserClient();

  const { error } = await supabase.auth.signUp({
    email: formValues.email,
    password: formValues.password,
  });

  if (error) {
    setSubmitError(mapAuthError(error));
    return;
  }

  onSuccess(); // Automatyczne zalogowanie + przekierowanie
};
```

**Mapowanie błędów API na komunikaty PL:**
| Błąd Supabase | Komunikat dla użytkownika |
|---------------|---------------------------|
| `user already registered` | "Konto z tym adresem email już istnieje" |
| `password should be at least` | "Hasło musi mieć minimum 6 znaków" |
| `invalid email` | "Podaj poprawny adres email" |
| `network` / `fetch` | "Nie można połączyć z serwerem. Sprawdź połączenie internetowe." |
| Inne | "Wystąpił błąd. Spróbuj ponownie później" |

**Wymagania zgodnie z US-001:**
- ✅ Po pomyślnej rejestracji użytkownik jest **automatycznie zalogowany**
- ✅ Po zalogowaniu następuje przekierowanie na `/` (dashboard)

#### 2.3.5. FormField — `src/components/auth/FormField.tsx`

**Odpowiedzialność:**
- Uniwersalny komponent pola formularza
- Spójne renderowanie labela, inputa i komunikatu błędu
- Atrybuty accessibility (ARIA)

**Kontrakt (props):**
```typescript
export interface FormFieldProps {
  id?: string;
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
```

**Struktura renderowania:**
```tsx
<div className="space-y-2">
  <Label htmlFor={id} className={cn(error && "text-destructive")}>
    {label}
  </Label>
  <Input
    id={id}
    type={type}
    value={value}
    disabled={disabled}
    autoComplete={autoComplete}
    placeholder={placeholder}
    aria-invalid={error ? "true" : "false"}
    aria-describedby={error ? errorId : undefined}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
  />
  {error && (
    <p
      id={errorId}
      role="alert"
      aria-live="polite"
      className="text-sm font-medium text-destructive"
    >
      {error}
    </p>
  )}
</div>
```

**Integracja z Shadcn/ui:**
- `Label` — komponent z `@/components/ui/label`
- `Input` — komponent z `@/components/ui/input`
- `cn()` — utility function do łączenia class names

**Atrybuty accessibility:**
- ✅ `aria-invalid` — informuje screen readery o błędzie walidacji
- ✅ `aria-describedby` — łączy input z komunikatem błędu
- ✅ `role="alert"` + `aria-live="polite"` — ogłasza błędy screen readerom

#### 2.3.6. FormError — `src/components/auth/FormError.tsx`

**Odpowiedzialność:**
- Wyświetlanie ogólnych błędów formularza (np. błędy autentykacji z API)
- Renderowanie tylko gdy `message` jest truthy

**Kontrakt (props):**
```typescript
export interface FormErrorProps {
  message?: string | null;
}
```

**Struktura renderowania:**
```tsx
<div
  role="alert"
  aria-live="polite"
  className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
>
  <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
  <span>{message}</span>
</div>
```

**Integracja z Lucide React:**
- `AlertCircle` — ikona błędu

#### 2.3.7. AuthTopBar — `src/components/auth/AuthTopBar.tsx`

**Odpowiedzialność:**
- Top bar widoczny na stronie logowania
- Przełącznik motywu (jasny/ciemny)

**Struktura:**
```tsx
<header className="fixed right-4 top-4 z-50">
  <ThemeToggle />
</header>
```

**Pozycjonowanie:**
- Fixed positioning w prawym górnym rogu
- Z-index 50 dla zawsze widocznego overlay

### 2.4. Hook Zarządzania Formularzem — `useAuthForm`

**Lokalizacja:** `src/components/hooks/useAuthForm.ts`

**Odpowiedzialność:**
- Generyczny hook do zarządzania formularzami autentykacji
- Integracja z Zod dla walidacji
- Zarządzanie stanem: values, errors, isSubmitting, submitError

**Kontrakt:**
```typescript
interface UseAuthFormOptions<TValues> {
  initialValues: TValues;
  schema: z.ZodSchema<TValues>;
  onSubmit: (values: TValues) => Promise<void>;
  onValuesChange?: (values: TValues) => void;
}

function useAuthForm<TValues>({
  initialValues,
  schema,
  onSubmit,
  onValuesChange,
}: UseAuthFormOptions<TValues>)
```

**Zwracane funkcje:**
```typescript
{
  values: TValues;
  errors: Partial<Record<keyof TValues, string>>;
  isSubmitting: boolean;
  submitError: string | null;
  handleChange: (name: keyof TValues, value: string) => void;
  handleBlur: (name: keyof TValues) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  reset: () => void;
  setSubmitError: (error: string | null) => void;
  setValues: (values: TValues) => void;
}
```

**Mechanizm walidacji:**
1. **Inline (blur)** — walidacja pojedynczego pola po opuszczeniu
2. **Submit** — walidacja wszystkich pól przed wywołaniem `onSubmit`
3. **Real-time clear** — czyszczenie błędów przy zmianie wartości

**Przykład użycia:**
```typescript
const { values, errors, isSubmitting, submitError, handleChange, handleBlur, handleSubmit } = 
  useAuthForm({
    initialValues: { email: '', password: '' },
    schema: loginSchema,
    onSubmit: async (formValues) => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword(formValues);
      if (error) setSubmitError(mapAuthError(error));
      else onSuccess();
    },
  });
```

### 2.5. Komponenty Dashboard (Widok Zalogowany)

**Lokalizacja:** `src/components/dashboard/`

**Kluczowe komponenty związane z autentykacją:**

#### 2.5.1. TopBar — `src/components/dashboard/TopBar.tsx`

**Odpowiedzialność:**
- Top bar widoczny na dashboardzie
- Przycisk wylogowania
- Przełącznik motywu

**Funkcjonalność wylogowania:**
```typescript
const handleLogout = useCallback(async () => {
  setIsLoggingOut(true);

  try {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  } catch {
    setIsLoggingOut(false);
  }
}, []);
```

**Struktura:**
```tsx
<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
  <div className="mx-auto flex h-14 max-w-[var(--container-max-width)] items-center justify-between px-4">
    <a href="/" className="flex items-center space-x-2">
      <span className="text-xl font-bold text-primary">Subbase</span>
    </a>

    <div className="flex items-center gap-2">
      <ThemeToggle />
      <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
        <LogOut className="size-4" />
        <span className="hidden sm:inline">
          {isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}
        </span>
      </Button>
    </div>
  </div>
</header>
```

**Wymagania zgodnie z US-002:**
- ✅ Przycisk "Wyloguj" widoczny w TopBar
- ✅ Wywołanie `supabase.auth.signOut()`
- ✅ Przekierowanie na `/login` po wylogowaniu
- ✅ Usunięcie cookies sesji

**Wymagania UX:**
- ✅ Dezaktywacja przycisku podczas wylogowywania
- ✅ Tekst "Wylogowywanie..." podczas akcji
- ✅ Responsywność (ukrycie tekstu na małych ekranach)

---

## 3. Logika Backendowa

### 3.1. Middleware Autentykacji — `src/middleware/index.ts`

**Odpowiedzialność:**
- Weryfikacja sesji użytkownika dla każdego requestu
- Tworzenie instancji klienta Supabase z właściwym kontekstem
- Ustawianie `context.locals.user` i `context.locals.supabase`
- Implementacja dwóch mechanizmów autentykacji: cookie-based (strony) i token-based (API)

#### 3.1.1. Mechanizm dla Stron Astro (non-API routes)

**Typ autentykacji:** Cookie-based session (SSR)

**Proces:**
1. Middleware tworzy instancję Supabase Client z `createServerClient` z biblioteki `@supabase/ssr`
2. Klient odczytuje cookies z `context.request.headers.get("cookie")`
3. Wywołanie `supabase.auth.getUser()` weryfikuje sesję na podstawie cookies
4. Jeśli sesja jest ważna, `context.locals.user` zawiera obiekt użytkownika
5. Jeśli sesja jest nieważna lub wygasła, `context.locals.user` = `null`

**Implementacja:**
```typescript
const supabase: TypedSupabaseClient = createServerClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    cookies: {
      getAll() {
        const cookieHeader = context.request.headers.get("cookie");
        if (!cookieHeader) return [];

        // Parse cookie header manually
        return cookieHeader.split(";").map((cookie) => {
          const [name, ...rest] = cookie.trim().split("=");
          return {
            name: name.trim(),
            value: rest.join("=").trim(),
          };
        });
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          context.cookies.set(name, value, options);
        });
      },
    },
  }
);

context.locals.supabase = supabase;

const { data: { user } } = await supabase.auth.getUser();
context.locals.user = user;
```

**Kluczowe elementy:**
- ✅ Odczyt cookies z headera HTTP
- ✅ Parsowanie cookies ręcznie (Astro nie posiada `getAll()`)
- ✅ Ustawienie cookies przez `context.cookies.set()` (refresh token rotation)
- ✅ Automatyczna weryfikacja sesji przez Supabase

#### 3.1.2. Mechanizm dla API Routes (`/api/*`)

**Typ autentykacji:** JWT Bearer Token (Header-based)

**Proces:**
1. Middleware tworzy instancję Supabase Client z `createServerClient`
2. Odczytuje token JWT z nagłówka `Authorization: Bearer <token>`
3. Token przekazywany jest w opcjach klienta jako `global.headers.Authorization`
4. Wywołanie `supabase.auth.getUser(token)` weryfikuje token JWT
5. Jeśli token jest ważny, `context.locals.user` zawiera obiekt użytkownika
6. Jeśli token jest nieważny, `context.locals.user` = `null`

**Implementacja:**
```typescript
const authHeader = context.request.headers.get("Authorization");
const token = authHeader?.replace("Bearer ", "");

const supabase: TypedSupabaseClient = createServerClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    cookies: {
      getAll: () => [],
      setAll: () => {}, // No-op - nie zarządzamy cookies w API routes
    },
  }
);

context.locals.supabase = supabase;

if (token) {
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error) {
    console.error("Auth error:", error.message);
    context.locals.user = null;
  } else {
    context.locals.user = user;
  }
} else {
  context.locals.user = null;
}
```

**Różnice w konfiguracji dla API routes:**
- ✅ `autoRefreshToken: false` — brak automatycznego odświeżania (stateless API)
- ✅ `persistSession: false` — brak persystencji sesji
- ✅ Cookies zwracają puste tablice (no-op) — API nie zarządza cookies

#### 3.1.3. Kontrakt Middleware

**Ustawiane właściwości `context.locals`:**
```typescript
export interface Locals {
  supabase: TypedSupabaseClient;  // Instancja klienta Supabase
  user: User | null;               // Obiekt zalogowanego użytkownika lub null
}
```

**Dostępność w stronach Astro:**
```typescript
const user = Astro.locals.user;
const supabase = Astro.locals.supabase;
```

**Dostępność w API routes:**
```typescript
export async function GET({ locals }: APIContext) {
  const user = locals.user;
  const supabase = locals.supabase;
  
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
      status: 401 
    });
  }
  
  // ... logika endpointu
}
```

### 3.2. Klienty Supabase

#### 3.2.1. Klient Server-Side — `src/db/supabase.client.ts`

**Użycie:** Middleware (legacy - obecnie używamy `createServerClient` z `@supabase/ssr`)

**Implementacja:**
```typescript
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export type TypedSupabaseClient = SupabaseClient<Database>;

export const supabaseClient: TypedSupabaseClient = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);
```

**Typ klienta:** `SupabaseClient<Database>` — typowany generycznymi typami bazy danych z `database.types.ts`

**Zmienne środowiskowe (server-side):**
- `SUPABASE_URL` — URL instancji Supabase
- `SUPABASE_KEY` — Anon key (publiczny klucz API)

#### 3.2.2. Klient Browser-Side — `src/db/supabase.browser.ts`

**Użycie:** Komponenty React (logowanie, rejestracja, wylogowanie)

**Implementacja:**
```typescript
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/db/database.types";

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_KEY
  );
}
```

**Typ klienta:** `SupabaseClient<Database>` — zwracany przez `createBrowserClient`

**Zmienne środowiskowe (client-side - prefiks PUBLIC_):**
- `PUBLIC_SUPABASE_URL` — URL instancji Supabase
- `PUBLIC_SUPABASE_KEY` — Anon key (publiczny klucz API)

**Dlaczego funkcja zamiast singleton:**
- Pozwala na tworzenie nowego klienta w każdym komponencie
- Zapewnia prawidłowe zarządzanie cookies w przeglądarce

**Użycie w komponentach:**
```typescript
const supabase = createSupabaseBrowserClient();

// Logowanie
await supabase.auth.signInWithPassword({ email, password });

// Rejestracja
await supabase.auth.signUp({ email, password });

// Wylogowanie
await supabase.auth.signOut();
```

### 3.3. Typowanie Bazy Danych — `src/db/database.types.ts`

**Odpowiedzialność:**
- Definicja typów TypeScript dla tabel, widoków, funkcji i enumów bazy danych
- Generowane automatycznie przez Supabase CLI

**Kluczowe typy:**
```typescript
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; created_at: string; updated_at: string };
        Insert: { id: string; created_at?: string; updated_at?: string };
        Update: { id?: string; created_at?: string; updated_at?: string };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          cost: number;
          currency: string;
          billing_cycle: string;
          status: string;
          start_date: string;
          next_billing_date: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: { /* ... */ };
        Update: { /* ... */ };
      };
    };
    // ... Functions, Enums, Views
  };
}
```

**Użycie:**
```typescript
import type { Database } from "@/db/database.types";

const supabase = createClient<Database>(url, key);

// Zapytania są teraz typowane
const { data } = await supabase
  .from("subscriptions")
  .select("*")
  .eq("user_id", userId);
// data: Database["public"]["Tables"]["subscriptions"]["Row"][]
```

### 3.4. Endpointy API Autentykacji

**Uwaga:** Aplikacja **nie implementuje własnych endpointów API dla autentykacji**. Wszystkie operacje autentykacji (login, register, logout) są obsługiwane **bezpośrednio przez Supabase Auth** z komponentów React w przeglądarce.

**Istniejące endpointy API (nieautentykacyjne):**

| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/subscriptions` | GET | Pobieranie listy subskrypcji z filtrowaniem i paginacją |
| `/api/subscriptions` | POST | Tworzenie nowej subskrypcji |
| `/api/subscriptions/:id` | GET | Pobieranie pojedynczej subskrypcji |
| `/api/subscriptions/:id` | PATCH | Aktualizacja subskrypcji |
| `/api/subscriptions/:id` | DELETE | Usuwanie subskrypcji |
| `/api/subscriptions/summary` | GET | Podsumowanie kosztów i liczników |
| `/api/ai/insights` | POST | Generowanie AI insights |

**Wszystkie endpointy wymagają uwierzytelnienia:**
- Middleware ustawia `context.locals.user` na podstawie tokenu JWT z nagłówka `Authorization`
- Endpointy sprawdzają `if (!locals.user)` i zwracają `401 Unauthorized`

**Przykład weryfikacji autentykacji w endpoincie:**
```typescript
export async function GET({ locals }: APIContext) {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ... logika endpointu
}
```

### 3.5. Renderowanie SSR z Uwzględnieniem Autentykacji

**Konfiguracja Astro:** `output: "server"` — wszystkie strony renderowane po stronie serwera

**Proces renderowania strony `/login`:**
1. Request HTTP → Middleware
2. Middleware weryfikuje sesję (cookies) → ustawia `locals.user`
3. Strona `/login` sprawdza `if (user) return Astro.redirect("/")`
4. Jeśli użytkownik zalogowany → przekierowanie 302 na `/`
5. Jeśli niezalogowany → renderowanie strony z `<AuthCard />`

**Proces renderowania strony `/` (dashboard):**
1. Request HTTP → Middleware
2. Middleware weryfikuje sesję (cookies) → ustawia `locals.user`
3. Strona `/` sprawdza `if (!user) return Astro.redirect("/login")`
4. Jeśli użytkownik niezalogowany → przekierowanie 302 na `/login`
5. Jeśli zalogowany → renderowanie strony z `<DashboardLayout />`

**Kluczowe zalety SSR:**
- ✅ Przekierowania odbywają się **przed** renderowaniem UI (brak migotania)
- ✅ SEO-friendly (boty widzą przekierowania 302)
- ✅ Bezpieczeństwo (weryfikacja po stronie serwera, nie tylko klienta)

---

## 4. System Autentykacji

### 4.1. Integracja z Supabase Auth

**Wykorzystywane metody Supabase Auth:**

#### 4.1.1. Rejestracja — `signUp()`

**Wywołanie w komponentach React:**
```typescript
const supabase = createSupabaseBrowserClient();

const { data, error } = await supabase.auth.signUp({
  email: "user@example.com",
  password: "secret123",
});
```

**Proces po stronie Supabase:**
1. Utworzenie użytkownika w tabeli `auth.users`
2. **Trigger `on_auth_user_created`** automatycznie tworzy rekord w tabeli `public.profiles`
3. Zwrócenie sesji (access token + refresh token)

**Automatyczne logowanie po rejestracji:**
- ✅ Zgodnie z US-001: użytkownik jest automatycznie zalogowany po rejestracji
- ✅ **WYMAGANA KONFIGURACJA SUPABASE:** Email confirmation **MUSI** być wyłączona dla MVP
- ✅ Supabase zwraca sesję po `signUp()` (cookies są ustawiane automatycznie)
- ✅ Po `onSuccess()` następuje przekierowanie na `/`

**Konfiguracja Supabase (KRYTYCZNA dla US-001):**
```
Dashboard Supabase → Authentication → Settings:
- Enable email confirmations: OFF (wyłączone dla MVP)
```

#### 4.1.2. Logowanie — `signInWithPassword()`

**Wywołanie w komponentach React:**
```typescript
const supabase = createSupabaseBrowserClient();

const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "secret123",
});
```

**Proces po stronie Supabase:**
1. Weryfikacja credentials w tabeli `auth.users`
2. Jeśli poprawne → utworzenie sesji (access token + refresh token)
3. Cookies sesji są ustawiane automatycznie przez `@supabase/ssr`
4. Zwrócenie obiektu `user` i `session`

**Cookies ustawiane przez Supabase:**
| Cookie | Opis |
|--------|------|
| `sb-<project-ref>-auth-token` | Access token JWT (krótkoterminowy) |
| `sb-<project-ref>-auth-token-code-verifier` | PKCE verifier (dla refresh) |

#### 4.1.3. Wylogowanie — `signOut()`

**Wywołanie w komponentach React:**
```typescript
const supabase = createSupabaseBrowserClient();

await supabase.auth.signOut();
window.location.href = "/login";
```

**Proces po stronie Supabase:**
1. Unieważnienie sesji po stronie serwera
2. Usunięcie cookies sesji z przeglądarki
3. Wywołanie `window.location.href = "/login"` wymusza full page reload

**Dlaczego `window.location.href` zamiast client-side routing:**
- ✅ Zapewnia, że middleware zweryfikuje brak sesji po reload
- ✅ Czyści stan aplikacji (React components) po wylogowaniu
- ✅ Uniemożliwia dostęp do chronionych zasobów z cache

#### 4.1.4. Weryfikacja Sesji — `getUser()`

**Wywołanie w middleware (server-side):**
```typescript
// Cookie-based (strony Astro)
const { data: { user } } = await supabase.auth.getUser();

// Token-based (API routes)
const { data: { user }, error } = await supabase.auth.getUser(token);
```

**Proces weryfikacji:**
1. Weryfikacja podpisu JWT (access token)
2. Sprawdzenie czasu wygaśnięcia tokenu
3. Zwrócenie obiektu `user` lub `null`

**Automatyczny refresh tokenów:**
- ✅ Dla stron Astro (cookies): Supabase automatycznie odświeża tokeny przez `setAll()` callback
- ❌ Dla API routes: `autoRefreshToken: false` — brak automatycznego odświeżania (stateless)

### 4.2. Zarządzanie Sesją

#### 4.2.1. Sesja dla Stron Astro (Cookie-Based)

**Typ sesji:** Stateful (cookies przechowują tokeny)

**Cykl życia sesji:**
1. **Login** → Supabase ustawia cookies (`sb-*-auth-token`)
2. **Request** → Middleware odczytuje cookies → `getUser()` weryfikuje sesję
3. **Refresh** → Supabase automatycznie odświeża tokeny (refresh token rotation)
4. **Logout** → Cookies są usuwane

**Długość sesji:**
- Access token: 1 godzina (domyślnie)
- Refresh token: 30 dni (domyślnie)

**Automatyczne przedłużanie sesji:**
- ✅ Middleware wywołuje `getUser()` przy każdym request
- ✅ Jeśli access token wygasł, Supabase automatycznie używa refresh token
- ✅ Nowe tokeny są ustawiane przez callback `setAll()`

#### 4.2.2. Sesja dla API Routes (Token-Based)

**Typ sesji:** Stateless (JWT w nagłówku `Authorization`)

**Cykl życia requestu:**
1. **Klient** → Wysyła request z nagłówkiem `Authorization: Bearer <token>`
2. **Middleware** → Odczytuje token → `getUser(token)` weryfikuje JWT
3. **Endpoint** → Sprawdza `if (!locals.user)` → 401 lub wykonuje logikę

**Brak automatycznego refresh:**
- ❌ API routes nie odświeżają tokenów
- ❌ Klient musi samodzielnie zarządzać refresh tokenami (np. interceptor HTTP)

**Przykład wywołania API z frontendu:**
```typescript
const supabase = createSupabaseBrowserClient();
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch("/api/subscriptions", {
  headers: {
    "Authorization": `Bearer ${session?.access_token}`,
    "Content-Type": "application/json",
  },
});
```

### 4.3. Izolacja Danych Użytkowników (Row-Level Security)

**Zgodnie z US-003:** Dane użytkownika są prywatne i dostępne tylko dla właściciela.

#### 4.3.1. Struktura Bazy Danych

**Tabele:**

**1. `auth.users` (Supabase Auth - zarządzana automatycznie)**
- Zawiera credentials użytkowników
- Nie jest bezpośrednio dostępna dla aplikacji (zarządzana przez Supabase)

**2. `public.profiles`**
- Profil użytkownika połączony z `auth.users`
- Foreign key: `id` → `auth.users(id)` ON DELETE CASCADE
- Utworzenie automatyczne przez trigger `handle_new_user()`

**3. `public.subscriptions`**
- Subskrypcje należące do użytkownika
- Foreign key: `user_id` → `profiles(id)` ON DELETE CASCADE
- Wszystkie operacje CRUD chronione przez RLS

**Schemat relacji:**
```
auth.users (id)
    ↓ (1:1, ON DELETE CASCADE)
public.profiles (id)
    ↓ (1:N, ON DELETE CASCADE)
public.subscriptions (user_id)
```

#### 4.3.2. Trigger Automatycznego Tworzenia Profilu

**Definicja funkcji trigger:**
```sql
create or replace function handle_new_user()
returns trigger
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, created_at, updated_at)
    values (new.id, now(), now());
    return new;
end;
$$ language plpgsql;
```

**Definicja triggera:**
```sql
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function handle_new_user();
```

**Kluczowe elementy:**
- ✅ `SECURITY DEFINER` — trigger wykonywany z uprawnieniami właściciela funkcji (omija RLS)
- ✅ `AFTER INSERT` — wykonywany po wstawieniu użytkownika do `auth.users`
- ✅ `new.id` — ID nowo utworzonego użytkownika
- ✅ Automatyczne tworzenie rekordu w `profiles` z tym samym `id`

**Wymagania zgodnie z US-003:**
- ✅ Rekord w `profiles` tworzony automatycznie przy rejestracji
- ✅ `profiles.id` równe `auth.users.id`
- ✅ Foreign key z `ON DELETE CASCADE` (usunięcie użytkownika → usunięcie profilu)

#### 4.3.3. Polityki Row-Level Security (RLS)

**RLS włączone na tabelach:**
```sql
alter table profiles enable row level security;
alter table subscriptions enable row level security;
```

**Polityki dla tabeli `profiles`:**

**SELECT (odczyt):**
```sql
create policy profiles_select_own on profiles
    for select
    to authenticated
    using (auth.uid() = id);
```
- ✅ Użytkownik może odczytać **tylko swój profil**
- ✅ Weryfikacja: `auth.uid()` (ID zalogowanego użytkownika) = `id` (ID profilu)

**Brak polityk INSERT/UPDATE/DELETE:**
- ✅ Użytkownik **nie może** samodzielnie modyfikować lub usuwać profilu
- ✅ Tworzenie profilu: trigger `handle_new_user()` z `SECURITY DEFINER` (omija RLS)
- ✅ Aktualizacja/usuwanie: zarządzane przez Supabase Admin lub funkcje `SECURITY DEFINER`

**Polityki dla tabeli `subscriptions`:**

**SELECT (odczyt):**
```sql
create policy subscriptions_select_own on subscriptions
    for select
    to authenticated
    using (auth.uid() = user_id);
```
- ✅ Użytkownik może odczytać **tylko swoje subskrypcje**

**INSERT (tworzenie):**
```sql
create policy subscriptions_insert_own on subscriptions
    for insert
    to authenticated
    with check (auth.uid() = user_id);
```
- ✅ Użytkownik może tworzyć subskrypcje **tylko dla siebie**
- ✅ `WITH CHECK` weryfikuje `user_id` przed wstawieniem

**UPDATE (aktualizacja):**
```sql
create policy subscriptions_update_own on subscriptions
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
```
- ✅ Użytkownik może aktualizować **tylko swoje subskrypcje**
- ✅ `USING` weryfikuje właściciela przed aktualizacją
- ✅ `WITH CHECK` zapewnia, że `user_id` nie zostanie zmieniony

**DELETE (usuwanie):**
```sql
create policy subscriptions_delete_own on subscriptions
    for delete
    to authenticated
    using (auth.uid() = user_id);
```
- ✅ Użytkownik może usuwać **tylko swoje subskrypcje**

#### 4.3.4. Enforcing User ID Server-Side

**Zgodnie z US-003:** Pole `user_id` w subskrypcji jest **zawsze** ustawiane po stronie serwera, nigdy z danych klienta.

**Implementacja w endpoincie `POST /api/subscriptions`:**
```typescript
export async function POST({ request, locals }: APIContext) {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const body = await request.json();

  // Ignoruj user_id z ciała requestu
  const { user_id: _, ...subscriptionData } = body;

  // Ustaw user_id server-side
  const insertData = {
    ...subscriptionData,
    user_id: user.id,  // ZAWSZE z locals.user
  };

  const { data, error } = await locals.supabase
    .from("subscriptions")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  return new Response(JSON.stringify(data), { status: 201 });
}
```

**Kluczowe elementy:**
- ✅ `user_id` jest **zawsze** ustawiane z `locals.user.id`
- ✅ Wartość `user_id` z body requestu jest **ignorowana** (destructuring z `_`)
- ✅ Polityka RLS `WITH CHECK` zapewnia dodatkową weryfikację

#### 4.3.5. Obsługa Błędów 404 vs 403

**Zgodnie z US-003:** Próba dostępu do cudzej subskrypcji zwraca **404 Not Found**, nie 403 Forbidden (zapobiega wyciekowi informacji o istnieniu zasobów).

**Implementacja w endpoincie `GET /api/subscriptions/:id`:**
```typescript
export async function GET({ params, locals }: APIContext) {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const { id } = params;

  const { data, error } = await locals.supabase
    .from("subscriptions")
    .select("*")
    .eq("id", id)
    .single();

  // Polityka RLS zapewnia, że zwrócona zostanie tylko własna subskrypcja
  // Jeśli nie ma dostępu → Supabase zwraca error (nie znaleziono)

  if (error || !data) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,  // Zawsze 404, nigdy 403
    });
  }

  return new Response(JSON.stringify(data), { status: 200 });
}
```

**Mechanizm:**
- ✅ Polityka RLS automatycznie filtruje wyniki zapytania
- ✅ Jeśli użytkownik nie ma dostępu, Supabase zwraca pusty wynik
- ✅ Endpoint zwraca 404 (nie ujawnia, czy zasób istnieje)

#### 4.3.6. Kaskadowe Usuwanie Danych

**Zgodnie z US-003:** Usunięcie użytkownika z `auth.users` powoduje automatyczne usunięcie profilu i wszystkich subskrypcji.

**Definicja kluczy obcych:**
```sql
-- profiles
id uuid primary key references auth.users(id) on delete cascade

-- subscriptions
user_id uuid not null references profiles(id) on delete cascade
```

**Łańcuch kaskadowy:**
```
DELETE FROM auth.users WHERE id = '<user-id>'
    ↓ (CASCADE)
DELETE FROM profiles WHERE id = '<user-id>'
    ↓ (CASCADE)
DELETE FROM subscriptions WHERE user_id = '<user-id>'
```

**Kluczowe elementy:**
- ✅ `ON DELETE CASCADE` na obu foreign keys
- ✅ Automatyczne czyszczenie wszystkich danych użytkownika
- ✅ Zachowanie spójności bazy danych

### 4.4. Odzyskiwanie Hasła (Password Reset) — POZA ZAKRESEM MVP

**Status:** Funkcjonalność **POZA ZAKRESEM MVP** zgodnie z PRD.

> ⚠️ **UWAGA:** Poniższa sekcja dokumentuje przyszłe rozszerzenie systemu autentykacji.  
> Funkcjonalność nie jest wymagana przez żadne User Story w PRD i nie będzie implementowana w MVP.  
> Sekcja pozostawiona w dokumentacji jako roadmap dla przyszłych rozszerzeń.

---

**Wymagania funkcjonalne (przyszła implementacja - standardowe praktyki):**

#### 4.4.1. Formularz "Zapomniałeś hasła?" (Future Enhancement)

**Lokalizacja:** Link na stronie `/login` pod formularzem logowania

**Komponent:** `PasswordResetRequestForm.tsx` (do stworzenia)

**Pola formularza:**
- Email — adres email zarejestrowanego użytkownika

**Proces:**
1. Użytkownik wprowadza email
2. Wywołanie `supabase.auth.resetPasswordForEmail(email)`
3. Supabase wysyła email z linkiem do resetu hasła
4. Wyświetlenie komunikatu: "Jeśli konto istnieje, link został wysłany na email"

**Implementacja Supabase:**
```typescript
const supabase = createSupabaseBrowserClient();

const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
});

if (error) {
  // Obsługa błędu
}
```

**Komunikat użytkownikowi:**
- ✅ Generyczny komunikat (nie ujawnia, czy email istnieje)
- ✅ "Jeśli konto istnieje, link został wysłany na email"

#### 4.4.2. Strona Resetu Hasła — `/reset-password`

**Komponent:** `src/pages/reset-password.astro` (do stworzenia)

**Proces:**
1. Użytkownik klika link z emaila (zawiera token reset)
2. Supabase automatycznie weryfikuje token i loguje użytkownika
3. Strona `/reset-password` renderuje formularz zmiany hasła

**Formularz:** `PasswordResetForm.tsx` (do stworzenia)

**Pola formularza:**
- Nowe hasło — min 6 znaków
- Potwierdzenie nowego hasła — musi być identyczne

**Proces:**
```typescript
const supabase = createSupabaseBrowserClient();

const { error } = await supabase.auth.updateUser({
  password: newPassword,
});

if (error) {
  // Obsługa błędu
} else {
  // Przekierowanie na dashboard
  window.location.href = "/";
}
```

#### 4.4.3. Konfiguracja Email Templates w Supabase

**Dashboard Supabase → Authentication → Email Templates:**
- Template: "Reset Password"
- Ustaw `{{ .ConfirmationURL }}` wskazujący na `https://<domain>/reset-password`

**Przykład treści email:**
```
Witaj,

Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w Subbase.

Kliknij poniższy link, aby ustawić nowe hasło:

{{ .ConfirmationURL }}

Link wygasa po 1 godzinie.

Jeśli nie prosiłeś o reset hasła, zignoruj tego emaila.
```

#### 4.4.4. Wymagania bezpieczeństwa

- ✅ Token reset hasła jest jednorazowy (single-use)
- ✅ Token wygasa po 1 godzinie (domyślnie w Supabase)
- ✅ Komunikaty nie ujawniają, czy email istnieje w systemie
- ✅ Po zmianie hasła wszystkie aktywne sesje są unieważniane

---

## 5. Scenariusze Użytkowania

### 5.1. Scenariusz: Rejestracja Nowego Użytkownika

**Aktorzy:** Niezalogowany użytkownik

**Warunki początkowe:** Użytkownik znajduje się na stronie `/login`

**Przepływ:**
1. Użytkownik klika zakładkę "Rejestracja"
2. Wprowadza adres email (np. `jan@example.com`)
3. Wprowadza hasło (min 6 znaków, np. `SecurePass123`)
4. Wprowadza potwierdzenie hasła (identyczne: `SecurePass123`)
5. Klika przycisk "Zarejestruj się"
6. **Frontend:** Formularz wywołuje walidację Zod
   - Jeśli błędy → wyświetlenie komunikatów inline pod polami
7. **Frontend:** Wywołanie `supabase.auth.signUp({ email, password })`
8. **Supabase Auth:**
   - Utworzenie użytkownika w `auth.users`
   - Trigger `on_auth_user_created` → utworzenie rekordu w `public.profiles`
   - Zwrócenie sesji (access token + refresh token)
9. **Frontend:** Supabase ustawia cookies sesji automatycznie
10. **Frontend:** Wywołanie `onSuccess()` → `window.location.href = "/"`
11. **Server:** Middleware weryfikuje sesję → `locals.user` = obiekt użytkownika
12. **Server:** Strona `/` renderuje dashboard
13. Użytkownik widzi pustą listę subskrypcji i powitanie

**Warunki końcowe:**
- ✅ Użytkownik jest zalogowany
- ✅ Rekord w `auth.users` i `public.profiles` został utworzony
- ✅ Cookies sesji są ustawione
- ✅ Dashboard jest wyświetlony

**Obsługa błędów:**
- Email już istnieje → komunikat: "Konto z tym adresem email już istnieje"
- Hasło za krótkie → komunikat: "Hasło musi mieć minimum 6 znaków"
- Błąd sieci → komunikat: "Nie można połączyć z serwerem. Sprawdź połączenie internetowe."

### 5.2. Scenariusz: Logowanie Użytkownika

**Aktorzy:** Niezalogowany użytkownik z istniejącym kontem

**Warunki początkowe:** Użytkownik znajduje się na stronie `/login`, zakładka "Logowanie"

**Przepływ:**
1. Użytkownik wprowadza adres email (np. `jan@example.com`)
2. Wprowadza hasło (np. `SecurePass123`)
3. Klika przycisk "Zaloguj się"
4. **Frontend:** Formularz wywołuje walidację Zod
5. **Frontend:** Wywołanie `supabase.auth.signInWithPassword({ email, password })`
6. **Supabase Auth:**
   - Weryfikacja credentials w `auth.users`
   - Utworzenie sesji (access token + refresh token)
   - Zwrócenie obiektu `user` i `session`
7. **Frontend:** Supabase ustawia cookies sesji automatycznie
8. **Frontend:** Wywołanie `onSuccess()` → `window.location.href = "/"`
9. **Server:** Middleware weryfikuje sesję → `locals.user` = obiekt użytkownika
10. **Server:** Strona `/` renderuje dashboard
11. Użytkownik widzi swoje subskrypcje i podsumowanie kosztów

**Warunki końcowe:**
- ✅ Użytkownik jest zalogowany
- ✅ Cookies sesji są ustawione
- ✅ Dashboard jest wyświetlony

**Obsługa błędów:**
- Nieprawidłowe credentials → komunikat: "Nieprawidłowy email lub hasło"
- Email niepotwierdzony → komunikat: "Potwierdź swój adres email"
- Błąd sieci → komunikat: "Nie można połączyć z serwerem. Sprawdź połączenie internetowe."

### 5.3. Scenariusz: Automatyczne Przekierowanie Zalogowanego Użytkownika

**Aktorzy:** Zalogowany użytkownik

**Warunki początkowe:** Użytkownik jest zalogowany, przegląda dashboard

**Przepływ:**
1. Użytkownik wpisuje w pasku adresu `/login` lub klika link do strony logowania
2. **Server:** Request → Middleware weryfikuje sesję (cookies) → `locals.user` = obiekt użytkownika
3. **Server:** Strona `/login` sprawdza `if (user) return Astro.redirect("/")`
4. **Server:** Zwrócenie przekierowania 302 na `/`
5. Przeglądarka automatycznie przekierowuje na dashboard
6. Użytkownik widzi dashboard (brak migotania strony logowania)

**Warunki końcowe:**
- ✅ Użytkownik znajduje się na dashboardzie
- ✅ Nie widział formularza logowania

### 5.4. Scenariusz: Automatyczne Przekierowanie Niezalogowanego Użytkownika

**Aktorzy:** Niezalogowany użytkownik

**Warunki początkowe:** Użytkownik nie jest zalogowany, próbuje uzyskać dostęp do dashboardu

**Przepływ:**
1. Użytkownik wpisuje w pasku adresu `/` lub klika link do dashboardu
2. **Server:** Request → Middleware weryfikuje sesję (brak cookies lub wygasły) → `locals.user` = `null`
3. **Server:** Strona `/` sprawdza `if (!user) return Astro.redirect("/login")`
4. **Server:** Zwrócenie przekierowania 302 na `/login`
5. Przeglądarka automatycznie przekierowuje na stronę logowania
6. Użytkownik widzi formularz logowania

**Warunki końcowe:**
- ✅ Użytkownik znajduje się na stronie `/login`
- ✅ Nie widział dashboardu

### 5.5. Scenariusz: Wylogowanie Użytkownika

**Aktorzy:** Zalogowany użytkownik przeglądający dashboard

**Warunki początkowe:** Użytkownik jest zalogowany i widzi dashboard

**Przepływ:**
1. Użytkownik klika przycisk "Wyloguj" w TopBar
2. **Frontend:** Wywołanie `handleLogout()` → `setIsLoggingOut(true)`
3. **Frontend:** Wywołanie `supabase.auth.signOut()`
4. **Supabase Auth:**
   - Unieważnienie sesji po stronie serwera
   - Usunięcie cookies sesji z przeglądarki
5. **Frontend:** Wywołanie `window.location.href = "/login"`
6. **Browser:** Full page reload → request do `/login`
7. **Server:** Middleware weryfikuje sesję (brak cookies) → `locals.user` = `null`
8. **Server:** Strona `/login` renderuje formularz logowania
9. Użytkownik widzi formularz logowania

**Warunki końcowe:**
- ✅ Użytkownik jest wylogowany
- ✅ Cookies sesji zostały usunięte
- ✅ Strona logowania jest wyświetlona

### 5.6. Scenariusz: Próba Dostępu do Cudzej Subskrypcji (Izolacja Danych)

**Aktorzy:** Zalogowany użytkownik (User A) próbujący uzyskać dostęp do subskrypcji User B

**Warunki początkowe:**
- User A jest zalogowany
- User A zna ID subskrypcji należącej do User B (np. `abc123`)

**Przepływ:**
1. User A wywołuje request: `GET /api/subscriptions/abc123`
2. **Middleware:** Weryfikuje sesję User A → `locals.user` = User A
3. **Endpoint:** Sprawdza `if (!locals.user)` → OK (User A jest zalogowany)
4. **Endpoint:** Wywołanie `supabase.from("subscriptions").select("*").eq("id", "abc123").single()`
5. **Supabase RLS:** Polityka `subscriptions_select_own` filtruje wyniki → `auth.uid() = user_id`
6. **Supabase:** Zwraca pusty wynik (User A nie ma dostępu do subskrypcji User B)
7. **Endpoint:** Sprawdza `if (error || !data)` → TRUE
8. **Endpoint:** Zwraca `404 Not Found` (nie ujawnia, że subskrypcja istnieje)
9. User A otrzymuje komunikat: "Not found"

**Warunki końcowe:**
- ✅ User A nie uzyskał dostępu do danych User B
- ✅ Aplikacja nie ujawniła, czy subskrypcja istnieje (404, nie 403)

### 5.7. Scenariusz: Próba Utworzenia Subskrypcji dla Innego Użytkownika

**Aktorzy:** Zalogowany użytkownik (User A) próbujący utworzyć subskrypcję dla User B

**Warunki początkowe:**
- User A jest zalogowany
- User A zna ID User B (np. `user-b-id`)

**Przepływ:**
1. User A wywołuje request: `POST /api/subscriptions` z body:
   ```json
   {
     "name": "Netflix",
     "cost": 49.99,
     "billing_cycle": "monthly",
     "start_date": "2026-01-01",
     "user_id": "user-b-id"  // Próba podstawienia innego user_id
   }
   ```
2. **Middleware:** Weryfikuje sesję User A → `locals.user` = User A
3. **Endpoint:** Sprawdza `if (!locals.user)` → OK
4. **Endpoint:** Ignoruje `user_id` z body (`const { user_id: _, ...data } = body`)
5. **Endpoint:** Ustawia `user_id` server-side: `insertData.user_id = locals.user.id` (User A)
6. **Endpoint:** Wywołanie `supabase.from("subscriptions").insert(insertData)`
7. **Supabase RLS:** Polityka `subscriptions_insert_own` weryfikuje `WITH CHECK (auth.uid() = user_id)`
8. **Supabase:** Wstawienie rekordu z `user_id = User A` (nie User B)
9. User A otrzymuje odpowiedź 201 Created ze stworzoną subskrypcją (należącą do User A)

**Warunki końcowe:**
- ✅ Subskrypcja została utworzona dla User A (nie User B)
- ✅ Wartość `user_id` z body requestu została zignorowana
- ✅ RLS zapewniła dodatkową weryfikację

### 5.8. Scenariusz: Zachowanie Wartości Formularza Przy Przełączaniu Zakładek

**Aktorzy:** Niezalogowany użytkownik wypełniający formularz rejestracji

**Warunki początkowe:** Użytkownik znajduje się na stronie `/login`, zakładka "Rejestracja"

**Przepływ:**
1. Użytkownik wprowadza email: `jan@example.com`
2. Wprowadza hasło: `SecurePass123`
3. Wprowadza potwierdzenie hasła: `SecurePass123`
4. **Użytkownik przypadkowo klika zakładkę "Logowanie"**
5. **Frontend:** `handleTabChange("login")` → zmiana `activeTab`
6. **Frontend:** Wywołanie `onValuesChange` → zapisanie wartości formularza rejestracji w `registerFormValues`
7. Formularz logowania jest wyświetlony (puste pola)
8. **Użytkownik klika z powrotem zakładkę "Rejestracja"**
9. **Frontend:** `handleTabChange("register")` → zmiana `activeTab`
10. **Frontend:** `<RegisterForm initialValues={registerFormValues} />` → przywrócenie wartości
11. Formularz rejestracji wyświetla wcześniej wprowadzone dane:
    - Email: `jan@example.com`
    - Hasło: `SecurePass123`
    - Potwierdzenie: `SecurePass123`
12. Użytkownik może dokończyć rejestrację

**Warunki końcowe:**
- ✅ Wartości formularza rejestracji zostały zachowane
- ✅ Użytkownik nie musi ponownie wprowadzać danych

---

## 6. Obsługa Błędów i Edge Cases

### 6.1. Walidacja Klient-Side (Formularze)

**Mechanizm:** Zod schema + hook `useAuthForm`

**Typy walidacji:**
1. **Inline (onBlur)** — walidacja pojedynczego pola po opuszczeniu
2. **Submit** — walidacja wszystkich pól przed wysłaniem

**Przykładowe błędy walidacji:**
| Pole | Warunek | Komunikat |
|------|---------|-----------|
| Email | Puste | "Email jest wymagany" |
| Email | Niepoprawny format | "Podaj poprawny adres email" |
| Hasło | Puste | "Hasło jest wymagane" |
| Hasło | < 6 znaków | "Hasło musi mieć minimum 6 znaków" |
| Potwierdzenie hasła | Puste | "Potwierdzenie hasła jest wymagane" |
| Potwierdzenie hasła | Nie pasuje do hasła | "Hasła muszą być identyczne" |

**Wyświetlanie błędów:**
- ✅ Inline pod polem (czerwony tekst)
- ✅ Czerwone obramowanie pola (Shadcn/ui variant)
- ✅ Atrybuty ARIA dla screen readerów

### 6.2. Błędy Autentykacji (Supabase Auth)

**Źródło:** Odpowiedzi z Supabase Auth API

**Mapowanie na komunikaty polskie:**
| Błąd Supabase (Login) | Komunikat PL |
|-----------------------|--------------|
| `invalid login credentials` | "Nieprawidłowy email lub hasło" |
| `email not confirmed` | "Potwierdź swój adres email" |
| `network` / `fetch` | "Nie można połączyć z serwerem. Sprawdź połączenie internetowe." |

| Błąd Supabase (Rejestracja) | Komunikat PL |
|------------------------------|--------------|
| `user already registered` | "Konto z tym adresem email już istnieje" |
| `password should be at least` | "Hasło musi mieć minimum 6 znaków" |
| `invalid email` | "Podaj poprawny adres email" |

**Wyświetlanie błędów:**
- ✅ Komponent `<FormError>` powyżej przycisku submit
- ✅ Ikona `AlertCircle` + czerwone tło
- ✅ Atrybuty ARIA dla screen readerów

### 6.3. Błędy Sieciowe

**Scenariusze:**
- Brak połączenia internetowego
- Timeout requestu
- Błąd serwera Supabase (5xx)

**Obsługa:**
```typescript
try {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) setSubmitError(mapAuthError(error));
} catch (error) {
  setSubmitError("Nie można połączyć z serwerem. Sprawdź połączenie internetowe.");
}
```

**Komunikat:**
- "Nie można połączyć z serwerem. Sprawdź połączenie internetowe."

### 6.4. Wygasła Sesja (Expired Token)

**Scenariusz:** Użytkownik zalogowany, ale access token wygasł (>1h od ostatniego refresh)

**Obsługa dla stron Astro (cookies):**
- ✅ Supabase automatycznie używa refresh token do odnowienia sesji
- ✅ Middleware wywołuje `getUser()` → Supabase odświeża tokeny
- ✅ Callback `setAll()` ustawia nowe cookies
- ✅ Użytkownik nie zauważa przerwy w sesji

**Obsługa dla API routes (JWT):**
- ❌ Brak automatycznego refresh (stateless)
- ✅ Middleware zwraca `locals.user = null` jeśli token wygasł
- ✅ Endpoint zwraca `401 Unauthorized`
- ✅ **MVP Behavior:** Frontend obecnie nie implementuje automatycznego refresh (użytkownik wylogowywany przy 401)
- ⚠️ Przyszłe rozszerzenie: interceptor HTTP dla automatycznego refresh (poza zakresem MVP)

### 6.5. Próba Dostępu do Nieistniejącego Zasobu

**Scenariusz:** Request do `GET /api/subscriptions/nonexistent-id`

**Obsługa:**
```typescript
const { data, error } = await locals.supabase
  .from("subscriptions")
  .select("*")
  .eq("id", id)
  .single();

if (error || !data) {
  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
  });
}
```

**Kluczowe elementy:**
- ✅ Zwraca 404 (nie 403) — nie ujawnia, czy zasób istnieje
- ✅ Jednolita obsługa dla: brak dostępu + zasób nie istnieje

### 6.6. Fail Gracefully (AI Insights) — NOTA O ZAKRESIE

> ⚠️ **UWAGA:** Ta sekcja dokumentuje obsługę błędów AI insights, która jest częścią US-005 (nie modułu autentykacji).  
> Przenoszona tutaj TYLKO w kontekście wpływu na sesję użytkownika (błąd AI nie powinien wylogowywać użytkownika).

**Zgodnie z PRD (US-005):** AI insights muszą fail gracefully — błąd AI nie blokuje funkcjonalności aplikacji ani nie wpływa na sesję użytkownika.

**Kluczowe wymaganie dla modułu autentykacji:**
- ✅ Błąd 503 z `/api/ai/insights` **NIE POWODUJE** wylogowania użytkownika
- ✅ Sesja pozostaje aktywna niezależnie od stanu AI service
- ✅ Dashboard pozostaje dostępny

**Szczegółowa implementacja obsługi błędów AI:** Zobacz `dashboard-view-implementation-plan.md` (poza zakresem tej specyfikacji autentykacji)

---

## 7. Wymagania Niefunkcjonalne

### 7.1. Bezpieczeństwo

#### 7.1.1. Autentykacja i Autoryzacja

- ✅ **Supabase Auth** — gotowe rozwiązanie z weryfikacją JWT, refresh tokenami, hash bcrypt
- ✅ **Row-Level Security (RLS)** — izolacja danych na poziomie bazy danych
- ✅ **Server-side enforcement** — `user_id` zawsze ustawiane po stronie serwera
- ✅ **Brak ujawniania informacji** — komunikaty błędów nie ujawniają, czy email istnieje (zapobiega enumeracji kont)

#### 7.1.2. Ochrona Przed Atakami

- ✅ **SQL Injection** — Supabase Query Builder (automatyczne escapowanie)
- ✅ **XSS (Cross-Site Scripting)** — React automatycznie escapuje output (JSX)
- ✅ **CSRF (Cross-Site Request Forgery)** — tokeny JWT w Authorization header (nie cookies dla API)
- ✅ **Brute Force** — Supabase Rate Limiting (domyślnie włączone)

#### 7.1.3. Przechowywanie Haseł

- ✅ Supabase używa **bcrypt** z solą do hashowania haseł
- ✅ Hasła **nigdy** nie są przechowywane w plaintext
- ✅ Hasła **nigdy** nie są przesyłane w response API

#### 7.1.4. HTTPS

- ✅ Wszystkie połączenia z Supabase przez HTTPS (wymuszane przez Supabase)
- ✅ Produkcja: aplikacja hostowana z certyfikatem SSL (Digital Ocean)

### 7.2. Performance

#### 7.2.1. Renderowanie SSR

- ✅ Strony Astro renderowane po stronie serwera (SSR) — szybkie First Contentful Paint
- ✅ Komponenty React hydratowane `client:load` — interaktywność po załadowaniu JS
- ✅ Brak migotania przy przekierowaniach (SSR guard clauses)

#### 7.2.2. Optymalizacje Zapytań

- ✅ Indeks `subscriptions_user_id_idx` na `subscriptions(user_id)` — szybkie filtrowanie RLS
- ✅ Paginacja dla list subskrypcji (limit 10-100 na stronę)
- ✅ Selekcja tylko potrzebnych kolumn (`select("*")` można zoptymalizować)

#### 7.2.3. Caching

- ✅ Supabase automatycznie cache'uje session data (cookies)
- ❌ Brak cache'owania odpowiedzi API (stateless) — można dodać Redis w przyszłości

### 7.3. Accessibility (A11y)

#### 7.3.1. Atrybuty ARIA

- ✅ `aria-invalid` — pola z błędami walidacji
- ✅ `aria-describedby` — połączenie pola z komunikatem błędu
- ✅ `role="alert"` + `aria-live="polite"` — ogłaszanie błędów screen readerom
- ✅ `aria-label` — przyciski z ikonami (np. "Wyloguj się")

#### 7.3.2. Nawigacja Klawiaturowa

- ✅ Tab key navigation — kolejność focusu zgodna z wizualnym układem
- ✅ Enter key submission — formularze submitowane przez Enter
- ✅ Escape key closing — modale zamykane przez Escape (Shadcn/ui Dialog)

#### 7.3.3. Kontrast i Czytelność

- ✅ Shadcn/ui themes — kolory dostosowane do WCAG AA (minimum 4.5:1 kontrast)
- ✅ Tryb jasny/ciemny — użytkownik może wybrać preferowany motyw

### 7.4. Responsywność

#### 7.4.1. Breakpointy Tailwind

- Mobile: `< 640px` (sm)
- Tablet: `640px - 1024px` (sm-lg)
- Desktop: `>= 1024px` (lg+)

#### 7.4.2. Optymalizacje Mobile

- ✅ `px-4 sm:px-6 lg:px-8` — responsywne paddingi
- ✅ `hidden sm:inline` — ukrywanie tekstów na małych ekranach (np. "Wyloguj")
- ✅ Formularze: `max-w-md` (max 448px szerokości) — czytelność na mobile

### 7.5. Obsługa Języka

#### 7.5.1. Język Aplikacji

- ✅ Polski — wszystkie komunikaty, labele, przyciski w języku polskim
- ❌ Brak i18n (internationalization) — poza zakresem MVP

#### 7.5.2. Komunikaty Użytkownika

- ✅ Przyjazne komunikaty błędów (nie techniczne error codes)
- ✅ Spójne nazewnictwo w całej aplikacji
- ✅ Ton komunikacji: informacyjny, pomocny, bez żargonu

---

## 8. Zależności i Wymagania Środowiskowe

### 8.1. Zmienne Środowiskowe

**Plik `.env` (niecommitowany do repo):**

```bash
# Server-side (Astro middleware, API routes)
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<anon-key>

# Client-side (React components)
PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
PUBLIC_SUPABASE_KEY=<anon-key>

# AI (OpenRouter)
OPENROUTER_API_KEY=<api-key>
OPENROUTER_MODEL=openai/gpt-4o-mini
```

**Plik `.env.example` (commitowany):**
```bash
SUPABASE_URL=###
SUPABASE_KEY=###
PUBLIC_SUPABASE_URL=###
PUBLIC_SUPABASE_KEY=###
OPENROUTER_API_KEY=###
OPENROUTER_MODEL=openai/gpt-4o-mini
```

### 8.2. Zależności NPM

**Kluczowe paczki (autentykacja):**

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "@supabase/ssr": "^0.x",
    "zod": "^3.x",
    "react": "^19.x",
    "react-dom": "^19.x"
  }
}
```

**Pełna lista w `package.json`**

### 8.3. Konfiguracja Supabase

#### 8.3.1. Migracje Bazy Danych

**Lokalizacja:** `supabase/migrations/`

**Migracje do uruchomienia:**
1. `20260116120000_create_initial_schema.sql` — tworzenie tabel, RLS, triggerów
2. `20260116130000_disable_rls_policies.sql` — (opcjonalnie) wyłączenie RLS dla developmentu

**Uruchomienie migracji:**
```bash
supabase db push
```

#### 8.3.2. Konfiguracja Email Confirmation (MVP - WYŁĄCZONA)

**Dashboard Supabase → Authentication → Settings:**
```
Enable email confirmations: OFF
```

**Uzasadnienie:**
- US-001 wymaga automatycznego logowania po rejestracji
- Email confirmation blokowałaby automatyczne logowanie
- MVP nie wymaga weryfikacji emaili

#### 8.3.3. Konfiguracja Email Templates (Password Reset) — POZA ZAKRESEM MVP

> ⚠️ **UWAGA:** Konfiguracja poniżej POZA ZAKRESEM MVP (password reset nie jest implementowany).

**Dashboard Supabase → Authentication → Email Templates:**
- "Reset Password" → ustaw `{{ .ConfirmationURL }}` na `https://<domain>/reset-password`
- **Status:** Niewymagane dla MVP

#### 8.3.4. Konfiguracja URL Callbacks

**Dashboard Supabase → Authentication → URL Configuration:**
- Site URL: `https://<domain>`
- Redirect URLs: 
  - `https://<domain>/`
  - `https://<domain>/reset-password`

### 8.4. Konfiguracja Astro

**Plik `astro.config.mjs`:**
```javascript
export default defineConfig({
  output: "server",           // SSR mode
  integrations: [react()],    // React integration
  adapter: node({             // Node.js adapter
    mode: "standalone",
  }),
});
```

---

## 9. Podsumowanie i Wnioski

### 9.1. Co Jest Zaimplementowane

✅ **Kompletny moduł autentykacji:**
- Rejestracja użytkowników (`signUp`)
- Logowanie (`signInWithPassword`)
- Wylogowanie (`signOut`)
- Zarządzanie sesją (cookies + JWT)
- Automatyczne przekierowania (SSR guards)

✅ **Izolacja danych użytkowników:**
- Row-Level Security (RLS) na wszystkich tabelach
- Automatyczne tworzenie profili (trigger `handle_new_user`)
- Server-side enforcement `user_id`
- Kaskadowe usuwanie danych

✅ **Interfejs użytkownika:**
- Strona logowania z zakładkami (Login/Register)
- Responsywne formularze z walidacją
- Obsługa błędów z polskimi komunikatami
- Top bar z przyciskiem wylogowania

✅ **Middleware autentykacji:**
- Cookie-based session dla stron Astro
- Token-based auth dla API routes
- Automatyczna weryfikacja sesji

### 9.2. Co Wymaga Rozszerzenia/Implementacji

❌ **Odzyskiwanie hasła (Password Reset):**
- Formularz "Zapomniałeś hasła?"
- Strona `/reset-password`
- Email templates w Supabase

✅ **Potwierdzanie emaila:**
- **MVP Decision:** Email confirmation **WYŁĄCZONA** w konfiguracji Supabase
- **Uzasadnienie:** US-001 wymaga automatycznego logowania po rejestracji
- **Przyszłość:** Można włączyć po dodaniu osobnego User Story

❌ **Interceptor HTTP dla refresh tokenów (POZA ZAKRESEM MVP):**
- **MVP Behavior:** Użytkownik wylogowywany przy wygasłym tokenie (acceptable dla MVP)
- **Przyszłość:** Automatyczne odświeżanie tokenów przy wywołaniach API
- **Status:** POZA ZAKRESEM MVP zgodnie z PRD (brak wymagań w User Stories)

✅ **Rate limiting:**
- **MVP:** Supabase ma wbudowane rate limiting (wystarczające dla MVP)
- **Przyszłość:** Dodatkowe limity na poziomie API routes (np. IP-based)

### 9.3. Kluczowe Zalety Architektury

✅ **Bezpieczeństwo:**
- Supabase Auth — gotowe rozwiązanie z najlepszymi praktykami
- RLS — izolacja danych na poziomie bazy danych
- Server-side enforcement — brak możliwości manipulacji `user_id` z klienta

✅ **Developer Experience:**
- TypeScript — pełne typowanie bazy danych
- Zod — deklaratywna walidacja schematów
- Shadcn/ui — gotowe komponenty UI z accessibility

✅ **User Experience:**
- SSR guards — brak migotania przy przekierowaniach
- Zachowanie wartości formularzy przy przełączaniu zakładek
- Przyjazne komunikaty błędów w języku polskim

✅ **Skalowalność:**
- Supabase — zarządzana infrastruktura (PostgreSQL + Auth)
- Row-Level Security — wydajne filtrowanie na poziomie bazy
- Stateless API — łatwe skalowanie horyzontalne

### 9.4. Rekomendacje na Przyszłość (POZA ZAKRESEM MVP)

> ⚠️ **UWAGA:** Poniższe funkcjonalności NIE SĄ CZĘŚCIĄ MVP zgodnie z PRD.  
> Lista roadmap dla przyszłych rozszerzeń po ukończeniu MVP.

**Funkcjonalności:**
- Implementacja password reset (User Story do dodania)
- Implementacja 2FA (Two-Factor Authentication)
- Social login (Google, GitHub)
- Email notifications (welcome email, password changed)
- Email confirmation flow

**Optymalizacje:**
- Redis cache dla podsumowań kosztów
- Background jobs dla email notifications
- Monitoring i logging (Sentry, LogRocket)

**UX Improvements:**
- Onboarding flow dla nowych użytkowników
- Potwierdzenie email reminder
- Progress indicators dla długich operacji
- Toast notifications zamiast inline errors

---

## 10. Compliance z Wymaganiami PRD

### 10.1. US-001: User Registration and Login

| Wymaganie | Status | Implementacja |
|-----------|--------|---------------|
| Dedykowana strona `/login` | ✅ | `src/pages/login.astro` |
| Dwie zakładki: Login/Register | ✅ | `<AuthTabs>` |
| Walidacja email (regex) | ✅ | Zod schema: `.email()` |
| Walidacja hasła (min 6 znaków) | ✅ | Zod schema: `.min(6)` |
| Walidacja potwierdzenia hasła | ✅ | Zod schema: `.refine()` |
| Błędy inline w PL | ✅ | `<FormField>` + komunikaty PL |
| Przekierowanie po login → `/` | ✅ | `onSuccess()` → `window.location.href = "/"` |
| Automatyczne logowanie po rejestracji | ✅ | Supabase `signUp()` zwraca sesję |
| Mapowanie błędów API na PL | ✅ | Funkcja `mapAuthError()` |
| Brak rozróżnienia email/password w błędzie | ✅ | "Nieprawidłowy email lub hasło" |
| Supabase Auth z `signInWithPassword` | ✅ | `LoginForm.tsx` |
| Supabase Auth z `signUp` | ✅ | `RegisterForm.tsx` |
| Cookies dla stron, JWT dla API | ✅ | Middleware: cookie-based + token-based |
| `@supabase/ssr` dla browser client | ✅ | `createSupabaseBrowserClient()` |
| Zachowanie danych przy przełączaniu zakładek | ✅ | `AuthCard` state preservation |
| Nawigacja Tab key | ✅ | Shadcn/ui komponenty + HTML semantics |
| Submit na Enter | ✅ | `<form onSubmit={handleSubmit}>` |

**Compliance:** ✅ **100%**

### 10.2. US-002: Automatic Redirects and Logout

| Wymaganie | Status | Implementacja |
|-----------|--------|---------------|
| Zalogowani przekierowani z `/login` → `/` | ✅ | `login.astro`: `if (user) return Astro.redirect("/")` |
| Niezalogowani przekierowani z `/` → `/login` | ✅ | `index.astro`: `if (!user) return Astro.redirect("/login")` |
| Middleware weryfikuje sesję | ✅ | `src/middleware/index.ts` |
| Middleware ustawia `locals.user` | ✅ | `context.locals.user = user` |
| Middleware ustawia `locals.supabase` | ✅ | `context.locals.supabase = supabase` |
| Strony: cookie-based | ✅ | `createServerClient` z cookies callbacks |
| API: Bearer token | ✅ | Odczyt `Authorization` header |
| Przycisk "Wyloguj" w TopBar | ✅ | `<TopBar>` komponent |
| Wylogowanie przez `signOut()` | ✅ | `supabase.auth.signOut()` |
| Przekierowanie po wylogowaniu → `/login` | ✅ | `window.location.href = "/login"` |
| Usunięcie cookies po wylogowaniu | ✅ | Supabase automatycznie usuwa cookies |

**Compliance:** ✅ **100%**

### 10.3. US-003: User Data Isolation

| Wymaganie | Status | Implementacja |
|-----------|--------|---------------|
| Automatyczne tworzenie `profiles` po rejestracji | ✅ | Trigger `on_auth_user_created` |
| Trigger `handle_new_user()` z `SECURITY DEFINER` | ✅ | Migracja SQL |
| Trigger `AFTER INSERT` na `auth.users` | ✅ | Migracja SQL |
| `profiles.id` = `auth.users.id` | ✅ | `insert into profiles (id) values (new.id)` |
| Foreign key `ON DELETE CASCADE` | ✅ | `references auth.users(id) on delete cascade` |
| RLS włączone na `profiles` | ✅ | `alter table profiles enable row level security` |
| Użytkownik czyta tylko swój profil | ✅ | Polityka `profiles_select_own` |
| RLS włączone na `subscriptions` | ✅ | `alter table subscriptions enable row level security` |
| Użytkownik czyta tylko swoje subskrypcje | ✅ | Polityka `subscriptions_select_own` |
| Użytkownik tworzy tylko dla siebie | ✅ | Polityka `subscriptions_insert_own` |
| Użytkownik aktualizuje tylko swoje | ✅ | Polityka `subscriptions_update_own` |
| Użytkownik usuwa tylko swoje | ✅ | Polityka `subscriptions_delete_own` |
| `user_id` ustawiane server-side | ✅ | `insertData.user_id = locals.user.id` |
| Błąd 404 (nie 403) dla cudzych subskrypcji | ✅ | Endpoint zwraca 404 jeśli brak dostępu |
| Kaskadowe usuwanie użytkownika | ✅ | `ON DELETE CASCADE` na obu foreign keys |

**Compliance:** ✅ **100%**

---

## 11. Checklist Weryfikacji Implementacji vs PRD

### 11.1. US-001: User Registration and Login

**Strona `/login`:**
- [ ] Dedykowana strona `/login` istnieje (`src/pages/login.astro`)
- [ ] Dwie zakładki: "Login" i "Register" (komponent `<AuthTabs>`)
- [ ] Przełączanie zakładek zachowuje wartości formularzy (state preservation)

**Formularz Logowania:**
- [ ] Pole email z walidacją regex
- [ ] Pole hasło z min 6 znaków
- [ ] Błędy inline w języku polskim
- [ ] Wywołanie `supabase.auth.signInWithPassword()`
- [ ] Mapowanie błędów: "invalid login credentials" → "Nieprawidłowy email lub hasło"
- [ ] Przekierowanie po sukcesie → `/`

**Formularz Rejestracji:**
- [ ] Pole email z walidacją regex
- [ ] Pole hasło z min 6 znaków
- [ ] Pole potwierdzenia hasła z walidacją match
- [ ] Błędy inline w języku polskim
- [ ] Wywołanie `supabase.auth.signUp()`
- [ ] Mapowanie błędów: "user already registered" → "Konto z tym adresem email już istnieje"
- [ ] **KRYTYCZNE:** Użytkownik automatycznie zalogowany po rejestracji
- [ ] Przekierowanie po sukcesie → `/`

**Konfiguracja Supabase:**
- [ ] **KRYTYCZNE:** Email confirmation **WYŁĄCZONA** w Supabase Dashboard
- [ ] Anon key skonfigurowany w `.env` (PUBLIC_SUPABASE_KEY)
- [ ] URL Supabase skonfigurowany w `.env` (PUBLIC_SUPABASE_URL)

### 11.2. US-002: Automatic Redirects and Logout

**Przekierowania:**
- [ ] Zalogowany użytkownik na `/login` → automatyczne przekierowanie na `/`
- [ ] Niezalogowany użytkownik na `/` → automatyczne przekierowanie na `/login`
- [ ] Przekierowania realizowane przez middleware SSR (brak migotania)

**Middleware:**
- [ ] `src/middleware/index.ts` weryfikuje sesję
- [ ] `context.locals.user` ustawiany dla każdego requestu
- [ ] `context.locals.supabase` ustawiany dla każdego requestu
- [ ] Cookie-based auth dla stron Astro
- [ ] Bearer token auth dla API routes (`/api/*`)

**Wylogowanie:**
- [ ] Przycisk "Wyloguj" widoczny w TopBar na dashboardzie
- [ ] Wywołanie `supabase.auth.signOut()`
- [ ] Przekierowanie na `/login` po wylogowaniu
- [ ] Cookies sesji usuwane po wylogowaniu

### 11.3. US-003: User Data Isolation

**Automatyczne tworzenie profilu:**
- [ ] Trigger `on_auth_user_created` istnieje w bazie danych
- [ ] Funkcja `handle_new_user()` z atrybutem `SECURITY DEFINER`
- [ ] Rekord w `profiles` tworzony automatycznie przy rejestracji
- [ ] `profiles.id` = `auth.users.id`

**Row-Level Security:**
- [ ] RLS włączone na `profiles` (`alter table profiles enable row level security`)
- [ ] RLS włączone na `subscriptions`
- [ ] Polityka `profiles_select_own`: użytkownik czyta tylko swój profil
- [ ] Polityka `subscriptions_select_own`: użytkownik czyta tylko swoje subskrypcje
- [ ] Polityka `subscriptions_insert_own`: użytkownik tworzy tylko dla siebie
- [ ] Polityka `subscriptions_update_own`: użytkownik aktualizuje tylko swoje
- [ ] Polityka `subscriptions_delete_own`: użytkownik usuwa tylko swoje

**Server-side Enforcement:**
- [ ] `user_id` w subskrypcji **zawsze** ustawiane z `locals.user.id`
- [ ] `user_id` z body requestu **ignorowane** (destructuring)
- [ ] Próba dostępu do cudzej subskrypcji zwraca **404** (nie 403)

**Kaskadowe usuwanie:**
- [ ] `profiles.id` → `auth.users(id)` ON DELETE CASCADE
- [ ] `subscriptions.user_id` → `profiles(id)` ON DELETE CASCADE

### 11.4. Konfiguracja Środowiska

**Zmienne środowiskowe:**
- [ ] `SUPABASE_URL` (server-side)
- [ ] `SUPABASE_KEY` (server-side)
- [ ] `PUBLIC_SUPABASE_URL` (client-side)
- [ ] `PUBLIC_SUPABASE_KEY` (client-side)

**Astro Configuration:**
- [ ] `output: "server"` w `astro.config.mjs`
- [ ] React integration włączona
- [ ] Node adapter skonfigurowany

**Supabase Dashboard:**
- [ ] Email confirmations: **OFF**
- [ ] Site URL: `https://<domain>` (produkcja)
- [ ] Redirect URLs: `https://<domain>/`, `http://localhost:4321/` (development)

---

## 12. Załączniki

### 11.1. Diagram Architektury Autentykacji

```
┌──────────────────────────────────────────────────────────────────┐
│                         User (Browser)                            │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
         ┌──────────▼───────────┐  ┌───────▼────────┐
         │  Pages: /login, /    │  │  API Routes    │
         │  (SSR - Astro)       │  │  (/api/...)    │
         └──────────┬───────────┘  └────────┬───────┘
                    │                       │
         ┌──────────▼───────────────────────▼───────┐
         │         Middleware                        │
         │  - Cookie-based (pages)                   │
         │  - Token-based (API)                      │
         │  - Sets locals.user + locals.supabase     │
         └──────────┬───────────────────────────────┘
                    │
         ┌──────────▼───────────┐
         │  Supabase Auth       │
         │  - getUser()         │
         │  - Verify JWT        │
         │  - Refresh tokens    │
         └──────────┬───────────┘
                    │
         ┌──────────▼───────────┐
         │  PostgreSQL          │
         │  - auth.users        │
         │  - public.profiles   │
         │  - Row-Level Security│
         └──────────────────────┘
```

### 11.2. Diagram Przepływu Rejestracji

```
User                    Frontend (React)           Supabase Auth           PostgreSQL
  │                           │                          │                      │
  ├──(1) Fill register form──▶                          │                      │
  │                           │                          │                      │
  ├──(2) Submit───────────────▶                          │                      │
  │                           │                          │                      │
  │                           ├─(3) signUp()────────────▶                      │
  │                           │                          │                      │
  │                           │                          ├─(4) INSERT auth.users─▶
  │                           │                          │                      │
  │                           │                          │◀─(5) Trigger: handle_new_user()
  │                           │                          │                      │
  │                           │                          ├─(6) INSERT profiles──▶
  │                           │                          │                      │
  │                           │◀─(7) Return session──────┤                      │
  │                           │                          │                      │
  │                           ├─(8) Set cookies──────────▶                      │
  │                           │                          │                      │
  │◀─(9) Redirect to /────────┤                          │                      │
  │                           │                          │                      │
```

### 11.3. Diagram Przepływu Logowania

```
User                    Frontend (React)           Supabase Auth           PostgreSQL
  │                           │                          │                      │
  ├──(1) Fill login form──────▶                          │                      │
  │                           │                          │                      │
  ├──(2) Submit───────────────▶                          │                      │
  │                           │                          │                      │
  │                           ├─(3) signInWithPassword()─▶                      │
  │                           │                          │                      │
  │                           │                          ├─(4) SELECT auth.users─▶
  │                           │                          │                      │
  │                           │                          ├─(5) Verify password──│
  │                           │                          │                      │
  │                           │◀─(6) Return session──────┤                      │
  │                           │                          │                      │
  │                           ├─(7) Set cookies──────────▶                      │
  │                           │                          │                      │
  │◀─(8) Redirect to /────────┤                          │                      │
  │                           │                          │                      │
```

### 11.4. Diagram Polityk RLS

```
┌─────────────────────────────────────────────────────────────┐
│                      Authenticated User                      │
│                     (auth.uid() = 'user-a')                  │
└────────────────────────────┬────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
┌─────────▼─────────┐  ┌─────▼──────┐  ┌───────▼────────┐
│ SELECT profiles   │  │  INSERT    │  │  UPDATE        │
│ WHERE id='user-a' │  │  user_id   │  │  WHERE user_id │
│ ✅ Allowed        │  │  ='user-a' │  │  ='user-a'     │
└───────────────────┘  │  ✅ Allowed │  │  ✅ Allowed    │
                       └────────────┘  └────────────────┘
┌───────────────────┐  ┌────────────┐  ┌────────────────┐
│ SELECT profiles   │  │  INSERT    │  │  UPDATE        │
│ WHERE id='user-b' │  │  user_id   │  │  WHERE user_id │
│ ❌ Denied (RLS)   │  │  ='user-b' │  │  ='user-b'     │
└───────────────────┘  │  ❌ Denied │  │  ❌ Denied     │
                       └────────────┘  └────────────────┘
```

---

## 12. Glosariusz

| Termin | Definicja |
|--------|-----------|
| **Supabase Auth** | Moduł autentykacji w Supabase, oferujący gotowe metody rejestracji, logowania, zarządzania sesją |
| **RLS (Row-Level Security)** | Mechanizm PostgreSQL filtrujący wiersze na podstawie polityk, zapewniający izolację danych użytkowników |
| **JWT (JSON Web Token)** | Standard tokenu używany do autentykacji w API, przesyłany w nagłówku `Authorization: Bearer <token>` |
| **SSR (Server-Side Rendering)** | Renderowanie stron po stronie serwera przed wysłaniem do przeglądarki (tryb Astro `output: "server"`) |
| **Hydration** | Proces dodawania interaktywności do statycznego HTML przez React (dyrektywa `client:load`) |
| **Middleware** | Funkcja wykonywana przed każdym requestem, weryfikująca sesję i ustawiająca `context.locals` |
| **Trigger** | Funkcja SQL wykonywana automatycznie przy INSERT/UPDATE/DELETE na tabeli |
| **SECURITY DEFINER** | Atrybut funkcji SQL pozwalający wykonać ją z uprawnieniami właściciela (omija RLS) |
| **Zod** | Biblioteka TypeScript do deklaratywnej walidacji schematów danych |
| **Shadcn/ui** | Zestaw gotowych komponentów UI w React z integracją Tailwind CSS |
| **Guard Clause** | Sprawdzenie warunku na początku funkcji, aby przerwać wykonanie wcześnie (np. `if (!user) return redirect()`) |
| **State Preservation** | Zachowanie wartości formularza przy przełączaniu między zakładkami (stan w `AuthCard`) |

---

**Koniec specyfikacji technicznej**

*Data utworzenia: 2026-01-29*  
*Ostatnia weryfikacja PRD: 2026-01-29*  
*Wersja: 1.1 (zweryfikowana zgodność z PRD)*
