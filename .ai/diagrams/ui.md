# Diagram Architektury UI - Moduł Autentykacji Subbase

Data utworzenia: 2026-01-29

## Opis

Diagram przedstawia architekturę komponentów UI aplikacji Subbase z uwzględnieniem modułu autentykacji zgodnie z wymaganiami US-001, US-002, US-003 z PRD. Pokazuje relacje między stronami Astro (SSR), komponentami React, middleware autentykacji oraz Supabase Auth.

## Diagram

```mermaid
flowchart TD
    %% Użytkownik
    User([Użytkownik<br/>Przeglądarka])

    %% Middleware Layer
    subgraph Middleware["🔒 Middleware Autentykacji"]
        MW[Middleware<br/>index.ts]
        MW_Cookie[Cookie-based Auth<br/>dla stron Astro]
        MW_Token[Token-based Auth<br/>dla API routes]
    end

    %% Pages Layer - Astro SSR
    subgraph Pages["📄 Strony Astro - SSR"]
        LoginPage["/login<br/>login.astro<br/>🆕 US-001"]
        DashboardPage["/<br/>index.astro<br/>✅ US-002"]
    end

    %% Auth Components
    subgraph AuthComponents["🔐 Komponenty Autentykacji - React"]
        AuthCard[AuthCard<br/>Kontener główny<br/>🆕 US-001]
        AuthTabs[AuthTabs<br/>Przełącznik Login/Register<br/>🆕 US-001]
        LoginForm[LoginForm<br/>Formularz logowania<br/>🆕 US-001]
        RegisterForm[RegisterForm<br/>Formularz rejestracji<br/>🆕 US-001]
        FormField[FormField<br/>Pole formularza<br/>🆕 US-001]
        FormError[FormError<br/>Komunikat błędu<br/>🆕 US-001]
        AuthTopBar[AuthTopBar<br/>Górny pasek<br/>🆕 US-001]
    end

    %% Dashboard Components
    subgraph DashboardComponents["📊 Komponenty Dashboard - React"]
        DashboardLayout[DashboardLayout<br/>Layout główny]
        TopBar[TopBar<br/>Górny pasek z wylogowaniem<br/>✅ US-002]
        SummarySection[SummarySection<br/>Podsumowanie kosztów]
        SubscriptionList[SubscriptionList<br/>Lista subskrypcji<br/>✅ US-003]
        AiInsightsPanel[AiInsightsPanel<br/>Panel AI insights]
        SubscriptionFormModal[SubscriptionFormModal<br/>Modal dodawania/edycji]
        DeleteConfirmDialog[DeleteConfirmDialog<br/>Dialog usuwania]
    end

    %% Shared Components
    subgraph SharedComponents["🎨 Komponenty Współdzielone"]
        ThemeProvider[ThemeProvider<br/>Dostawca motywu]
        ThemeToggle[ThemeToggle<br/>Przełącznik jasny/ciemny]
        Button[Button<br/>Shadcn/ui]
        Card[Card<br/>Shadcn/ui]
        Input[Input<br/>Shadcn/ui]
        Dialog[Dialog<br/>Shadcn/ui]
    end

    %% Hooks and Utils
    subgraph HooksUtils["🔧 Hooki i Utilities"]
        useAuthForm[useAuthForm<br/>Zarządzanie formularzem<br/>🆕 US-001]
        AuthSchemas[loginSchema<br/>registerSchema<br/>Walidacja Zod<br/>🆕 US-001]
        DashboardContext[DashboardContext<br/>Stan dashboardu]
    end

    %% Supabase Layer
    subgraph SupabaseLayer["☁️ Supabase"]
        SupabaseBrowser[createSupabaseBrowserClient<br/>Klient przeglądarki<br/>🆕 US-001]
        SupabaseAuth[Supabase Auth<br/>signInWithPassword<br/>signUp<br/>signOut<br/>getUser<br/>🆕 US-001, US-002]
        SupabaseDB[PostgreSQL<br/>auth.users<br/>profiles<br/>subscriptions<br/>✅ US-003]
    end

    %% Relacje - User Flow
    User -->|1. Request| MW
    MW --> MW_Cookie
    MW --> MW_Token
    MW_Cookie -->|Weryfikacja sesji| LoginPage
    MW_Cookie -->|Weryfikacja sesji| DashboardPage

    %% Login Page Flow
    LoginPage -->|SSR Guard:<br/>if user redirect /| AuthCard
    AuthCard --> ThemeProvider
    AuthCard --> AuthTopBar
    AuthCard --> AuthTabs
    AuthTabs --> LoginForm
    AuthTabs --> RegisterForm
    LoginForm --> FormField
    LoginForm --> FormError
    LoginForm --> useAuthForm
    RegisterForm --> FormField
    RegisterForm --> FormError
    RegisterForm --> useAuthForm
    
    useAuthForm --> AuthSchemas
    LoginForm -->|signInWithPassword| SupabaseBrowser
    RegisterForm -->|signUp| SupabaseBrowser
    SupabaseBrowser --> SupabaseAuth
    SupabaseAuth -->|Weryfikacja credentials| SupabaseDB

    LoginForm -.->|Success:<br/>window.location.href = /| DashboardPage
    RegisterForm -.->|Success:<br/>window.location.href = /| DashboardPage

    %% Dashboard Page Flow
    DashboardPage -->|SSR Guard:<br/>if not user redirect /login| DashboardLayout
    DashboardLayout --> ThemeProvider
    DashboardLayout --> TopBar
    DashboardLayout --> SummarySection
    DashboardLayout --> SubscriptionList
    DashboardLayout --> AiInsightsPanel
    DashboardLayout --> SubscriptionFormModal
    DashboardLayout --> DeleteConfirmDialog
    DashboardLayout --> DashboardContext

    TopBar -->|signOut| SupabaseBrowser
    TopBar --> ThemeToggle
    TopBar -.->|Logout:<br/>window.location.href = /login| LoginPage

    %% Shared Components Usage
    AuthCard --> Card
    LoginForm --> Button
    RegisterForm --> Button
    FormField --> Input
    SubscriptionFormModal --> Dialog
    DeleteConfirmDialog --> Dialog

    %% RLS Protection
    SubscriptionList -.->|Protected by RLS<br/>auth.uid = user_id| SupabaseDB
    SummarySection -.->|Protected by RLS| SupabaseDB

    %% Styling
    classDef newComponent fill:#e8f5e9,stroke:#4caf50,stroke-width:3px
    classDef updatedComponent fill:#fff3e0,stroke:#ff9800,stroke-width:3px
    classDef middlewareStyle fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    classDef supabaseStyle fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    
    class LoginForm,RegisterForm,AuthCard,AuthTabs,FormField,FormError,AuthTopBar,useAuthForm,AuthSchemas,SupabaseBrowser,SupabaseAuth newComponent
    class TopBar,DashboardPage,LoginPage,SupabaseDB updatedComponent
    class MW,MW_Cookie,MW_Token middlewareStyle
    class SupabaseBrowser,SupabaseAuth,SupabaseDB supabaseStyle
```

