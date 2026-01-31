# Test Plan — Subbase MVP

## Meta

**Projekt:** Subbase (subscription tracking app)  
**Wersja test planu:** 1.0  
**Ostatnia aktualizacja:** 2026-01-30  
**Status projektu:** Feature branch `feature/supabase-auth` — implementacja MVP w toku

---

## 1. Cel testów

### 1.1 Co zabezpieczamy

Ten test plan zabezpiecza **4 krytyczne warstwy aplikacji**:

1. **Autentykacja i autoryzacja** — zapobieganie nieuprawnionemu dostępowi i data leakage
2. **Integralność danych finansowych** — poprawność kalkulacji kosztów subskrypcji
3. **Izolację użytkowników** — każdy user widzi tylko swoje dane (RLS)
4. **Odporność na awarie zewnętrzne** — graceful degradation gdy AI service jest niedostępny

### 1.2 Dlaczego to robimy

**Główne ryzyka biznesowe i techniczne:**

| Ryzyko | Konsekwencja | Priorytet |
|--------|--------------|-----------|
| Data leakage między użytkownikami | Naruszenie prywatności, utrata zaufania | **CRITICAL** |
| Błędne kalkulacje finansowe | Utrata zaufania do danych | **HIGH** |
| Broken auth flow (middleware routing) | Użytkownicy zablokowani lub niezabezpieczeni | **CRITICAL** |
| AI service failures blokują UI | Aplikacja niezdatna do użytku | **HIGH** |
| Brak walidacji inputów | Injection attacks, corrupt data | **HIGH** |
| Edge cases w датах i kosztach | Unexpected behavior, crashes | **MEDIUM** |

### 1.3 Założenia kontekstowe

- **Solo developer / mały zespół** — nie mamy dedykowanego QA
- **AI-assisted development** — AI pomaga w implementacji, ale też może wprowadzać błędy
- **MVP timeline** — priorytet: stabilność core features nad coverage 100%
- **Real users** — to nie jest proof-of-concept, projekt będzie użytkowany

---

## 2. Zakres testów

### 2.1 Co Jest Objęte Testami (IN SCOPE)

#### ✅ Warstwa Autentykacji i Autoryzacji
- Rejestracja nowego użytkownika (email + password)
- Login z poprawnymi i błędnymi credentials
- Automatyczne redirecty (authenticated → `/`, unauthenticated → `/login`)
- Middleware routing dla Astro pages (cookies) vs API routes (JWT Bearer)
- Logout i session termination
- RLS policies enforcement (izolacja danych między userami)
- User enumeration prevention (identyczne error messages)

#### ✅ Warstwa API (REST Endpoints)
- `GET /api/subscriptions` — listing z pagination, filtering
- `POST /api/subscriptions` — tworzenie z walidacją
- `GET /api/subscriptions/:id` — pobieranie pojedynczej
- `PATCH /api/subscriptions/:id` — partial update
- `DELETE /api/subscriptions/:id` — usuwanie
- `GET /api/subscriptions/summary` — kalkulacje monthly/yearly totals
- `POST /api/ai/insights` — generowanie AI insights z fail-safe

#### ✅ Warstwa Logiki Biznesowej
- Kalkulacje kosztów (monthly → yearly, yearly → monthly)
- Status counters (active/paused/cancelled)
- Walidacja Zod schemas (all input validation)
- Date relationship validation (`next_billing_date >= start_date`)
- Cost constraints (> 0, <= 100000, max 2 decimals)
- User_id assignment (server-side, never from client)

#### ✅ Warstwa Bazy Danych
- RLS policies na `profiles` i `subscriptions`
- Trigger `handle_new_user()` — auto profile creation
- Trigger `update_updated_at_column()` — timestamp updates
- CASCADE delete behavior (`auth.users` → `profiles` → `subscriptions`)
- DB constraints (CHECK, UNIQUE, NOT NULL, FOREIGN KEY)

#### ✅ Warstwa Integracji Zewnętrznej
- OpenRouter API communication
- Retry logic (rate limiting, timeouts, 5xx errors)
- Response validation (Zod schema)
- Graceful degradation (503 errors nie blokują UI)

#### ✅ Kluczowe Scenariusze UI
- Registration → auto login → redirect to dashboard
- Login → redirect to dashboard
- Dashboard: lista subskrypcji + summary + AI insights trigger
- Subscription CRUD operations z validation errors w UI
- Loading states i error handling

### 2.2 Co Jest Poza Zakresem (OUT OF SCOPE)

#### ❌ Features Nie w MVP
- Notifications / reminders
- Historical analytics / charts
- Multi-currency conversion
- Tags / filters / search advanced
- Shared accounts / multi-user
- Mobile app / offline support
- i18n (wszystko hardcoded w PL)

#### ❌ Non-Functional Testing (MVP Phase)
- **Performance testing** — nie testujemy skalowania (MVP = single user scenarios)
- **Load testing** — nie ma ruchu produkcyjnego
- **Security penetration testing** — założenie: Supabase + RLS = bezpieczeństwo (weryfikujemy tylko RLS policies)
- **Accessibility (a11y)** — explicit non-goal w PRD
- **Cross-browser compatibility** — zakładamy modern browsers (Chrome, Firefox, Edge, Safari latest)
- **SEO** — explicit non-goal w PRD

#### ❌ Infrastructure i DevOps
- CI/CD pipeline testing — brak CI w repo
- Deployment testing — Digital Ocean setup out of scope
- Monitoring i alerting — brak toolingu
- Backup/restore procedures — Supabase managed

#### ❌ Edge Cases Niskiego Priorytetu
- Locale/timezone edge cases (UTC → local time)
- Leap year / DST handling
- Bardzo duża liczba subscriptions (>1000)
- Concurrent updates (optimistic locking)
- Browser-specific bugs (IE, old Safari)

---

