> ⚠️ ARCHIVAL DOCUMENT
> This file is kept for reference only.
> It is NOT an active source of truth.

You are an experienced product manager whose task is to create a comprehensive Product Requirements Document (PRD) based on the following descriptions:

<project_description>

# App - Subbase (MVP)

## 🔻 Main Problem

These days, most technology—and many everyday—services run on subscriptions. Over time, it's easy to lose track of how many accounts we have, how much we're actually spending, whether we're paying for duplicate tools, or even whether we're still subscribed at all.

Subbase brings all your subscriptions into one place so you can track them effortlessly and see your spending clearly. With built-in AI insights, Subbase helps you spot overlaps, identify waste, and prioritize the services that truly deliver value—so you can optimize costs without losing what matters.

## 🔻 Smallest set of features

- Subscription CRUD: add, view, edit, and delete subscriptions displayed as easy-to-scan cards
- Dashboard showing monthly and yearly total subscription costs
- Secure user accounts with private subscription data (users can only see their own subscriptions)
- AI-powered insights: a single "Analyze my subscriptions" button that sends the list to an LLM and returns 1-3 text-based suggestions (e.g., potential overlaps or savings tips)

## 🔻 What's NOT included in an MVP?

### Collaboration & Social

- Share your subscription library with other users for collaborative access and visibility
- Enable social features for discovery, recommendations, and shared subscription planning
- Family/team subscription management
- Public profiles or subscription showcases

### Financial Features

- Multiple currency support and automatic conversion
- Bank/credit card integration for automatic subscription detection
- Payment method tracking (which card is used for what)
- Budget limits and spending alerts
- Historical spending trends and charts
- Export to CSV/PDF for accounting

### Notifications & Reminders

- Email/push notifications before renewal dates
- Cancellation deadline reminders
- Price change alerts
- Free trial expiration warnings

### Advanced Organization

- Custom categories and tags for subscriptions
- Search and filtering functionality
- Sorting options (by price, date, name, etc.)
- Archive/pause subscriptions without deleting
- Subscription notes or annotations

### UI/UX Enhancements

- Dark mode / theme customization
- Mobile-responsive design (beyond basic)
- Drag-and-drop reordering
- Dashboard widgets customization
- Data visualization (charts, graphs, pie charts)

### Advanced AI Features

- Automatic subscription detection from email parsing
- Personalized cancellation suggestions based on usage patterns
- Price comparison with alternative services
- Negotiation tips for lowering subscription costs
- AI response caching or history
- Streaming responses
- Multiple AI providers or model selection
- Custom prompt configuration

### Technical Features

- Offline mode / PWA support
- Multiple languages (i18n)
- Account settings (change email, password, delete account)
- Data backup and restore
- API for third-party integrations

## 🔻 Success Criteria