## Legenda

**Oznaczenia komponentów:**
- 🆕 **Zielone obramowanie** - Nowe komponenty dodane w ramach US-001, US-002, US-003
- ✅ **Pomarańczowe obramowanie** - Zaktualizowane istniejące komponenty
- 🔒 **Niebieskie obramowanie** - Middleware autentykacji
- ☁️ **Fioletowe obramowanie** - Warstwa Supabase

**Typy relacji:**
- **Pełna linia ze strzałką** `-->` - Bezpośrednia zależność komponentów
- **Przerywana linia ze strzałką** `-.->` - Przekierowania i flow autentykacji

**Kluczowe flow:**

1. **Flow Logowania:**
   - User → Middleware (cookie check) → `/login`
   - SSR Guard: jeśli zalogowany → przekierowanie na `/`
   - Renderowanie `AuthCard` → `LoginForm`
   - Submit → `signInWithPassword()` → Supabase Auth
   - Sukces → `window.location.href = "/"` (full reload)

2. **Flow Rejestracji:**
   - User → `/login` → zakładka "Rejestracja"
   - Renderowanie `RegisterForm`
   - Submit → `signUp()` → Supabase Auth
   - Trigger `handle_new_user()` → automatyczne tworzenie `profiles`
   - Sukces → automatyczne logowanie → przekierowanie na `/`