## 3. Strategia Testowa

### 3.1 Filozofia

> **"Test what can break, not what can't."**

MVP testing strategy dla solo developer + AI:

1. **Manual Exploratory Testing** — główna forma testowania dla MVP
2. **Automated Critical Path Tests** — tylko dla highest-risk scenarios
3. **Contract Testing** — Zod schemas jako "living contracts"
4. **Database Testing** — verify RLS policies ręcznie w Supabase Studio

### 3.2 Test Pyramid dla Subbase MVP

```
         ╱╲
        ╱  ╲     E2E: 5-8 tests (critical paths only)
       ╱────╲
      ╱      ╲   Integration: 15-20 tests (API endpoints + DB)
     ╱────────╲
    ╱          ╲ Unit: 20-30 tests (business logic, calculations, validation)
   ╱────────────╲
```

**Uzasadnienie:**
- **Unit tests** (40%) — szybkie, izolowane, catch logic bugs
- **Integration tests** (40%) — API + DB, verify RLS, real Supabase interaction
- **E2E tests** (20%) — tylko critical user journeys

**Anti-pattern do uniknięcia:**
- ❌ Testowanie UI w izolacji (bez real backend)
- ❌ 100% coverage target (diminishing returns)
- ❌ Testy które duplikują Zod validation
- ❌ E2E testy dla każdego edge case

---

## 4. Priorytety Testowe (MoSCoW)

### 4.1 MUST HAVE (P0 — MVP Blocker)

**Bez tych testów nie deployujemy.**

| ID | Test Area | Files/Modules | Rationale |
|----|-----------|---------------|-----------|
| **M-01** | User registration + auto profile creation | `src/middleware/index.ts`, `supabase/migrations/*.sql` | Broken auth = broken app |
| **M-02** | Login + redirect flow | `src/middleware/index.ts`, `src/pages/login.astro` | Core functionality |
| **M-03** | RLS policies enforcement (data isolation) | `supabase/migrations/*.sql` | Data leakage = critical security issue |
| **M-04** | Monthly/yearly cost calculation | `src/lib/services/summary.service.ts` | Wrong numbers = zero trust |
| **M-05** | Subscription CRUD with validation | `src/pages/api/subscriptions/*`, `src/lib/schemas/subscription.schema.ts` | Core CRUD operations |
| **M-06** | AI service graceful degradation (503) | `src/lib/openrouter.service.ts`, `src/pages/api/ai/insights.ts` | AI downtime must NOT block app |
| **M-07** | Middleware routing (cookies vs JWT) | `src/middleware/index.ts` | Auth foundation |
| **M-08** | Server-side user_id assignment | `src/lib/services/subscription.service.ts` | Prevent user impersonation |

### 4.2 SHOULD HAVE (P1 — Important but not blocker)

**Testujemy po M-tests, przed deploymentem.**

| ID | Test Area | Files/Modules | Rationale |
|----|-----------|---------------|-----------|
| **S-01** | Pagination edge cases (page=0, limit=1000) | `src/pages/api/subscriptions/index.ts` | Common user frustration |
| **S-02** | Invalid UUID handling | All API `[id].ts` endpoints | Prevents 500 errors |
| **S-03** | Date validation (start_date > next_billing_date) | `src/lib/schemas/subscription.schema.ts` | Data integrity |
| **S-04** | Cost validation (negative, zero, >100000) | `src/lib/schemas/subscription.schema.ts` | Financial integrity |
| **S-05** | AI retry logic (rate limiting, timeouts) | `src/lib/openrouter.service.ts` | Resilience |
| **S-06** | Logout + session termination | `src/components/dashboard/TopBar.tsx`, Supabase Auth | Session security |
| **S-07** | Empty states (no subscriptions) | `src/lib/services/summary.service.ts` | UX |
| **S-08** | Status counters correctness | `src/lib/services/summary.service.ts` | Trust in summary data |

### 4.3 COULD HAVE (P2 — Nice to have)

**Testujemy jeśli mamy czas przed deploymentem.**

| ID | Test Area | Files/Modules | Rationale |
|----|-----------|---------------|-----------|
| **C-01** | Form field preservation on tab switch | `src/components/auth/AuthTabs.tsx` | UX improvement |
| **C-02** | Delete confirmation dialog | `src/components/dashboard/DeleteConfirmDialog.tsx` | Prevent accidental deletion |
| **C-03** | Loading skeletons display | `src/components/dashboard/SubscriptionList.tsx` | UX polish |
| **C-04** | Network error messages (Polish) | All API clients | UX |
| **C-05** | PATCH partial update (only changed fields) | `src/lib/services/subscription.service.ts` | Edge case |
| **C-06** | AI insights content validation (Polish, observations) | `src/lib/ai/prompts/*.ts` | Quality assurance |
| **C-07** | Browser back/forward after auth | Middleware + browser history | UX edge case |

### 4.4 WON'T HAVE (Out of MVP Scope)

- Multi-currency conversion
- Historical data / audit log
- Advanced filtering / search
- Email verification
- Password reset flow
- Social login
- Mobile responsiveness on all devices
- Dark mode toggle functionality

---

## 5. Kluczowe Scenariusze Testowe (High-Value)

### 5.1 Authentication & Authorization

#### TC-AUTH-001: Happy Path Registration + Auto Login
**Priority:** MUST HAVE (P0)

**Preconditions:**
- Supabase local dev running
- User does NOT exist in `auth.users`

**Steps:**
1. Navigate to `/login`
2. Switch to "Register" tab
3. Fill form: `test@example.com`, password `Test123!`, confirm password
4. Click "Register"

**Expected:**
- ✅ User created in `auth.users`
- ✅ Profile created in `profiles` (via trigger `handle_new_user()`)
- ✅ User auto-logged in (session cookie set)
- ✅ Redirect to `/` (dashboard)
- ✅ No console errors

