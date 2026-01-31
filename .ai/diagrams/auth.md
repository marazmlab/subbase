# Diagram Architektury Autentykacji - Subbase

## Przepływ 1: Rejestracja Użytkownika

<mermaid_diagram>
```mermaid
sequenceDiagram
    autonumber
    participant Browser as Przeglądarka
    participant AuthCard as AuthCard (React)
    participant RegisterForm as RegisterForm (React)
    participant SupabaseClient as Supabase Client (Browser)
    participant SupabaseAuth as Supabase Auth
    participant PostgreSQL as PostgreSQL (auth.users)
    participant Trigger as Trigger (handle_new_user)
    participant Profiles as public.profiles

    Browser->>AuthCard: Użytkownik otwiera /login
    activate AuthCard
    AuthCard->>RegisterForm: Renderuje zakładkę Register
    activate RegisterForm
    
    Browser->>RegisterForm: Wypełnia formularz (email, password, confirm)
    RegisterForm->>RegisterForm: Walidacja klient-side (Zod schema)
    
    Note over RegisterForm: Walidacja:<br/>- Email format (regex)<br/>- Password min 6 chars<br/>- Passwords match
    
    Browser->>RegisterForm: Klika "Zarejestruj się"
    RegisterForm->>SupabaseClient: signUp({ email, password })
    activate SupabaseClient
    
    SupabaseClient->>SupabaseAuth: POST /auth/v1/signup
    activate SupabaseAuth
    
    SupabaseAuth->>PostgreSQL: INSERT INTO auth.users
    activate PostgreSQL
    
    PostgreSQL-->>Trigger: AFTER INSERT trigger wykonany
    activate Trigger
    Trigger->>Profiles: INSERT INTO public.profiles (id)
    Trigger-->>PostgreSQL: Profil utworzony
    deactivate Trigger
    
    PostgreSQL-->>SupabaseAuth: Użytkownik utworzony
    deactivate PostgreSQL
    
    SupabaseAuth->>SupabaseAuth: Generuje access_token i refresh_token
    SupabaseAuth-->>SupabaseClient: Zwraca session (user, tokens)
    deactivate SupabaseAuth
    
    SupabaseClient->>Browser: Ustawia cookies (sb-*-auth-token)
    Note over Browser,SupabaseClient: Cookies:<br/>- access_token (1h)<br/>- refresh_token (30 dni)
    
    SupabaseClient-->>RegisterForm: Success (session)
    deactivate SupabaseClient
    
    RegisterForm->>AuthCard: onSuccess()
    deactivate RegisterForm
    
    AuthCard->>Browser: window.location.href = "/"
    deactivate AuthCard
    
    Note over Browser: Full page reload<br/>Przekierowanie na Dashboard
```
</mermaid_diagram>

---

## Przepływ 2: Logowanie Użytkownika

<mermaid_diagram>
```mermaid
sequenceDiagram
    autonumber
    participant Browser as Przeglądarka
    participant LoginForm as LoginForm (React)
    participant SupabaseClient as Supabase Client (Browser)
    participant SupabaseAuth as Supabase Auth
    participant PostgreSQL as PostgreSQL (auth.users)

    Browser->>LoginForm: Użytkownik otwiera /login (tab Login)
    activate LoginForm
    
    Browser->>LoginForm: Wypełnia email i password
    LoginForm->>LoginForm: Walidacja klient-side (Zod schema)
    
    Browser->>LoginForm: Klika "Zaloguj się"
    LoginForm->>SupabaseClient: signInWithPassword({ email, password })
    activate SupabaseClient
    
    SupabaseClient->>SupabaseAuth: POST /auth/v1/token?grant_type=password
    activate SupabaseAuth
    
    SupabaseAuth->>PostgreSQL: SELECT FROM auth.users WHERE email=?
    activate PostgreSQL
    PostgreSQL-->>SupabaseAuth: Zwraca użytkownika (hashed password)
    deactivate PostgreSQL
    
    SupabaseAuth->>SupabaseAuth: Weryfikuje hasło (bcrypt.compare)
    
    alt Credentials poprawne
        SupabaseAuth->>SupabaseAuth: Generuje access_token i refresh_token
        SupabaseAuth-->>SupabaseClient: Zwraca session (user, tokens)
        SupabaseClient->>Browser: Ustawia cookies (sb-*-auth-token)
        SupabaseClient-->>LoginForm: Success (session)
        LoginForm->>Browser: window.location.href = "/"
        Note over Browser: Przekierowanie na Dashboard
    else Credentials niepoprawne
        SupabaseAuth-->>SupabaseClient: Error: invalid login credentials
        SupabaseClient-->>LoginForm: Error
        LoginForm->>LoginForm: mapAuthError()
        LoginForm->>Browser: Wyświetla: "Nieprawidłowy email lub hasło"
        Note over LoginForm: Komunikat nie rozróżnia<br/>czy błędny email czy password<br/>(security: zapobiega enumeracji kont)
    end
    
    deactivate SupabaseAuth
    deactivate SupabaseClient
    deactivate LoginForm
```
</mermaid_diagram>

