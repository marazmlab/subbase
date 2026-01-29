# Product Requirements Document (PRD) — Subbase (MVP)

## 1. Product Overview

### 1.1 Product Name

**Subbase**

### 1.2 Summary

Subbase is a web-based application that helps individual users manually track recurring subscriptions in one place, understand their monthly and yearly costs, and gain basic AI-powered insights that increase cost awareness.

### 1.3 Context

The project is built as part of an AI-assisted full-stack learning workflow.  
The primary goal is to deliver a functional MVP that provides clear user value and serves as a foundation for structured database, API, UI, and AI planning.

### 1.4 Target Audience

Individuals who manage multiple subscriptions (e.g. streaming services, SaaS tools, memberships) and want a simple, centralized overview of recurring expenses.

### 1.5 Monetization

None (learning project).

---

## 2. User Problem & Value

### 2.1 Problem Statement

Users gradually accumulate subscriptions and lose visibility into:

- how many subscriptions they currently have,
- how much they spend on a recurring basis,
- whether multiple subscriptions overlap in purpose,
- which subscriptions are still worth their cost.

### 2.2 MVP Value Proposition

“All subscriptions in one place, clear monthly and yearly cost totals, and optional AI insights that help users reflect on their spending.”

---

## 3. MVP Scope

### 3.1 In Scope (MVP)

- User authentication
- Manual subscription management (create, view, edit, delete)
- Overview of all subscriptions
- Monthly and yearly recurring cost totals
- User-triggered AI-powered insights
- Basic responsive UI
- Basic loading and error handling

### 3.2 Out of Scope (MVP)

- Automatic subscription detection or third-party integrations
- Notifications or reminders
- Historical analytics or charts
- Multi-currency support
- Advanced organization (tags, filters, search)
- Shared or multi-user accounts
- Mobile or offline support
- Internationalization (i18n)

### 3.3 Explicit Non-Goals

The MVP does **not** aim to:

- provide financial advice or budgeting recommendations,
- infer actual subscription usage or personal behavior,
- operate autonomously without user interaction,
- optimize for marketing, SEO, or growth,
- achieve full accessibility or visual polish.

---

## 4. AI Feature (Product-Level Only)

### 4.1 Role of AI

AI acts as a **cost-awareness assistant**, supporting user reflection rather than making decisions.

### 4.2 Scope of AI Insights

AI insights:

- are explicitly triggered by the user,
- rely only on subscription metadata,
- provide high-level, conservative observations,
- are limited in number and scope.

### 4.3 Constraints

AI must:

- avoid assumptions about real usage,
- avoid prescriptive or authoritative recommendations,
- avoid financial or legal advice,
- fail gracefully without blocking core application functionality.

Details of AI inputs, outputs, and validation are intentionally deferred to a dedicated AI planning phase.

---

## 5. Core User Stories

## US-001: User Registration and Login

- **Title**: User Registration and Authentication
- **Description**: As a user, I want to be able to register a new account and log in to the application, so that I can securely access my subscriptions.
- **Acceptance Criteria**:
  - User has access to a dedicated login page at `/login`.
  - Login page contains two tabs: "Login" and "Register" for switching between forms.
  - Login form requires email address and password (minimum 6 characters).
  - Registration form requires email address, password, and password confirmation.
  - Email validation checks for proper format (regex), and password validation enforces minimum 6 characters.
  - Password confirmation validation checks match with password field.
  - Validation errors are displayed inline below respective form fields in Polish language.
  - After successful login, user is redirected to the home page (`/`).
  - After successful registration, user is automatically logged in and redirected to the home page (`/`).
  - Authentication errors from API (e.g., "Invalid login credentials") are mapped to Polish user messages (e.g., "Nieprawidłowy email lub hasło").
  - User cannot distinguish in error message whether email or password was incorrect (prevents account enumeration).
  - Authentication uses Supabase Auth through `signInWithPassword` (login) and `signUp` (registration) methods.
  - Sessions are based on cookies for Astro pages and JWT tokens in Authorization header for API routes.
  - Supabase browser client is created through `@supabase/ssr` with cookie handling support.
  - Form data entered is preserved when switching between tabs.
  - Tab key navigation between form fields works correctly.
  - Pressing Enter in form triggers form submission.

## US-002: Automatic Redirects and Logout

- **Title**: Session Management and Redirects
- **Description**: As a user, I want the application to automatically redirect me to appropriate pages depending on my session state, and I want to be able to securely log out to protect my data.
- **Acceptance Criteria**:
  - Authenticated users attempting to access `/login` are automatically redirected to `/` (dashboard).
  - Unauthenticated users attempting to access `/` (dashboard) are automatically redirected to `/login`.
  - Middleware (`src/middleware/index.ts`) automatically verifies user session and sets `context.locals.user`.
  - Middleware creates Supabase client instance and sets `context.locals.supabase`.
  - For Astro pages, middleware uses cookie-based session for verification.
  - For API routes, middleware verifies Bearer token from Authorization header.
  - User can log out via "Logout" button visible in TopBar on home page.
  - After clicking "Logout" button, `supabase.auth.signOut()` method is called.
  - After logout, user is redirected to `/login`.
  - After logout, user session is completely terminated (cookies removed).

## US-003: User Data Isolation