**Failure Modes:**
- Trigger fails → no profile → RLS blocks subscriptions
- Session not established → redirect loop
- Error message shown instead of redirect

---

#### TC-AUTH-002: Login with Invalid Credentials
**Priority:** MUST HAVE (P0)

**Preconditions:**
- User exists: `test@example.com` / `password123`

**Steps:**
1. Navigate to `/login`
2. Enter: `test@example.com` / `wrongpassword`
3. Click "Login"

**Expected:**
- ✅ Error message in Polish: "Nieprawidłowy email lub hasło"
- ✅ NO distinction between wrong email vs wrong password (prevent user enumeration)
- ✅ User remains on `/login`
- ✅ Form fields NOT cleared

**Failure Modes:**
- Specific error reveals which field is wrong
- User enumeration attack possible
- No error message displayed

---

#### TC-AUTH-003: Middleware Redirect — Authenticated User Accessing /login
**Priority:** MUST HAVE (P0)

**Preconditions:**
- User logged in (valid session cookie)

**Steps:**
1. Manually navigate to `/login`

**Expected:**
- ✅ Immediate redirect to `/` (dashboard)
- ✅ No flash of login page content (FOUC)

**Failure Modes:**
- User sees login page (middleware not working)
- Redirect loop
- 401 error

---

#### TC-AUTH-004: Middleware Redirect — Unauthenticated User Accessing Dashboard
**Priority:** MUST HAVE (P0)

**Preconditions:**
- No active session (not logged in)

**Steps:**
1. Navigate to `/`

**Expected:**
- ✅ Immediate redirect to `/login`
- ✅ No flash of dashboard content

**Failure Modes:**
- Dashboard loads with errors
- No redirect (security breach)
- 500 error

---

#### TC-AUTH-005: API Route with Missing Bearer Token
**Priority:** MUST HAVE (P0)

**Preconditions:**
- User not authenticated

**Steps:**
1. Send `GET /api/subscriptions` without `Authorization` header

**Expected:**
- ✅ HTTP 401 Unauthorized
- ✅ Error body: `{ "error": { "code": "UNAUTHORIZED", "message": "Authentication required" } }`

**Failure Modes:**
- 500 error instead of 401
- Request succeeds (security breach)
- No error body

---

### 5.2 Data Isolation (RLS Policies)

#### TC-RLS-001: User Cannot Read Other User's Subscriptions
**Priority:** MUST HAVE (P0) — **CRITICAL SECURITY TEST**

**Preconditions:**
- User A logged in with valid token
- User B has subscriptions in DB

**Steps:**
1. User A sends: `GET /api/subscriptions/:user_b_subscription_id`

**Expected:**
- ✅ HTTP 404 Not Found (NOT 403 — prevents resource existence enumeration)
- ✅ DB query returns empty result (RLS blocked)
- ✅ No data leakage in response

**Failure Modes:**
- User A sees User B's data (CRITICAL BUG)
- 403 reveals resource exists
- RLS policy not enforced

**Manual Verification:**
```sql
-- Run as User A in Supabase Studio
SELECT * FROM subscriptions WHERE user_id = '<user_b_id>';
-- Should return 0 rows
```

---

#### TC-RLS-002: User Cannot Create Subscription for Another User
**Priority:** MUST HAVE (P0)

**Preconditions:**
- User A logged in with valid token

**Steps:**
1. User A sends: `POST /api/subscriptions` with body containing `user_id: '<user_b_id>'`

**Expected:**
- ✅ Server-side logic ignores `user_id` from request body
- ✅ Subscription created with `user_id = auth.uid()` (User A)
- ✅ HTTP 201 Created with User A's `user_id`

**OR if client somehow manipulates `user_id` in DB call:**
- ✅ RLS WITH CHECK policy blocks INSERT
- ✅ HTTP 500 or 400 error

**Failure Modes:**
- Subscription created for User B (CRITICAL BUG)
- Server accepts `user_id` from client

---

### 5.3 Financial Calculations

#### TC-CALC-001: Monthly/Yearly Totals with Mixed Billing Cycles
**Priority:** MUST HAVE (P0)

**Preconditions:**
- User has subscriptions:
  - Netflix: 43.00 PLN, monthly, active
  - Spotify: 19.99 PLN, monthly, active
  - Adobe: 239.88 PLN, yearly, active
  - Gym: 89.00 PLN, monthly, paused

**Steps:**
1. Send: `GET /api/subscriptions/summary`

**Expected:**
- ✅ `monthly_total = 43.00 + 19.99 + (239.88 / 12) = 82.99` (paused excluded)
- ✅ `yearly_total = (43.00 * 12) + (19.99 * 12) + 239.88 = 995.76`
- ✅ `active_count = 3`
- ✅ `paused_count = 1`
- ✅ Rounded to 2 decimal places

**Failure Modes:**
- Floating-point precision errors
- Paused/cancelled included in totals
- Wrong rounding
- Division by zero if no subscriptions

**Unit Test (High Priority):**
```typescript
// src/lib/services/summary.service.test.ts
describe('SummaryService.calculate', () => {
  it('calculates monthly/yearly totals correctly', () => {
    // Test with fixture data
  });
});
```

---

#### TC-CALC-002: Summary with Zero Subscriptions
**Priority:** SHOULD HAVE (P1)

**Preconditions:**
- User has NO subscriptions

**Steps:**
1. Send: `GET /api/subscriptions/summary`

**Expected:**
- ✅ HTTP 200 OK
- ✅ `monthly_total = 0.00`
- ✅ `yearly_total = 0.00`
- ✅ `active_count = 0`, `paused_count = 0`, `cancelled_count = 0`
- ✅ `currency = "PLN"` (default)

**Failure Modes:**
- Division by zero error
- Null pointer exception
- 500 error

---

### 5.4 CRUD Operations with Validation