---

## Przepływ 3: Weryfikacja Sesji (SSR - Strony Astro)

<mermaid_diagram>
```mermaid
sequenceDiagram
    autonumber
    participant Browser as Przeglądarka
    participant AstroMiddleware as Middleware (Astro)
    participant SupabaseSSR as Supabase Client (SSR)
    participant SupabaseAuth as Supabase Auth
    participant AstroPage as Strona Astro (login.astro / index.astro)

    Browser->>AstroMiddleware: GET / lub GET /login
    activate AstroMiddleware
    Note over Browser,AstroMiddleware: Request zawiera cookies<br/>(sb-*-auth-token)
    
    AstroMiddleware->>AstroMiddleware: Sprawdza: isApiRoute = false
    AstroMiddleware->>SupabaseSSR: createServerClient (cookies mode)
    activate SupabaseSSR
    
    Note over SupabaseSSR: Konfiguracja:<br/>- cookies.getAll() odczytuje z header<br/>- cookies.setAll() zapisuje przez context.cookies
    
    AstroMiddleware->>SupabaseSSR: auth.getUser()
    SupabaseSSR->>SupabaseAuth: Weryfikuje access_token z cookies
    activate SupabaseAuth
    
    alt Token ważny (< 1h)
        SupabaseAuth-->>SupabaseSSR: Zwraca user object
        SupabaseSSR-->>AstroMiddleware: { user }
        AstroMiddleware->>AstroMiddleware: context.locals.user = user
    else Token wygasły (> 1h)
        SupabaseAuth->>SupabaseAuth: Używa refresh_token do pobrania nowego access_token
        Note over SupabaseAuth: Refresh token rotation:<br/>- Nowy access_token (1h)<br/>- Opcjonalnie nowy refresh_token
        SupabaseAuth-->>SupabaseSSR: Zwraca user + nowe tokeny
        SupabaseSSR->>AstroMiddleware: Callback setAll() - ustawia nowe cookies
        Note over AstroMiddleware: Transparentne odświeżenie<br/>Użytkownik nie zauważa
        AstroMiddleware->>AstroMiddleware: context.locals.user = user
    else Brak sesji lub błąd
        SupabaseAuth-->>SupabaseSSR: Error lub null
        SupabaseSSR-->>AstroMiddleware: { user: null }
        AstroMiddleware->>AstroMiddleware: context.locals.user = null
    end
    
    deactivate SupabaseAuth
    deactivate SupabaseSSR
    
    AstroMiddleware->>AstroPage: next() - przekazuje kontrolę do strony
    deactivate AstroMiddleware
    activate AstroPage
    
    alt Strona: /login
        AstroPage->>AstroPage: const user = Astro.locals.user
        AstroPage->>AstroPage: if (user) return Astro.redirect("/")
        alt Użytkownik zalogowany
            AstroPage->>Browser: Redirect 302 -> /
            Note over Browser: Automatyczne przekierowanie<br/>Brak renderowania formularza
        else Użytkownik niezalogowany
            AstroPage->>Browser: Renderuje AuthCard (formularz login/register)
        end
    else Strona: / (Dashboard)
        AstroPage->>AstroPage: const user = Astro.locals.user
        AstroPage->>AstroPage: if (!user) return Astro.redirect("/login")
        alt Użytkownik niezalogowany
            AstroPage->>Browser: Redirect 302 -> /login
            Note over Browser: Automatyczne przekierowanie<br/>Brak renderowania dashboardu
        else Użytkownik zalogowany
            AstroPage->>Browser: Renderuje DashboardLayout
        end
    end
    
    deactivate AstroPage
```
</mermaid_diagram>