3. **Flow Dashboard:**
   - User → Middleware (cookie check) → `/`
   - SSR Guard: jeśli niezalogowany → przekierowanie na `/login`
   - Renderowanie `DashboardLayout` → komponenty dashboard
   - `TopBar` zawiera przycisk "Wyloguj"
   - Wylogowanie → `signOut()` → przekierowanie na `/login`

4. **Flow Izolacji Danych (RLS):**
   - `SubscriptionList` → API `/api/subscriptions`
   - Middleware weryfikuje JWT token z `Authorization` header
   - Supabase RLS filtruje dane: `auth.uid() = user_id`
   - Użytkownik widzi tylko swoje subskrypcje

## Kluczowe Decyzje Architektoniczne

### 1. Hybrydowe Renderowanie
- **Strony Astro** - SSR (`output: "server"`) dla optymalnej wydajności i SEO
- **Komponenty React** - Hydratacja `client:load` dla interaktywności
- **Przekierowania** - Realizowane po stronie serwera (brak migotania)

### 2. Podwójny Mechanizm Autentykacji
- **Cookie-based** - dla stron Astro (SSR) z automatycznym refresh tokenów
- **Token-based** - dla API routes (stateless) z JWT w `Authorization` header

### 3. State Preservation
- `AuthCard` zachowuje wartości formularzy przy przełączaniu zakładek
- `loginFormValues` i `registerFormValues` w lokalnym state
- Callback `onValuesChange` dla synchronizacji

### 4. Fail-safe Navigation
- `window.location.href` zamiast client-side routing dla wymuszenia full reload
- Zapewnia weryfikację sesji przez middleware po każdym przekierowaniu
- Czyści stan aplikacji (React context) po wylogowaniu

### 5. Row-Level Security
- Supabase RLS na poziomie bazy danych
- Server-side enforcement `user_id` (zawsze z `locals.user.id`)
- Polityki: `auth.uid() = user_id` dla wszystkich operacji CRUD

## Zgodność z Wymaganiami PRD

### US-001: User Registration and Login
- ✅ Strona `/login` z zakładkami Login/Register
- ✅ Walidacja klient-side (Zod) z komunikatami w PL
- ✅ Integracja Supabase Auth (`signInWithPassword`, `signUp`)
- ✅ Automatyczne logowanie po rejestracji
- ✅ State preservation przy przełączaniu zakładek

### US-002: Automatic Redirects and Logout
- ✅ SSR Guards na stronach (`if user` / `if !user`)
- ✅ Middleware weryfikuje sesję (cookies dla stron, JWT dla API)
- ✅ Przycisk "Wyloguj" w `TopBar`
- ✅ `signOut()` → usunięcie cookies → przekierowanie

### US-003: User Data Isolation
- ✅ Row-Level Security (RLS) na `profiles` i `subscriptions`
- ✅ Server-side enforcement `user_id`
- ✅ Automatyczne tworzenie `profiles` przez trigger
- ✅ Filtrowanie danych w `SubscriptionList` przez RLS

## Komponenty Kluczowe dla Autentykacji

**Frontend:**
- `AuthCard` - główny kontener z zarządzaniem stanem
- `LoginForm` / `RegisterForm` - formularze z walidacją
- `useAuthForm` - generyczny hook do zarządzania formularzami
- `TopBar` - wylogowanie

**Backend:**
- `src/middleware/index.ts` - weryfikacja sesji
- `createSupabaseBrowserClient()` - klient dla przeglądarki
- Supabase Auth - zewnętrzny serwis autentykacji

**Baza Danych:**
- `auth.users` - użytkownicy (zarządzane przez Supabase)
- `public.profiles` - profile użytkowników (automatyczne tworzenie)
- RLS policies - izolacja danych

---

**Koniec diagramu UI**