#### TC-CRUD-001: Create Subscription with Invalid Cost
**Priority:** SHOULD HAVE (P1)

**Preconditions:**
- User logged in

**Test Cases:**

| Input Cost | Expected HTTP | Expected Error |
|------------|---------------|----------------|
| `-10` | 400 | "Cost must be greater than 0" |
| `0` | 400 | "Cost must be greater than 0" |
| `100001` | 400 | "Cost cannot exceed 100000" |
| `12.345` | 400 | "Cost can have at most 2 decimal places" |
| `"abc"` | 400 | "Cost is required" (type coercion fails) |

**Expected:**
- ✅ HTTP 400 Bad Request
- ✅ `details` array with `field` and `message`
- ✅ NO database record created

**Failure Modes:**
- Validation bypassed
- Record created with invalid data
- 500 error instead of 400

---

#### TC-CRUD-002: Create Subscription with Invalid Date Relationship
**Priority:** SHOULD HAVE (P1)

**Preconditions:**
- User logged in

**Steps:**
1. Send: `POST /api/subscriptions` with:
   - `start_date: "2025-01-15"`
   - `next_billing_date: "2025-01-01"` (BEFORE start_date)

**Expected:**
- ✅ HTTP 400 Bad Request
- ✅ Error: `"Next billing date must be on or after start date"`
- ✅ Field: `next_billing_date`

**Failure Modes:**
- Validation not enforced
- Subscription created with invalid dates

---

#### TC-CRUD-003: PATCH Subscription — Partial Update (Only Status)
**Priority:** COULD HAVE (P2)

**Preconditions:**
- User has subscription ID `abc-123` with status `active`

**Steps:**
1. Send: `PATCH /api/subscriptions/abc-123` with body: `{ "status": "cancelled" }`

**Expected:**
- ✅ HTTP 200 OK
- ✅ Only `status` and `updated_at` fields changed
- ✅ All other fields unchanged (name, cost, etc.)

**Failure Modes:**
- All fields reset to defaults
- Other fields nulled
- Full update triggered instead of PATCH

---

### 5.5 AI Service Integration

#### TC-AI-001: Generate Insights with Active Subscriptions
**Priority:** MUST HAVE (P0)

**Preconditions:**
- User has 3+ active subscriptions
- OpenRouter API key configured
- AI service reachable

**Steps:**
1. Send: `POST /api/ai/insights` (empty body → all active subscriptions)

**Expected:**
- ✅ HTTP 200 OK
- ✅ Response contains 2-4 insights (per prompt spec)
- ✅ Each insight: `{ "type": "observation", "message": "<Polish text>" }`
- ✅ `generated_at` ISO 8601 timestamp
- ✅ `subscription_count` matches active subscriptions
- ✅ Response time < 30 seconds

**Failure Modes:**
- Timeout (no retry)
- Empty insights array
- Non-Polish language
- Prescriptive recommendations (violates PRD constraints)

---

#### TC-AI-002: AI Service Unavailable (503 Graceful Degradation)
**Priority:** MUST HAVE (P0) — **CRITICAL RESILIENCE TEST**

**Preconditions:**
- OpenRouter API returns 503 or timeout

**Steps:**
1. Mock OpenRouter API to return 503 Service Unavailable
2. Send: `POST /api/ai/insights`

**Expected:**
- ✅ HTTP 503 Service Unavailable
- ✅ Error: `{ "error": { "code": "AI_SERVICE_UNAVAILABLE", "message": "AI service is temporarily unavailable" } }`
- ✅ Dashboard remains functional (user can still CRUD subscriptions)
- ✅ Frontend displays Polish message: "Wnioski AI są tymczasowo niedostępne. Spróbuj ponownie później."

**Failure Modes:**
- 500 error instead of 503
- Frontend crashes
- Retry loop blocks UI
- No user-facing error message

**Manual Test:**
```bash
# Temporarily break API key
OPENROUTER_API_KEY=invalid npm run dev
```

---

#### TC-AI-003: AI Retry Logic on Rate Limiting (429)
**Priority:** SHOULD HAVE (P1)

**Preconditions:**
- OpenRouter API returns 429 with `Retry-After: 2` header

**Steps:**
1. Send: `POST /api/ai/insights`

**Expected:**
- ✅ First request → 429
- ✅ Wait 2 seconds (from `Retry-After` header)
- ✅ Automatic retry (attempt 2)
- ✅ Eventually succeeds or fails gracefully after 3 attempts

**Failure Modes:**
- No retry
- Immediate failure
- Infinite retry loop

---

### 5.6 End-to-End User Journeys

#### TC-E2E-001: Complete User Journey — Registration to AI Insights
**Priority:** MUST HAVE (P0)

**Flow:**
1. Register new user
2. Auto-redirect to dashboard (empty state)
3. Create 2 subscriptions (Netflix, Spotify)
4. View summary (monthly/yearly totals)
5. Trigger AI insights
6. Logout

**Expected:**
- ✅ No errors at any step
- ✅ Data persists between steps
- ✅ Totals calculated correctly
- ✅ AI insights display in Polish
- ✅ After logout → cannot access dashboard

**Tooling:** Manual testing OR Playwright (if automated)

---

## 6. Ryzyka i Ograniczenia

### 6.1 Ryzyka Techniczne

| Ryzyko | Prawdopodobieństwo | Impact | Mitigation |
|--------|-------------------|--------|------------|
| **RLS policy misconfiguration** | Medium | CRITICAL | M-03: Mandatory manual testing w Supabase Studio |
| **Middleware routing bug (cookies vs JWT)** | Medium | HIGH | M-07: Test both Astro pages i API routes |
| **Floating-point calculation errors** | Low | HIGH | M-04: Use NUMERIC in DB, round to 2 decimals |
| **AI service long-term outage** | Medium | MEDIUM | M-06: Graceful degradation tested |
| **Zod schema vs DB schema drift** | Low | MEDIUM | Keep `types.ts` and schemas in sync |
| **Middleware redirect loop** | Low | HIGH | M-02, M-03: Test authenticated/unauthenticated states |
| **User_id injection attack** | Low | CRITICAL | M-08: Server-side assignment + RLS |