---

## Przepływ 4: Weryfikacja JWT (API Routes)

<mermaid_diagram>
```mermaid
sequenceDiagram
    autonumber
    participant Browser as Przeglądarka (React)
    participant SupabaseBrowser as Supabase Client (Browser)
    participant APIRoute as API Route (/api/subscriptions)
    participant AstroMiddleware as Middleware (Astro)
    participant SupabaseSSR as Supabase Client (SSR)
    participant SupabaseAuth as Supabase Auth

    Browser->>SupabaseBrowser: getSession()
    activate SupabaseBrowser
    SupabaseBrowser-->>Browser: { session: { access_token } }
    deactivate SupabaseBrowser
    
    Browser->>APIRoute: GET /api/subscriptions
    Note over Browser,APIRoute: Header:<br/>Authorization: Bearer <token><br/>Content-Type: application/json
    
    activate APIRoute
    APIRoute->>AstroMiddleware: Request pre-processing
    activate AstroMiddleware
    
    AstroMiddleware->>AstroMiddleware: Sprawdza: isApiRoute = true
    AstroMiddleware->>AstroMiddleware: Odczytuje header Authorization
    AstroMiddleware->>AstroMiddleware: token = authHeader.replace("Bearer ", "")
    
    AstroMiddleware->>SupabaseSSR: createServerClient (token mode)
    activate SupabaseSSR
    Note over SupabaseSSR: Konfiguracja:<br/>- global.headers: { Authorization }<br/>- autoRefreshToken: false<br/>- persistSession: false<br/>- cookies: no-op (stateless)
    
    AstroMiddleware->>SupabaseSSR: auth.getUser(token)
    SupabaseSSR->>SupabaseAuth: Weryfikuje JWT signature i expiry
    activate SupabaseAuth
    
    alt Token ważny
        SupabaseAuth-->>SupabaseSSR: Zwraca user object
        SupabaseSSR-->>AstroMiddleware: { user }
        AstroMiddleware->>AstroMiddleware: context.locals.user = user
    else Token wygasły lub nieprawidłowy
        SupabaseAuth-->>SupabaseSSR: Error
        Note over SupabaseAuth: Brak auto-refresh<br/>(stateless API)
        SupabaseSSR-->>AstroMiddleware: { error }
        AstroMiddleware->>AstroMiddleware: context.locals.user = null
    end
    
    deactivate SupabaseAuth
    deactivate SupabaseSSR
    
    AstroMiddleware->>APIRoute: next() - przekazuje kontrolę
    deactivate AstroMiddleware
    
    APIRoute->>APIRoute: const user = locals.user
    APIRoute->>APIRoute: if (!user) return Response(401)
    
    alt Użytkownik uwierzytelniony
        APIRoute->>APIRoute: Wykonuje logikę endpointu
        Note over APIRoute: Przykład:<br/>supabase.from("subscriptions")<br/>.select("*")<br/>.eq("user_id", user.id)
        APIRoute->>Browser: Response 200 + JSON data
        Note over Browser: Dane subskrypcji
    else Użytkownik nieuwierzytelniony
        APIRoute->>Browser: Response 401 Unauthorized
        Note over Browser: MVP Behavior:<br/>Frontend wylogowuje użytkownika<br/>(acceptable dla MVP)
    end
    
    deactivate APIRoute
```
</mermaid_diagram>

---

## Przepływ 5: Wylogowanie Użytkownika