- **Title**: Data Security and Privacy
- **Description**: As a user, I want to be sure that my subscriptions are private and accessible only to me, so that no one else can view or modify my data.
- **Acceptance Criteria**:
  - After user registration, a record is automatically created in `profiles` table by `handle_new_user()` trigger.
  - Trigger `handle_new_user()` has `SECURITY DEFINER` attribute and executes `AFTER INSERT` on `auth.users`.
  - Record in `profiles` has `id` equal to `auth.users.id` and is connected via foreign key with `ON DELETE CASCADE`.
  - Row-Level Security (RLS) is enabled on `profiles` table.
  - User can read only their own profile (`auth.uid() = id`).
  - Row-Level Security (RLS) is enabled on `subscriptions` table.
  - User can read only their own subscriptions (`auth.uid() = user_id`).
  - User can create subscriptions only for themselves (`auth.uid() = user_id`).
  - User can update only their own subscriptions (`auth.uid() = user_id`).
  - User can delete only their own subscriptions (`auth.uid() = user_id`).
  - Field `user_id` in subscription is always set server-side based on `auth.uid()`, never from client data.
  - When attempting to access another user's subscription, API returns 404 Not Found error (not 403, to avoid revealing resource existence).
  - Deleting user from `auth.users` automatically deletes their profile and all subscriptions (CASCADE).

## US-004: Subscription List Management

- **Title**: Browsing and CRUD Operations for Subscriptions
- **Description**: As a user, I want to be able to add, view, edit, and delete my subscriptions, so that I can maintain an up-to-date overview of my expenses.
- **Acceptance Criteria**:
  - User sees list of all their subscriptions on home page (`/`) in dashboard section.
  - Subscription list is fetched from API endpoint `GET /api/subscriptions`.
  - Endpoint `GET /api/subscriptions` supports pagination with parameters `page` (default: 1) and `limit` (default: 10, max: 100).
  - Endpoint `GET /api/subscriptions` supports filtering by status with `status` parameter (values: `active`, `paused`, `cancelled`).
  - Each subscription in list displays: name, cost with currency, billing cycle, status, next billing date.
  - User can open form for adding new subscription via "Add Subscription" button.
  - Add form requires: name, cost, billing cycle (monthly/yearly), start date.
  - Add form optionally accepts: status (default: active), next billing date, description.
  - Form validation: name is required, cost > 0 and ≤ 100000 (max 2 decimal places), billing cycle (monthly/yearly), start date in YYYY-MM-DD format, next billing date ≥ start date.
  - After filling form and clicking "Save", `POST /api/subscriptions` request is sent.
  - After successful addition, subscription list is refreshed and new subscription appears in list.
  - User can edit existing subscription by clicking "Edit" button next to given subscription.
  - Edit form is pre-filled with current subscription data.
  - After saving changes, `PATCH /api/subscriptions/:id` request is sent with only changed fields.
  - User can change subscription status to paused or cancelled without editing other fields.
  - User can delete subscription by clicking "Delete" button next to given subscription.
  - Before deletion, confirmation dialog is displayed with message "Are you sure you want to delete this subscription?" (in Polish: "Czy na pewno chcesz usunąć tę subskrypcję?").
  - After confirmation, `DELETE /api/subscriptions/:id` request is sent.
  - After successful deletion, subscription disappears from list.
  - Validation errors from API are displayed inline below respective form fields in Polish language.
  - Network errors display message "Cannot connect to server. Check your internet connection." (in Polish: "Nie można połączyć z serwerem. Sprawdź połączenie internetowe.").
  - During data loading, skeleton loader is displayed for subscription list.
  - During form submission, "Save" button is disabled and shows spinner.

## US-005: Cost Summary and AI Insights Generation

- **Title**: Cost Overview and AI Insights
- **Description**: As a user, I want to see summary costs of my subscriptions in monthly and yearly breakdown, and have the ability to generate AI insights, so that I can better understand my expenses.
- **Acceptance Criteria**:
  - User sees summary section on home page (`/`) above subscription list.
  - Summary section displays: total monthly cost, total yearly cost, currency (PLN).
  - Summary section displays counters: number of active subscriptions, number of paused, number of cancelled.
  - Summary data is fetched from API endpoint `GET /api/subscriptions/summary`.
  - Monthly cost is calculated as sum of monthly subscription costs + (yearly subscriptions ÷ 12).
  - Yearly cost is calculated as sum of (monthly subscriptions × 12) + yearly subscriptions.
  - Only subscriptions with `active` status are included in cost calculations.
  - Counters show all subscriptions regardless of status.
  - User can generate AI insights by clicking "Generate AI Insights" button in dashboard section.
  - After clicking button, `POST /api/ai/insights` request is sent.
  - Endpoint `POST /api/ai/insights` analyzes user's subscriptions and returns list of insights.
  - Optionally, user can specify particular subscriptions for analysis (`subscription_ids` parameter).
  - If `subscription_ids` is not provided, all active subscriptions are analyzed.
  - AI insights are displayed in dedicated panel in Polish language.
  - AI insights are ephemeral (not stored in database) and generated on-demand.
  - AI insights contain only high-level observations (e.g., "You have 3 streaming services with total cost of 110.98 PLN monthly").
  - AI insights DO NOT contain: assumptions about actual usage, prescriptive recommendations, financial advice.
  - During insights generation, loading state is displayed (spinner and message "Generating insights..." in Polish: "Generowanie wniosków...").
  - If AI service is unavailable (503 error), message is displayed "AI insights are temporarily unavailable. Try again later." (in Polish: "Wnioski AI są tymczasowo niedostępne. Spróbuj ponownie później.").
  - AI insights error DOES NOT block functionality of rest of application (fail gracefully).
  - AI insights panel can be closed without affecting application functionality.

---

## 6. Success Criteria (MVP)

### Functional Success

- Users can manage subscriptions end-to-end.
- Monthly and yearly totals are calculated correctly.
- AI insights can be generated and displayed on demand.
- Core functionality remains usable if AI is unavailable.

### Project Success

- MVP scope is completed without scope creep.
- Database, API, UI, and AI layers are derived from this PRD.
- The project supports learning goals of AI-assisted full-stack development.