### 6.2 Ryzyka Produktowe

| Ryzyko | Mitigation |
|--------|------------|
| **Users trust wrong financial data** | M-04: Extensive calculation testing |
| **AI generates inappropriate recommendations** | S-06: Content validation (observations only, no advice) |
| **Users lose data on browser crash** | Accept: No local storage/cache in MVP |
| **Poor UX on slow networks** | Accept: No offline support in MVP |

### 6.3 Ograniczenia Test Planu

**Czego NIE obejmuje ten plan:**

1. **Automated E2E coverage** — tylko 5-8 critical paths, reszta manual
2. **Performance baselines** — nie mamy SLA ani benchmark targets
3. **Security penetration testing** — assumujemy Supabase security best practices
4. **Browser compatibility** — tylko latest Chrome/Firefox/Safari
5. **Mobile testing** — explicit non-goal w PRD
6. **Accessibility testing** — explicit non-goal w PRD
7. **Internationalization** — hardcoded Polish, no i18n
8. **Regression suite** — przy zmianach trzeba będzie ręcznie przetestować impacted areas

---

## 7. Rekomendacje Narzędziowe

### 7.1 Co Dodać Teraz (MVP — Immediate)

#### ✅ Priority 1: Unit Testing Framework

**Rekomendacja:** **Vitest** (native support w Vite/Astro ecosystem)

```bash
npm install -D vitest @vitest/ui
```

**Dlaczego:**
- Fastest test runner (Vite-based)
- Zero config dla TypeScript + Astro
- Watch mode out of the box
- Compatible z Jest API (easy migration)

**Scope testów:**
- `src/lib/services/summary.service.ts` — financial calculations
- `src/lib/services/subscription.service.ts` — business logic
- `src/lib/errors.ts` — error factories
- `src/lib/schemas/*.ts` — Zod validation edge cases

**Przykład:**
```typescript
// src/lib/services/summary.service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { SummaryService } from './summary.service';

describe('SummaryService.calculate', () => {
  it('calculates monthly total for mixed billing cycles', async () => {
    // Mock Supabase client
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { cost: 43, billing_cycle: 'monthly', status: 'active', currency: 'PLN' },
              { cost: 239.88, billing_cycle: 'yearly', status: 'active', currency: 'PLN' },
            ],
            error: null,
          }),
        }),
      }),
    };

    const result = await SummaryService.calculate(mockSupabase, 'user-123');
    
    expect(result.data.monthly_total).toBe(62.99); // 43 + (239.88 / 12)
    expect(result.data.yearly_total).toBe(755.88); // (43 * 12) + 239.88
  });
});
```

---

#### ✅ Priority 2: Integration Testing (API + Supabase)

**Rekomendacja:** **Vitest** + **Supabase Local Dev** + **Database Reset Script**

**Setup:**
```bash
# Use Supabase local dev
npm run db:start

# Before each test suite, reset database to clean state
npm run db:reset
```

**Dlaczego:**
- Real database interactions (catch RLS bugs)
- Test migrations in realistic environment
- No complex mocking of Supabase client
- Supabase local dev provides isolated test environment

**Uwaga:** Nie używaj nieistniejącego "Supabase Test Helpers" package. Zamiast tego:
- Używaj `supabase db reset` dla clean state przed testami
- Twórz seed scripts w `supabase/seed.sql` dla powtarzalnych test data
- Używaj real Supabase client w testach

**Scope testów:**
- All API endpoints (`src/pages/api/**/*.ts`)
- RLS policies (via real DB queries)
- Trigger behavior (`handle_new_user()`)

**Przykład:**
```typescript
// src/pages/api/subscriptions/index.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';

describe('POST /api/subscriptions', () => {
  let supabase;
  let authToken;
  let userId;

  beforeAll(async () => {
    // Reset database to clean state
    execSync('npm run db:reset', { stdio: 'inherit' });
    
    // Setup test user
    supabase = createClient(
      process.env.PUBLIC_SUPABASE_URL!,
      process.env.PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
    });
    authToken = data.session!.access_token;
    userId = data.user!.id;
  });

  it('creates subscription with valid data', async () => {
    const response = await fetch('http://localhost:4321/api/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Netflix',
        cost: 43.00,
        billing_cycle: 'monthly',
        start_date: '2025-01-15',
      }),
    });

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.name).toBe('Netflix');
    expect(body.data.user_id).toBe(userId); // Verify server-side assignment
  });

  afterAll(async () => {
    // Cleanup: delete test user (CASCADE will delete subscriptions)
    await supabase.auth.admin.deleteUser(userId);
  });
});
```

---

#### ✅ Priority 3: Manual Testing Checklist

**Rekomendacja:** Markdown checklist w `.ai/test-checklist.md`

**Dlaczego:**
- Solo developer = no QA team
- Fast iteration
- Easy to track coverage

**Template:**
```markdown
# Manual Test Checklist — Pre-Deployment

## Authentication
- [ ] Register new user → profile created
- [ ] Login with correct password
- [ ] Login with wrong password → error message
- [ ] Logout → session cleared
- [ ] Authenticated user → `/login` redirects to `/`
- [ ] Unauthenticated user → `/` redirects to `/login`

## Subscriptions CRUD
- [ ] Create subscription with valid data
- [ ] Create subscription with invalid cost → validation error
- [ ] ...
```

#### ✅ Priority 3: React Component Testing

**Rekomendacja:** **@testing-library/react** + **@testing-library/user-event**