<mermaid_diagram>
```mermaid
sequenceDiagram
    autonumber
    participant Browser as Przeglądarka
    participant TopBar as TopBar (React)
    participant SupabaseClient as Supabase Client (Browser)
    participant SupabaseAuth as Supabase Auth
    participant AstroMiddleware as Middleware (Astro)
    participant LoginPage as /login (Astro)

    Browser->>TopBar: Użytkownik klika "Wyloguj"
    activate TopBar
    
    TopBar->>TopBar: setIsLoggingOut(true)
    TopBar->>TopBar: Dezaktywuje przycisk, wyświetla "Wylogowywanie..."
    
    TopBar->>SupabaseClient: signOut()
    activate SupabaseClient
    
    SupabaseClient->>SupabaseAuth: POST /auth/v1/logout
    activate SupabaseAuth
    Note over SupabaseAuth: Unieważnia sesję<br/>server-side
    SupabaseAuth-->>SupabaseClient: Success
    deactivate SupabaseAuth
    
    SupabaseClient->>Browser: Usuwa cookies (sb-*-auth-token)
    Note over Browser,SupabaseClient: Cookies usunięte:<br/>- access_token<br/>- refresh_token
    SupabaseClient-->>TopBar: Success
    deactivate SupabaseClient
    
    TopBar->>Browser: window.location.href = "/login"
    deactivate TopBar
    Note over Browser: Full page reload<br/>Czyści stan React

    Browser->>LoginPage: GET /login
    activate LoginPage
    LoginPage->>AstroMiddleware: Request pre-processing
    activate AstroMiddleware
    
    AstroMiddleware->>AstroMiddleware: Odczytuje cookies (brak)
    AstroMiddleware->>AstroMiddleware: context.locals.user = null
    AstroMiddleware->>LoginPage: next()
    deactivate AstroMiddleware
    
    LoginPage->>LoginPage: const user = Astro.locals.user (null)
    LoginPage->>LoginPage: if (user) - FALSE, brak redirectu
    LoginPage->>Browser: Renderuje AuthCard (formularz login)
    deactivate LoginPage
    
    Note over Browser: Użytkownik wylogowany<br/>Widzi stronę logowania
```
</mermaid_diagram>

---

## Przepływ 6: Ochrona RLS (Row-Level Security)

<mermaid_diagram>
```mermaid
sequenceDiagram
    autonumber
    participant Browser as Przeglądarka (User A)
    participant APIRoute as API Route
    participant AstroMiddleware as Middleware
    participant SupabaseClient as Supabase Client (SSR)
    participant PostgreSQL as PostgreSQL
    participant RLS as Row-Level Security

    Browser->>APIRoute: GET /api/subscriptions/abc123
    Note over Browser: User A próbuje uzyskać<br/>dostęp do subskrypcji User B
    
    activate APIRoute
    APIRoute->>AstroMiddleware: Request pre-processing
    activate AstroMiddleware
    AstroMiddleware->>AstroMiddleware: Weryfikuje JWT (User A)
    AstroMiddleware->>AstroMiddleware: context.locals.user = User A
    AstroMiddleware->>APIRoute: next()
    deactivate AstroMiddleware
    
    APIRoute->>APIRoute: const user = locals.user (User A)
    APIRoute->>APIRoute: if (!user) - FALSE, użytkownik zalogowany
    
    APIRoute->>SupabaseClient: from("subscriptions").select("*").eq("id", "abc123")
    activate SupabaseClient
    
    SupabaseClient->>PostgreSQL: SELECT * FROM subscriptions WHERE id='abc123'
    activate PostgreSQL
    
    PostgreSQL->>RLS: Sprawdza politykę subscriptions_select_own
    activate RLS
    Note over RLS: Polityka:<br/>auth.uid() = user_id<br/><br/>User A.id != User B.id<br/>Dostęp ZABRONIONY
    
    RLS->>PostgreSQL: Filtruje wyniki (usuwa row)
    deactivate RLS
    
    PostgreSQL-->>SupabaseClient: Zwraca pusty wynik (brak wierszy)
    deactivate PostgreSQL
    
    SupabaseClient-->>APIRoute: { data: null, error }
    deactivate SupabaseClient
    
    APIRoute->>APIRoute: if (error || !data) - TRUE
    APIRoute->>Browser: Response 404 Not Found
    deactivate APIRoute
    
    Note over Browser: User A otrzymuje 404<br/>(nie 403!)<br/>Aplikacja nie ujawnia<br/>czy subskrypcja istnieje
```
</mermaid_diagram>