- User can register, log in, and only see their own subscriptions (no access to other users' data)
- Full CRUD works: create, edit, delete a subscription → change is immediately visible in the UI
- Dashboard calculates totals correctly (e.g., 3× monthly $10 + 1× yearly $120 = Monthly: $30, Yearly: $480)
- AI: clicking "Analyze" sends subscriptions to OpenAI API and displays at least 1 suggestion in the UI

</project_description>

<project_details>
<conversation_summary>

<decisions>

1. **Data Model:** Subscription fields include: name, price, billing frequency (monthly/yearly), renewal date, and optional logo URL
2. **Target Audience:** Individual consumers managing personal subscriptions
3. **Authentication:** Email/password only, simple registration form without email verification
4. **Session Management:** Persistent login using secure HTTP-only cookies/tokens (7-30 day expiration)
5. **Tech Stack:** Astro-based frontend starter (10x-astro-starter); backend/database to be defined after PRD
6. **AI Rate Limiting:** 3-5 analyses per day per user with 24-hour caching for identical subscription lists
7. **Monetization:** Completely free (learning project)
8. **Timeline:** January 31, 2026 (~20 days), solo developer with AI assistance
9. **Priority Order:** (1) Auth + CRUD with basic UI, (2) Dashboard calculations, (3) AI integration
10. **Currency:** Single currency with user-selectable option in profile (default USD or PLN)
11. **Logo Field:** Simple optional text field for manual URL entry
12. **UI Style:** Minimal/clean design with colorful accent; one accent color (purple/teal/coral) for CTAs, neutral grays elsewhere
13. **Subscription Card Display:** Name (prominent), price with frequency label, renewal date (secondary), logo if provided
14. **Dashboard Layout:** Totals displayed prominently at top, subscription cards below serving as breakdown
15. **Dashboard Updates:** Real-time updates when cards are added/edited/deleted
16. **Add/Edit Flow:** Modal forms for creating and editing subscriptions
17. **Delete Flow:** Simple confirmation modal before deletion
18. **Empty State:** Friendly illustration/icon, "No subscriptions yet" message, prominent "Add your first subscription" button
19. **Billing Frequency Options:** Monthly and Yearly only
20. **Renewal Date Usage:** Display only (no sorting or highlighting features)
21. **Form Validation:** Basic client-side validation with HTML5 + minimal JS, inline error messages
22. **AI Display:** Slide-out panel for analysis results
23. **AI Focus Areas:** (1) Identifying overlapping services, (2) Suggesting redundant subscriptions, (3) General cost-awareness tips
24. **AI Data Sent:** Only subscription names, prices, and billing frequencies (no user identifiers)
25. **AI Response Format:** Brief, actionable bullet points (1-3 items, 1-2 sentences each)
26. **Error Handling:** Toast notifications for network/server errors with retry option
27. **Loading States:** Spinner/skeleton cards while loading subscriptions; "Analyzing..." state for AI panel
28. **User Menu:** Top-right corner showing user email, dropdown with "Logout" option
29. **OpenAI Integration:** API account with small prepaid budget for testing
30. **MVP Validation:** Not required (learning project focused on building skills)
31. **Learning Approach:** Build as fast as possible with AI assistance, no intentional distractions

</decisions>

<matched_recommendations>

1. **Data Model Simplicity:** Minimal fields (name, price, frequency, renewal date, optional logo) keeps manual entry quick while providing enough data for AI analysis
2. **Auth Simplicity:** Skip email verification for MVP — simple registration with immediate login reduces complexity and development time
3. **Persistent Sessions:** Secure HTTP-only cookies improve UX for a personal tool accessed frequently
4. **Currency Handling:** User-selectable single currency avoids conversion logic complexity while allowing personalization
5. **Feature Prioritization:** Auth + CRUD → Dashboard → AI ensures a working subscription tracker even if AI integration faces delays
6. **Rate Limiting Strategy:** Daily limits with caching prevents API cost overruns during development and production
7. **Real-time Updates:** Optimistic UI updates when CRUD actions occur provides better UX with modern frameworks
8. **Modal-based Forms:** Keeps users in context, avoids routing complexity, matches slide-out panel pattern for consistency
9. **Basic Validation:** HTML5 validation + minimal JS is sufficient for MVP without over-engineering
10. **AI Response Brevity:** Short bullet points prevent overwhelming slide-out panel and are easier to scan
11. **Graceful AI Degradation:** If OpenAI fails, show friendly error with retry; core tracking features remain functional
12. **Empty State UX:** Friendly illustration + clear CTA guides new users and improves first-time experience
13. **Single Accent Color:** Creates visual cohesion with minimal design decisions required
14. **Toast Notifications:** Clear error feedback without complex offline queuing or retry logic
15. **Loading Indicators:** Essential user feedback that's quick to implement

</matched_recommendations>

<prd_planning_summary>

## Product Overview

**Product Name:** Subbase

**Problem Statement:** Users lose track of their subscriptions over time, making it difficult to know how much they're spending, whether they're paying for duplicate tools, or if they're still subscribed to unused services.

**Solution:** A centralized subscription tracking application with AI-powered insights that helps users manage their subscriptions, visualize spending, and identify potential savings.

**Project Context:** This is a learning project focused on building a full-stack application with AI assistance within a 21-day timeline (deadline: January 31, 2026). The developer is working solo with AI agent support.

---

## Functional Requirements

### Core Features (MVP)

#### 1. User Authentication

- Simple email/password registration and login
- No email verification required
- Persistent sessions (7-30 day expiration) using secure HTTP-only cookies
- User menu in top-right corner with email display and logout option
- Users can only access their own subscription data

#### 2. Subscription Management (CRUD)

- **Create:** Modal form with fields for name (required), price (required, positive number), billing frequency (monthly/yearly), renewal date (valid date format), logo URL (optional)
- **Read:** Subscription cards displaying name (prominent), price with frequency label (e.g., "$9.99/mo"), renewal date (secondary), and logo if provided
- **Update:** Edit via same modal form pattern
- **Delete:** Confirmation modal before permanent deletion
- Real-time UI updates after any CRUD operation

#### 3. Dashboard

- Monthly and yearly total subscription costs displayed prominently at top
- Subscription cards below serve as the breakdown/detail view
- Calculation example: 3× monthly $10 + 1× yearly $120 = Monthly: $30, Yearly: $480
- Single user-selectable currency (stored in profile)

#### 4. AI-Powered Analysis

- Single "Analyze my subscriptions" button
- Sends subscription names, prices, and billing frequencies to OpenAI API (GPT-3.5-turbo)
- Returns 1-3 brief, actionable suggestions in a slide-out panel
- Focus areas: overlapping services, redundant subscriptions, cost-awareness tips
- Rate limited to 3-5 analyses per day with 24-hour caching
- "Analyzing..." loading state with spinner
- Graceful error handling with retry option if API fails

---

## User Interface Requirements

### Design Direction

- Minimal/clean aesthetic with colorful accent
- One accent color (vibrant purple, teal, or coral) for CTAs, active states, highlights
- Neutral grays for all other elements
- Card-based layout for subscriptions

### Key UI States

- **Empty State:** Friendly illustration/icon, "No subscriptions yet" message, prominent "Add your first subscription" button
- **Loading State:** Spinner or skeleton cards while fetching subscriptions
- **Error State:** Toast notification with error message and retry option
- **AI Loading:** "Analyzing..." text with spinner in slide-out panel

### Components

- Modal for Add/Edit subscription forms
- Confirmation modal for delete actions
- Slide-out panel for AI analysis results
- User dropdown menu (top-right)
- Toast notifications for errors

---

## User Stories

### Authentication

- As a new user, I can register with my email and password to create an account
- As a returning user, I can log in and remain logged in across browser sessions
- As a logged-in user, I can log out from the user menu

### Subscription Management

- As a user, I can add a new subscription by filling out a modal form
- As a user, I can view all my subscriptions as cards showing key information
- As a user, I can edit any subscription's details through a modal form
- As a user, I can delete a subscription after confirming in a modal dialog
- As a new user with no subscriptions, I see a friendly empty state guiding me to add my first subscription

### Dashboard & Insights

- As a user, I can see my total monthly and yearly subscription costs at the top of the dashboard
- As a user, I can click "Analyze my subscriptions" to receive AI-powered insights
- As a user, I can view AI suggestions in a slide-out panel
- As a user, I see helpful error messages if something goes wrong

---

## Success Criteria

1. **Authentication Works:** User can register, log in, and only see their own subscriptions (no access to other users' data)
2. **CRUD Functionality:** Create, edit, delete operations work correctly with immediate UI reflection
3. **Dashboard Accuracy:** Totals calculate correctly based on subscription data (monthly and yearly aggregations)
4. **AI Integration:** Clicking "Analyze" sends subscriptions to OpenAI API and displays at least 1 suggestion in the UI
5. **Session Persistence:** Users remain logged in across browser sessions within expiration period
6. **Real-time Updates:** Dashboard totals update immediately when subscriptions are modified

---

## Technical Constraints

- **Frontend:** Astro-based starter template (10x-astro-starter)
- **Backend/Database:** To be defined in next phase (after PRD)
- **External API:** OpenAI API (GPT-3.5-turbo) with prepaid budget
- **Timeline:** 21 days (deadline January 31, 2026)
- **Team:** Solo developer with AI assistance

---

## Out of Scope (Explicitly Excluded from MVP)

- Collaboration/social features, family/team management
- Multiple currency support with conversion
- Bank/credit card integration
- Email/push notifications and reminders
- Custom categories, tags, search, filtering, sorting
- Dark mode, advanced responsive design, drag-and-drop
- Advanced AI features (email parsing, price comparison, streaming)
- Offline mode, internationalization (i18n)
- Account settings (change email/password)
- Data export, backup, or third-party API

</prd_planning_summary>

<unresolved_issues>

1. **Backend/Database Selection:** Tech stack for backend and database to be defined after PRD completion. Options to consider: Supabase (PostgreSQL + Auth), Firebase, custom API with preferred database.

2. **Deployment Platform:** Hosting solution not yet decided. Recommended: Vercel (for Astro) + chosen backend service's hosting.

3. **Default Currency:** Need to decide between USD or PLN (or other) as the default currency option.

4. **Accent Color Selection:** Specific brand color not chosen yet. Need to pick one from: vibrant purple, teal, or coral.

5. **OpenAI API Budget:** Exact prepaid amount not specified. Recommended: $5-10 for development and testing.

6. **Responsive Design Scope:** "Basic mobile-responsive" mentioned but exact breakpoints and mobile UX not detailed.

7. **Password Requirements:** No specific password strength requirements defined (minimum length, complexity rules).

8. **Session Expiration Duration:** Range given (7-30 days) but exact value not specified.

9. **AI Rate Limit Specifics:** Range given (3-5 per day) but exact limit not specified.

10. **Error Message Copy:** Specific wording for error messages and UI copy not finalized.

</unresolved_issues>

</conversation_summary>
</project_details>

Follow these steps to create a comprehensive and well-organized document:

1. Divide the PRD into the following sections:
   a. Project Overview
   b. User Problem
   c. Functional Requirements
   d. Project Boundaries
   e. User Stories
   f. Success Metrics

2. In each section, provide detailed and relevant information based on the project description and answers to clarifying questions. Make sure to:
   - Use clear and concise language
   - Provide specific details and data as needed
   - Maintain consistency throughout the document
   - Address all points listed in each section

3. When creating user stories and acceptance criteria
   - List ALL necessary user stories, including basic, alternative, and edge case scenarios.
   - Assign a unique requirement identifier (e.g., US-001) to each user story for direct traceability.
   - Include at least one user story specifically for secure access or authentication, if the application requires user identification or access restrictions.
   - Ensure that no potential user interaction is omitted.
   - Ensure that each user story is testable.

Use the following structure for each user story:

- ID
- Title
- Description
- Acceptance Criteria

4. After completing the PRD, review it against this checklist:
   - Is each user story testable?
   - Are the acceptance criteria clear and specific?
   - Do we have enough user stories to build a fully functional application?
   - Have we included authentication and authorization requirements (if applicable)?

5. PRD Formatting:
   - Maintain consistent formatting and numbering.
   - Do not use bold formatting in markdown ( \*\* ).
   - List ALL user stories.
   - Format the PRD in proper markdown.

Prepare the PRD with the following structure:

```markdown
# Product Requirements Document (PRD) - {{app-name}}

## 1. Product Overview

## 2. User Problem

## 3. Functional Requirements

## 4. Product Boundaries

## 5. User Stories

## 6. Success Metrics
```

Remember to fill each section with detailed, relevant information based on the project description and our clarifying questions. Ensure the PRD is comprehensive, clear, and contains all relevant information needed for further product development.

The final output should consist solely of the PRD in the specified markdown format, which you will save in the file .ai/prd.md

### 3.2 Subscription Data Model

Each subscription record contains the following fields:

| Field             | Type         | Required   | Description                                |
| ----------------- | ------------ | ---------- | ------------------------------------------ |
| id                | UUID/Integer | Yes (auto) | Unique identifier                          |
| user_id           | UUID/Integer | Yes (auto) | Reference to owning user                   |
| name              | String       | Yes        | Name of the subscription service           |
| price             | Decimal      | Yes        | Cost of the subscription (positive number) |
| billing_frequency | Enum         | Yes        | Either "monthly" or "yearly"               |
| renewal_date      | Date         | Yes        | Next renewal date                          |
| logo_url          | String       | No         | Optional URL to service logo image         |
| created_at        | Timestamp    | Yes (auto) | Record creation timestamp                  |
| updated_at        | Timestamp    | Yes (auto) | Last update timestamp                      |

### STACK

Frontend - Astro with React dla komponentów interaktywnych:

- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:

  - Zapewnia bazę danych PostgreSQL
  - Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
  - Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
  - Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę Openrouter.ai:

  - Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
  - Pozwala na ustawianie limitów finansowych na klucze API

CI/CD i Hosting:

  - Github Actions do tworzenia pipeline’ów CI/CD
  - DigitalOcean do hostowania aplikacji za pośrednictwem obrazu docker



### DATABASE #1

1. apply recomendation
2. apply recomendation, but explain difference between id and user_id
3. apply recomendation
4. apply recomendation
5. apply recomendation
6. apply recomendation
7. apply recomendation
8. apply recomendation
9. apply recomendation
10. apply recomendation

### DATABASE #2
   
11. apply recomendation
12. apply recomendation
13. apply recomendation
14. apply recomendation
15. apply recomendation
16. apply recomendation
17. apply recomendation
18. apply recomendation
19. apply recomendation
20. apply recomendation

### DATABASE #3

21. apply recomendation
22. apply recomendation
23. apply recomendation
24. apply recomendation
25. apply recomendation
26. apply recomendation
27. apply recomendation
28. apply recomendation
29. apply recomendation
30. apply recomendation


### UI Architecture Planning Assistant 

## 1.1
 1. Chciałbym, żeby było prostsze:
   - strona logowania/Supabase Auth
   - chciałbym, żeby lista subskrypcji była widoczna jako dashboard ale nad nią żeby było widoczne podsumowanie kosztów
   - dodawanie i edytowanie subskrypcji niech też znajduje się w samej liście poprzez przycisk, który uruchamia modal z dodawaniem/edytowanem subskrypcji
   - Panelk AI Insights
  Przedstaw za i przeciw takiemu rozwiązaniu
 2. apply recomendation - tak jak to napisałem w pkt. 1 
 3. Na początku chcemy korzystać z wbydowanego zarządzania stanem w React czyli hooków oraz react context. Jak zajdzie potrzeba pomyślimy nad innym rozwiązniem. Póki co nie chcę wprowadzać niepotrzebnej dużej ilości nowych technologi, których nie rozumiem.
 4. apply recomendation
 5. apply recomendation
 6. apply recomendation
 7. mieliśmy nie implementować filtorwania w MVP. Jeżeli lepiej nie pommijać tego w MVP uargumentuj za i przeciw.
 8. stosuj się do API plan
 9. apply recomendation
 10. apply recommendtation

## 1.2
   1. apply recomendation
   2. OK
   3. czy ręczne obsłużenie cache  invalidation to duży problem? Mogę rozważyć TanStackQuery, jeżeli się to opłaca. Wyjaśnij czym to jest
   4. OK
   5. OK
   6. OK
   7. apply recomendation
   8. OK
   9. OK
   10. OK

## 2
   11. apply recomendation
   12. apply recomendation
   13. apply recomendation
   
## 3
   zostajemy przy React hooks + Context

   14. apply recomendation
   15. apply recomendation
   16. applly recomendation
   17. apply recomendation
   18. apply recomendation 

## 4
   zmiana decyzji nr.4 odnośnie wielowarstwowej obsłudze błędów. Dodamy to na późniejszym etapie, teraz skupiamy się na podstawowym UI
   19. apply recomendation
   20. apply recomendation
   21. apply recomendation
   22. wolałbym zająć się tym zagadnieniem później (chyba że rekomendujesz już teraz??)
   23. apply recomendation
   24. zajmiemy się tym później

## 5. 
   25. apply recomendation
   26. n aten moment nie



<conversation_summary>

## Decisions

1. **Uproszczona struktura widoków**: Aplikacja składa się z dwóch głównych widoków - strony logowania/rejestracji oraz dashboardu zawierającego wszystkie funkcjonalności (podsumowanie, lista, modal CRUD, panel AI).

2. **Zarządzanie stanem**: React hooks + Context zamiast zewnętrznych bibliotek (np. TanStack Query). Ręczna obsługa cache invalidation przez re-fetch po mutacjach.

3. **Obsługa błędów**: Podstawowa implementacja na start (try/catch, pojedynczy error state, przekierowanie na login przy 401). Wielowarstwowa obsługa błędów przesunięta na późniejszy etap.

4. **Nawigacja**: Minimalistyczny top-bar z logo i przyciskiem logout. Modal dla dodawania/edycji subskrypcji. Dialog potwierdzenia dla usuwania.

5. **Responsywność**: Desktop - tabela, Mobile - karty. Breakpointy Tailwind (sm/md/lg).

6. **Filtrowanie**: Nie implementowane w MVP. UI zaprojektowany z możliwością łatwego dodania w przyszłości. Status widoczny jako badge przy każdej subskrypcji.

7. **Autentykacja**: Własne formularze z Shadcn/ui (nie Supabase Auth UI). Jeden widok `/login` z tabs dla logowania i rejestracji.

8. **Panel AI Insights**: Sekcja zwinięta domyślnie na dashboardzie. Rozwijana na żądanie z przyciskiem "Generuj wglądy AI".

9. **Paginacja**: Tradycyjna paginacja (Previous/Next + numery stron), limit 10, stan w React.

10. **Empty state**: Dedykowany widok dla nowych użytkowników bez subskrypcji z CTA "Dodaj pierwszą subskrypcję".

11. **Walidacja formularzy**: Hybrydowa - inline dla formatów, przy submit dla reguł biznesowych. Wykorzystanie Zod (istniejący schema).

12. **Wyświetlanie danych**: 
    - Daty w formacie polskim (dd.mm.yyyy) z `Intl.DateTimeFormat`
    - Waluta jako symbol (zł) z `Intl.NumberFormat`
    - Kluczowe pola widoczne w liście, szczegóły w modalu edycji

13. **Feedback użytkownika**: Toast notifications (Shadcn Sonner) dla sukcesu i błędów operacji.

14. **Architektura komponentów**: Astro page dla layoutu + React Island (`client:load`) dla interaktywnego dashboardu.

15. **Struktura katalogów**: Minimalna definicja - `auth/`, `subscriptions/`, `ai/`, `ui/`. Szczegóły podczas implementacji.

16. **Style i kolory**: Przesunięte na później. Domyślny theme Shadcn/ui na start.

---

## Matched Recommendations

1. **Hierarchia widoków MVP**:
   - `/login` - strona logowania/rejestracji z tabs
   - `/` - Dashboard (po zalogowaniu) zawierający: podsumowanie kosztów, listę subskrypcji, modal CRUD, panel AI Insights

2. **Zarządzanie stanem React**:
   - `SubscriptionContext` - lista subskrypcji, summary, loading/error states, funkcje CRUD
   - `AuthContext` - stan autentykacji
   - Lokalny `useState` - stan modalu, dane formularza
   - Custom hooks jako wrappery (`useSubscriptions()`, `useAuth()`)

3. **Podstawowa obsługa błędów**:
   - try/catch w funkcjach fetch
   - Pojedynczy state `error` w kontekście
   - Wyświetlanie błędu jako prosty tekst/alert
   - Przekierowanie na `/login` przy 401
   - Console.error dla debugowania

4. **Layout podsumowania kosztów**:
   - Miesięcznie: kwota PLN
   - Rocznie: kwota PLN
   - Liczniki: Aktywne | Wstrzymane | Anulowane

5. **Responsywny design listy subskrypcji**:
   - Desktop: tabela z kolumnami (nazwa, koszt, cykl, status, akcje)
   - Tablet: tabela z ukrytymi kolumnami
   - Mobile: karty z kluczowymi informacjami

6. **Flow usuwania subskrypcji**: Przycisk ikony kosza → AlertDialog z potwierdzeniem → akcja lub anulowanie.

7. **Pola widoczne w liście subskrypcji**: nazwa, koszt + waluta, cykl (badge), status (kolorowy badge), akcje (Edytuj/Usuń).

8. **Formularze autentykacji**:
   - Login: email, hasło
   - Rejestracja: email, hasło, potwierdzenie hasła
   - Shadcn/ui Card + Tabs + Input components

9. **Integracja Astro + React**: Astro page obsługuje routing i middleware (auth check), React Island (`<Dashboard client:load />`) obsługuje całą interaktywność.

10. **Minimalna struktura komponentów**:
    - `src/components/ui/` - Shadcn/ui (istniejące)
    - `src/components/auth/` - LoginForm, RegisterForm
    - `src/components/subscriptions/` - komponenty subskrypcji
    - `src/components/ai/` - AiInsightsPanel
    - `src/lib/contexts/` - SubscriptionContext, AuthContext

---

## UI Architecture Planning Summary

### Główne wymagania architektury UI

Aplikacja Subbase MVP wymaga prostego, funkcjonalnego interfejsu skoncentrowanego na jednym głównym zadaniu - zarządzaniu subskrypcjami. Architektura opiera się na minimalnej liczbie widoków z dashboardem jako centralnym punktem aplikacji. Priorytetem jest szybkość implementacji i łatwość utrzymania, z możliwością rozbudowy w przyszłości.

### Kluczowe widoki i przepływy użytkownika

**Strona logowania (`/login`)**

Pojedynczy widok z dwoma zakładkami przełączającymi między formularzem logowania a rejestracją. Formularze zbudowane z komponentów Shadcn/ui (Card, Tabs, Input, Button). Po pomyślnym zalogowaniu przekierowanie na dashboard. Obsługa błędów walidacji inline w formularzu.

**Dashboard (`/`)**

Główny i jedyny widok aplikacji po zalogowaniu, zawierający wszystkie funkcjonalności:

- **Sekcja podsumowania**: Wyświetla miesięczne i roczne koszty oraz liczniki subskrypcji według statusu. Dane pobierane z endpointu `/api/subscriptions/summary`. Zawsze widoczna na górze strony.

- **Lista subskrypcji**: Wyświetla wszystkie subskrypcje użytkownika z paginacją. Na desktop jako tabela, na mobile jako karty. Każdy element pokazuje nazwę, koszt, cykl rozliczeniowy (badge), status (kolorowy badge) oraz przyciski akcji. Przycisk "Dodaj subskrypcję" otwiera modal.

- **Modal formularza**: Jeden komponent obsługujący zarówno dodawanie jak i edycję subskrypcji. Walidacja hybrydowa - inline dla formatów pól, przy submit dla reguł biznesowych. Po zapisie: zamknięcie modalu, re-fetch listy i summary, toast notification.

- **Dialog usuwania**: AlertDialog z potwierdzeniem wyświetlany po kliknięciu ikony usuwania. Zawiera nazwę subskrypcji i przyciski Usuń/Anuluj.

- **Panel AI Insights**: Sekcja zwinięta domyślnie, rozwijana przez użytkownika. Po rozwinięciu widoczny przycisk "Generuj wglądy AI". Opcjonalny wybór subskrypcji do analizy. Wyniki wyświetlane jako lista obserwacji z timestamp. Disclaimer o charakterze informacyjnym AI.

- **Empty state**: Dla nowych użytkowników bez subskrypcji - dedykowany widok z komunikatem i prominent CTA otwierającym modal dodawania.

### Strategia integracji z API i zarządzania stanem

**Architektura stanu**

Aplikacja wykorzystuje wbudowane mechanizmy React (hooks + Context) bez zewnętrznych bibliotek. Dwa główne konteksty:

- `SubscriptionContext` przechowuje listę subskrypcji, dane summary, stany ładowania i błędów oraz funkcje wykonujące operacje CRUD. Każda mutacja (add/update/delete) kończy się re-fetchem listy i summary dla zapewnienia spójności danych.

- `AuthContext` zarządza stanem autentykacji i udostępnia informacje o zalogowanym użytkowniku dla komponentów UI.

**Integracja z API**

Wszystkie endpointy wymagają autentykacji (JWT w cookies obsługiwane przez Supabase SSR). Middleware Astro weryfikuje sesję przed renderowaniem chronionych stron. Przy błędzie 401 następuje automatyczne przekierowanie na `/login`.

Komunikacja z API odbywa się przez funkcje w kontekście, które obsługują fetch, aktualizację stanu i podstawową obsługę błędów (try/catch). Toast notifications informują użytkownika o wyniku operacji.

**Paginacja**

Tradycyjna paginacja z komponentami Previous/Next i numerami stron. Domyślny limit 10 elementów. Stan paginacji przechowywany w React (możliwość przeniesienia do URL params w przyszłości).

### Responsywność i bezpieczeństwo

**Responsywność**

Aplikacja adaptuje się do różnych rozmiarów ekranów wykorzystując breakpointy Tailwind:
- Desktop (lg+): pełna tabela z wszystkimi kolumnami
- Tablet (md): tabela z ukrytymi mniej istotnymi kolumnami
- Mobile (sm): lista kart z kluczowymi informacjami

Modal formularza i dialogi dostosowują się do szerokości ekranu. Shadcn/ui komponenty (Table, Card, Dialog) zapewniają podstawową responsywność.

**Bezpieczeństwo**

Autentykacja oparta na Supabase Auth z tokenami JWT przechowywanymi w HTTP-only cookies (nie localStorage). Middleware Astro chroni wszystkie route'y poza `/login`. Row-Level Security na poziomie bazy danych zapewnia izolację danych użytkowników. UI nigdy nie przesyła user_id - jest on ustawiany server-side.

### Decyzje odłożone na później

- Wielowarstwowa obsługa błędów (ErrorBoundary, retry logic, szczegółowe komunikaty)
- Definicja kolorystyki i brandingu
- Szczegółowa struktura komponentów (podział na mniejsze komponenty)
- Filtrowanie subskrypcji po statusie
- Animacje i transitions
- Zaawansowana dostępność (keyboard navigation, focus management)

---

## Unresolved Issues

1. **Szczegółowa implementacja komponentów**: Dokładny podział odpowiedzialności między komponenty (np. czy SubscriptionList zawiera logikę paginacji, czy jest osobny komponent Pagination) zostanie ustalony podczas implementacji.

2. **Zachowanie przy wolnym połączeniu**: Nie zdefiniowano szczegółowo co pokazywać podczas ładowania początkowego (skeleton, spinner, pusty ekran). Podstawowa implementacja zakłada prosty stan loading.

3. **Obsługa błędu 503 z AI**: Podstawowa obsługa błędów nie definiuje szczegółowo UI dla niedostępności usługi AI. Na start wystarczy wyświetlenie komunikatu tekstowego w panelu.

4. **Refresh tokenów**: Supabase SSR obsługuje to automatycznie, ale nie zdefiniowano zachowania UI gdy token wygaśnie podczas aktywnej sesji użytkownika.

5. **Walidacja formularza rejestracji**: Nie sprecyzowano wymagań dotyczących siły hasła ani czy wymagane jest potwierdzenie email.

</conversation_summary>


# Implementation od UI - 1st attempt

### Uwaga: Wymagane będzie dodanie zmiennych środowiskowych PUBLIC_SUPABASE_URL i PUBLIC_SUPABASE_ANON_KEY w pliku .env dla dostępu po stronie klienta.