```bash
npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

**Dlaczego:**
- Test form validation w React components
- Test user interactions (click, type, submit)
- Test error states i loading states
- Best practices dla React testing (nie testować implementation details)

**Scope testów:**
- `src/components/auth/LoginForm.tsx` — validation, error messages
- `src/components/auth/RegisterForm.tsx` — password confirmation, email format
- `src/components/dashboard/SubscriptionForm.tsx` — cost validation, date validation
- `src/components/dashboard/DeleteConfirmDialog.tsx` — user confirmation flow

**Przykład:**
```typescript
// src/components/auth/LoginForm.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('displays validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // trigger blur
    
    expect(screen.getByText(/nieprawidłowy format/i)).toBeInTheDocument();
  });

  it('disables submit button during submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /zaloguj/i });
    await user.click(submitButton);
    
    expect(submitButton).toBeDisabled();
  });
});
```

---

#### ✅ Priority 4: Test Data Generation

**Rekomendacja:** **@faker-js/faker**

```bash
npm install -D @faker-js/faker
```

**Dlaczego:**
- Generowanie randomowych, realistycznych test data
- Unikanie hardcoded fixtures (łatwiej złapać edge cases)
- Reusable factories dla różnych test scenarios

**Przykład:**
```typescript
// test/factories/subscription.factory.ts
import { faker } from '@faker-js/faker';
import type { Subscription } from '@/types';

export const createSubscription = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: faker.string.uuid(),
  user_id: faker.string.uuid(),
  name: faker.company.name(),
  cost: parseFloat(faker.finance.amount({ min: 5, max: 500, dec: 2 })),
  currency: 'PLN',
  billing_cycle: faker.helpers.arrayElement(['monthly', 'yearly']),
  status: 'active',
  start_date: faker.date.past().toISOString().split('T')[0],
  next_billing_date: faker.date.future().toISOString().split('T')[0],
  description: faker.lorem.sentence(),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

// Usage:
const testSubscription = createSubscription({ cost: 43.00, name: 'Netflix' });
```

---

### 7.2 Co Odłożyć (Post-MVP)

#### 🔜 E2E Testing Framework

**Rekomendacja:** **Playwright** (gdy mamy CI/CD)

**Dlaczego odłożyć:**
- Setup cost high (Docker, CI integration)
- Manual testing wystarczy dla MVP
- Maintenance burden dla solo developer

**Kiedy dodać:**
- Po deploymencie MVP
- Gdy mamy 5+ critical user flows
- Gdy wprowadzamy breaking changes często

---

#### 🔜 API Mocking dla Frontend Tests

**Rekomendacja:** **MSW (Mock Service Worker)** (post-MVP)

```bash
npm install -D msw
```

**Dlaczego odłożyć:**
- MVP focus na backend testing (API + DB)
- React Testing Library + real API calls wystarczy początkowo
- MSW dodaje complexity do test setup

**Kiedy dodać:**
- Gdy chcesz testować frontend w pełnej izolacji od backend
- Gdy testowanie network errors i loading states staje się krytyczne
- Gdy masz dużo frontend integration tests

**Przykład (future):**
```typescript
// src/components/dashboard/SubscriptionList.test.tsx
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/subscriptions', () => {
    return HttpResponse.json({
      data: [{ id: '1', name: 'Netflix', cost: 43 }],
    });
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());
```

---

#### 🔜 Visual Regression Testing

**Rekomendacja:** **Playwright Screenshots** (post-MVP, NIE Percy/Chromatic)

**Dlaczego odłożyć:**
- UI nie jest polished w MVP (explicit non-goal)
- Percy/Chromatic są zbyt drogie dla solo developer
- Manual visual QA wystarczy dla MVP

**Kiedy dodać:**
- Po stabilizacji UI design
- Użyj Playwright built-in screenshot comparison (FREE):

```typescript
// tests/visual/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test('dashboard visual regression', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('dashboard.png');
});
```

**Dlaczego NIE Percy/Chromatic:**
- Koszt: $149-$329/month (za dużo dla MVP)
- Playwright screenshots są darmowe i wystarczające

---

#### 🔜 API Contract Testing

**Rekomendacja:** **NIE UŻYWAJ Pact ani OpenAPI + Prism**

**Dlaczego odłożyć (lub nie dodawać wcale):**
- Monolityczna aplikacja (frontend + backend w jednym repo)
- Zod schemas są wystarczającym "living contract"
- Pact/OpenAPI to over-engineering dla MVP

**Zamiast tego (TERAZ):**
- Używaj Zod schemas w backend i frontend
- Type-safety via TypeScript inference
- Validation errors są automatycznie zgodne

**Jeśli NAPRAWDĘ potrzebujesz dokumentacji API (post-MVP):**
```bash
npm install -D zod-to-openapi
```

```typescript
// Auto-generate OpenAPI spec from Zod schemas
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

const registry = new OpenAPIRegistry();
registry.registerPath({
  method: 'post',
  path: '/api/subscriptions',
  request: { body: { content: { 'application/json': { schema: CreateSubscriptionSchema } } } },
  // ...
});
```

---

### 7.3 Minimalny Sensowny Setup Testowy (MVP)

**TL;DR — Co dodać TERAZ:**

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  },
  "devDependencies": {
    // Test runners
    "vitest": "^2.1.0",
    "@vitest/ui": "^2.1.0",
    "@vitest/coverage-v8": "^2.1.0",
    
    // React testing
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@testing-library/jest-dom": "^6.6.3",
    
    // Test data
    "@faker-js/faker": "^9.2.0",
    
    // Optional (post-MVP)
    // "msw": "^2.7.0",
    // "@playwright/test": "^1.49.0"
  }
}
```