---

## Przepływ 7: Próba Utworzenia Subskrypcji dla Innego Użytkownika

<mermaid_diagram>
```mermaid
sequenceDiagram
    autonumber
    participant Browser as Przeglądarka (User A)
    participant APIRoute as POST /api/subscriptions
    participant AstroMiddleware as Middleware
    participant SupabaseClient as Supabase Client (SSR)
    participant PostgreSQL as PostgreSQL
    participant RLS as Row-Level Security

    Browser->>APIRoute: POST /api/subscriptions
    Note over Browser: Body zawiera:<br/>{ name, cost, user_id: "user-b-id" }
    
    activate APIRoute
    APIRoute->>AstroMiddleware: Request pre-processing
    activate AstroMiddleware
    AstroMiddleware->>AstroMiddleware: context.locals.user = User A
    AstroMiddleware->>APIRoute: next()
    deactivate AstroMiddleware
    
    APIRoute->>APIRoute: const user = locals.user (User A)
    APIRoute->>APIRoute: const body = await request.json()
    
    APIRoute->>APIRoute: Ignoruje user_id z body
    Note over APIRoute: const { user_id: _, ...data } = body<br/><br/>Security: user_id zawsze z locals.user
    
    APIRoute->>APIRoute: insertData = { ...data, user_id: user.id }
    Note over APIRoute: user_id = User A.id<br/>(nie User B.id!)
    
    APIRoute->>SupabaseClient: from("subscriptions").insert(insertData)
    activate SupabaseClient
    
    SupabaseClient->>PostgreSQL: INSERT INTO subscriptions (user_id='user-a-id', ...)
    activate PostgreSQL
    
    PostgreSQL->>RLS: Sprawdza politykę subscriptions_insert_own
    activate RLS
    Note over RLS: WITH CHECK:<br/>auth.uid() = user_id<br/><br/>User A.id == User A.id<br/>Dostęp DOZWOLONY
    
    RLS->>PostgreSQL: Wstawienie dozwolone
    deactivate RLS
    
    PostgreSQL-->>SupabaseClient: Sukces (subscription created)
    deactivate PostgreSQL
    
    SupabaseClient-->>APIRoute: { data: subscription }
    deactivate SupabaseClient
    
    APIRoute->>Browser: Response 201 Created
    deactivate APIRoute
    
    Note over Browser: Subskrypcja utworzona<br/>dla User A (nie User B)<br/><br/>RLS zapewnia dodatkową<br/>warstwę ochrony
```
</mermaid_diagram>

---

## Legenda Aktorów

| Aktor | Opis |
|-------|------|
| **Przeglądarka** | Środowisko użytkownika - przechowuje cookies, wykonuje requesty HTTP |
| **React Components** | Komponenty UI (LoginForm, RegisterForm, TopBar) - interakcja użytkownika |
| **Supabase Client (Browser)** | Klient Supabase dla przeglądarki (`@supabase/ssr` - `createBrowserClient`) |
| **Middleware (Astro)** | Warstwa pośrednia weryfikująca sesję przed każdym requestem |
| **Supabase Client (SSR)** | Klient Supabase dla serwera (`@supabase/ssr` - `createServerClient`) |
| **Strona Astro** | Renderowanie SSR z guard clauses (redirects) |
| **API Route** | Endpoint REST API (np. `/api/subscriptions`) |
| **Supabase Auth** | Usługa autentykacji Supabase - zarządzanie użytkownikami, tokeny JWT |
| **PostgreSQL** | Baza danych - `auth.users`, `public.profiles`, `public.subscriptions` |
| **RLS (Row-Level Security)** | Polityki PostgreSQL filtrujące wiersze na podstawie `auth.uid()` |
| **Trigger** | Funkcja SQL wykonywana automatycznie (np. `handle_new_user`) |

---

## Kluczowe Mechanizmy Bezpieczeństwa