**Vitest Config (dodaj plik):**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Test Setup File:**
```typescript
// test/setup.ts
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

**Coverage target:** 60-70% dla critical paths (NOT 100%)

**Focus areas (w kolejności priorytetu):**
1. `src/lib/services/summary.service.ts` — calculations (MUST HAVE)
2. `src/lib/services/subscription.service.ts` — business logic (MUST HAVE)
3. `src/components/auth/LoginForm.tsx` — form validation (MUST HAVE)
4. `src/components/auth/RegisterForm.tsx` — password confirmation (MUST HAVE)
5. `src/pages/api/**/*.ts` — API endpoints integration tests (SHOULD HAVE)
6. `src/lib/schemas/*.ts` — Zod validation edge cases (SHOULD HAVE)
7. `src/components/dashboard/SubscriptionForm.tsx` — CRUD validation (COULD HAVE)

**NOT covered by automation (MVP):**
- E2E flows (manual testing with checklist)
- RLS policies (manual verification w Supabase Studio)
- Visual regression (manual QA)
- Performance testing

---

## 8. Execution Plan (Jak zacząć?)

### Phase 1: Foundations (Day 1-2)

1. **Setup testing infrastructure** (2h)
   ```bash
   npm install -D vitest @vitest/ui @vitest/coverage-v8
   npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
   npm install -D @faker-js/faker
   ```
   - Create `vitest.config.ts`
   - Create `test/setup.ts`
   - Create `test/factories/` directory
   
2. **Write first 5 unit tests** (3h)
   - `summary.service.test.ts` — monthly/yearly calculations (M-04)
   - `subscription.schema.test.ts` — cost validation edge cases (S-03, S-04)
   - Run: `npm run test:watch`

3. **Manual testing session** (2h)
   - Run through TC-AUTH-001 to TC-AUTH-005
   - Document bugs in GitHub Issues

### Phase 2: Critical Path Coverage (Day 3-5)

4. **Write React component tests** (4h)
   - `LoginForm.test.tsx` — email validation, error messages
   - `RegisterForm.test.tsx` — password confirmation
   - `SubscriptionForm.test.tsx` — cost/date validation
   - Use `@faker-js/faker` for test data

5. **Write integration tests dla API** (5h)
   - Setup: `npm run db:reset` before tests
   - API endpoints: POST, GET, PATCH, DELETE
   - Summary endpoint with mixed billing cycles
   - AI insights endpoint (mock OpenRouter or test real API)

6. **Manual RLS testing** (2h)
   - TC-RLS-001, TC-RLS-002
   - Verify policies w Supabase Studio
   - Document SQL queries used for verification

### Phase 3: Pre-Deployment QA (Day 6-7)

7. **Full manual test pass** (4h)
   - Run all MUST HAVE test cases (M-01 to M-08)
   - Run all SHOULD HAVE test cases (S-01 to S-08)
   - Log bugs → fix → retest
   - Update test-checklist.md with results

8. **Coverage analysis** (1h)
   ```bash
   npm run test:coverage
   ```
   - Review coverage report
   - Identify untested critical paths
   - Add tests for gaps in P0/P1 areas

9. **Code review dla test suite** (1h)
   - AI review: "Are we testing the right things?"
   - Check for: flaky tests, slow tests, unclear test names

10. **Deploy decision** (Go/No-Go)
    - All M-tests passing? ✅
    - Zero critical bugs? ✅
    - RLS verified manually? ✅
    - Coverage > 60% for critical paths? ✅

---

## 9. Success Metrics

**Jak mierzymy, że testowanie działa?**

### MVP Readiness Criteria

✅ **All P0 (MUST HAVE) tests passing:**
- [x] M-01 to M-08 (8 tests)

✅ **No Critical bugs open:**
- 0 bugs w kategorii "Data leakage"
- 0 bugs w kategorii "Auth bypass"
- 0 bugs w kategorii "Wrong calculations"

✅ **RLS policies verified:**
- Manual testing w Supabase Studio passed
- User isolation confirmed

✅ **AI graceful degradation confirmed:**
- App functional when OpenRouter unavailable

### Post-Deployment Metrics (Week 1)

- **Zero data leakage incidents** (user reports)
- **Zero auth-related bugs** (user reports)
- **< 5% AI insights failure rate** (monitor 503 errors)
- **< 2% calculation disputes** (user reports wrong totals)

---

## 10. Notatki i Kontekst

### 10.1 Obserwacje o Projekcie

**Co JEST w projekcie:**
- ✅ Supabase RLS policies (well-designed, comprehensive)
- ✅ Zod validation schemas (good coverage, can serve as "living contracts")
- ✅ Error handling framework (`ApiError` class)
- ✅ AI retry logic (rate limiting, timeouts)
- ✅ Middleware for auth (cookies + JWT)
- ✅ Type-safe API responses (TypeScript + Zod inference)

**Co BRAKUJE:**
- ❌ Zero test files (`.test.ts`, `.spec.ts`)
- ❌ Zero test tooling w `package.json`
- ❌ Brak test factories dla powtarzalnych test data
- ❌ Brak vitest.config.ts
- ❌ Brak CI/CD (Github Actions config pusty)
- ❌ Brak monitoring/logging (production-ready)

**Biggest Risk Areas:**
1. **RLS policies** — logika OK, ale MUSI być przetestowana ręcznie (NO automated RLS testing tool exists)
2. **Middleware routing** — kompleksowa logika (cookies vs JWT), łatwo o bug
3. **Financial calculations** — floating-point, rounding, edge cases (HIGH priority dla unit tests)
4. **AI integration** — external dependency, timeouts, retries (graceful degradation critical)
5. **Form validation** — React forms nie są testowane, tylko backend validation (dodaj Testing Library)

### 10.2 Rekomendacje dla Developera

**Przed deploymentem MVP (MUST DO):**
1. ✅ Zainstaluj test framework:
   ```bash
   npm install -D vitest @vitest/ui @vitest/coverage-v8
   npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
   npm install -D @faker-js/faker
   ```
2. ✅ Napisz unit testy dla `summary.service.ts` (financial calculations = CRITICAL)
3. ✅ Napisz component testy dla `LoginForm.tsx` i `RegisterForm.tsx`
4. ✅ Ręcznie przetestuj TC-RLS-001 i TC-RLS-002 w Supabase Studio
5. ✅ Ręcznie przetestuj TC-AUTH-001 to TC-AUTH-005
6. ✅ Ręcznie przetestuj TC-AI-002 (graceful degradation)
7. ✅ Uzyskaj coverage > 60% dla `src/lib/services/` i `src/components/auth/`

**Po deploymencie MVP (Post-MVP Phase):**
1. 🔜 Dodaj Playwright dla E2E critical paths (authentication flow, CRUD operations)
2. 🔜 Dodaj MSW dla frontend integration tests (API mocking)
3. 🔜 Setup error monitoring (Sentry, Rollbar, lub podobne)
4. 🔜 Dodaj API rate limiting (Astro middleware + Redis lub in-memory store)
5. 🔜 Setup CI/CD pipeline (GitHub Actions + auto-run tests)

**Ongoing Best Practices:**
- Przy każdej zmianie w `summary.service.ts` → run `npm run test` (unit tests)
- Przy każdej zmianie w RLS policies → manual verification w Supabase Studio
- Przed każdym deploymentem → run full manual test checklist (`.ai/test-checklist.md`)
- Każdy bug w produkcji → write regression test FIRST, then fix
- Każdy nowy API endpoint → write integration test covering success + error cases

**Czego NIE robić:**
- ❌ NIE szukaj "Supabase Test Helpers" package (nie istnieje)
- ❌ NIE dodawaj Percy/Chromatic (za drogie, użyj Playwright screenshots)
- ❌ NIE dodawaj Pact/OpenAPI contract testing (over-engineering dla monolitu)
- ❌ NIE dąż do 100% coverage (60-70% dla critical paths wystarczy)
- ❌ NIE testuj Zod validation w unit testach (Zod sam się testuje, testuj edge cases)

---

## Appendix A: Test Data Fixtures

### A.1 Test Users

```typescript
// test/fixtures/users.ts
export const TEST_USERS = {
  alice: {
    email: 'alice@test.com',
    password: 'Test123!@#',
    id: '00000000-0000-0000-0000-000000000001',
  },
  bob: {
    email: 'bob@test.com',
    password: 'Test456!@#',
    id: '00000000-0000-0000-0000-000000000002',
  },
};
```

### A.2 Test Subscriptions

```typescript
// test/fixtures/subscriptions.ts
export const TEST_SUBSCRIPTIONS = {
  netflix: {
    name: 'Netflix',
    cost: 43.00,
    currency: 'PLN',
    billing_cycle: 'monthly',
    status: 'active',
    start_date: '2024-01-15',
    next_billing_date: '2025-02-15',
  },
  spotify: {
    name: 'Spotify',
    cost: 19.99,
    currency: 'PLN',
    billing_cycle: 'monthly',
    status: 'active',
    start_date: '2023-06-01',
    next_billing_date: '2025-02-01',
  },
  adobe: {
    name: 'Adobe Creative Cloud',
    cost: 239.88,
    currency: 'PLN',
    billing_cycle: 'yearly',
    status: 'active',
    start_date: '2024-03-10',
    next_billing_date: '2025-03-10',
  },
};
```

---

## Appendix B: SQL Queries for Manual RLS Testing

### B.1 Verify User Isolation

```sql
-- Login as User A in Supabase Studio
-- Should see ONLY User A's subscriptions
SELECT * FROM subscriptions;

-- Try to access User B's subscription directly
SELECT * FROM subscriptions WHERE user_id = '<user_b_id>';
-- Expected: 0 rows (RLS blocks)
```

### B.2 Verify Profile Auto-Creation

```sql
-- After user registration
SELECT * FROM auth.users WHERE email = 'test@example.com';
-- Copy user ID

SELECT * FROM profiles WHERE id = '<copied_user_id>';
-- Expected: 1 row with matching ID
```

### B.3 Verify CASCADE Delete

```sql
-- Get user with subscriptions
SELECT id FROM auth.users WHERE email = 'test@example.com';

-- Count subscriptions
SELECT COUNT(*) FROM subscriptions WHERE user_id = '<user_id>';

-- Delete user
DELETE FROM auth.users WHERE id = '<user_id>';

-- Verify cascade
SELECT COUNT(*) FROM profiles WHERE id = '<user_id>';
-- Expected: 0

SELECT COUNT(*) FROM subscriptions WHERE user_id = '<user_id>';
-- Expected: 0
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-30 | AI (Cursor) | Initial test plan based on repo analysis |
| 1.1 | 2026-01-30 | AI (Cursor) | Updated tooling recommendations: removed non-existent "Supabase Test Helpers", added @testing-library/react, @faker-js/faker, replaced Percy/Chromatic with Playwright screenshots, clarified Zod as contract testing alternative |

**Key Changes in v1.1:**
- ✅ Added @testing-library/react for React component testing (Priority 3)
- ✅ Added @faker-js/faker for test data generation (Priority 4)
- ✅ Replaced "Supabase Test Helpers" with concrete approach: Supabase local dev + db reset scripts
- ✅ Replaced Percy/Chromatic with Playwright built-in screenshots (free alternative)
- ✅ Clarified NOT to use Pact/OpenAPI for monolith (Zod schemas sufficient)
- ✅ Added MSW as optional post-MVP tool for API mocking
- ✅ Added vitest.config.ts and test setup examples
- ✅ Updated execution plan with React testing phase
- ✅ Added "Czego NIE robić" section to prevent common mistakes

**Next Review:** Po pierwszym deploymencie MVP (track actual bugs vs test coverage)

---

**Koniec Test Planu**