### 1. Dwutorowa Autentykacja

**Strony Astro (Cookie-Based):**
- Cookies przechowują access_token i refresh_token
- Middleware automatycznie odświeża tokeny (refresh token rotation)
- Brak przerwy w sesji dla użytkownika
- SSR guard clauses - redirects przed renderowaniem UI

**API Routes (Token-Based):**
- JWT przekazywany w header `Authorization: Bearer <token>`
- Stateless - brak automatycznego odświeżania tokenów
- `autoRefreshToken: false`, `persistSession: false`
- MVP: użytkownik wylogowywany przy wygasłym tokenie (acceptable behavior)

### 2. Row-Level Security (RLS)

**Izolacja danych użytkowników:**
- Polityki RLS filtrują wyniki zapytań na poziomie bazy danych
- `auth.uid() = user_id` - tylko własne dane
- Dwuwarstwowa ochrona: server-side enforcement + RLS
- Błąd 404 (nie 403) - nie ujawnia istnienia zasobów

**Polityki:**
- `subscriptions_select_own` - odczyt tylko własnych subskrypcji
- `subscriptions_insert_own` - tworzenie tylko dla siebie
- `subscriptions_update_own` - aktualizacja tylko własnych
- `subscriptions_delete_own` - usuwanie tylko własnych

### 3. Automatyczne Odświeżanie Tokenów (SSR)

**Proces transparentny:**
1. Middleware wywołuje `getUser()` przy każdym request
2. Supabase wykrywa wygasły access_token (> 1h)
3. Automatycznie używa refresh_token do pobrania nowego
4. Callback `setAll()` ustawia nowe cookies
5. Użytkownik nie zauważa procesu

**Refresh Token Rotation:**
- Access token: 1 godzina (krótkoterminowy)
- Refresh token: 30 dni (długoterminowy)
- Opcjonalnie: nowy refresh token przy odświeżaniu (increased security)

### 4. Zapobieganie Enumeracji Kont

**Komunikaty błędów:**
- Login error: "Nieprawidłowy email lub hasło" (nie rozróżnia który błędny)
- 404 zamiast 403 - nie ujawnia istnienia zasobów
- Generyczne komunikaty - brak szczegółów technicznych

---

## Konfiguracja Wymagana dla MVP

### Supabase Dashboard Settings

**Authentication → Settings:**
```
✅ Enable email confirmations: OFF (WYMAGANE dla MVP)
   - US-001 wymaga automatycznego logowania po rejestracji
   - Email confirmation blokowałaby ten przepływ

✅ Enable signup: ON

✅ Site URL: https://<domain>

✅ Redirect URLs:
   - https://<domain>/
   - http://localhost:4321/ (development)
```

### Zmienne Środowiskowe

**Server-side:**
```bash
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<anon-key>
```

**Client-side:**
```bash
PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
PUBLIC_SUPABASE_KEY=<anon-key>
```

---

## Przyszłe Rozszerzenia (POZA ZAKRESEM MVP)

### HTTP Interceptor dla Refresh Tokenów (API Routes)

**Obecne zachowanie (MVP):**
- API route zwraca 401 Unauthorized przy wygasłym tokenie
- Frontend wylogowuje użytkownika (acceptable dla MVP)

**Przyszłe rozszerzenie:**
```typescript
// Przykładowa implementacja interceptora
fetch(url, { headers })
  .then(response => {
    if (response.status === 401) {
      // Automatyczne odświeżenie tokenu
      return refreshToken().then(newToken => {
        // Ponów request z nowym tokenem
        return fetch(url, { 
          headers: { ...headers, Authorization: `Bearer ${newToken}` }
        });
      });
    }
    return response;
  });
```

**Zalety:**
- Brak przerwy w sesji użytkownika
- Transparentne odświeżanie tokenów dla API calls
- Lepsze UX (użytkownik nie musi ponownie się logować)

---

**Data utworzenia:** 2026-01-29  
**Status:** Zgodne z PRD (US-001, US-002, US-003)  
**Architektura:** Astro 5 SSR + React 19 + Supabase Auth + PostgreSQL RLS
