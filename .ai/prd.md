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

### Authentication

- As a user, I can register and log in to access my subscriptions.
- As a user, my data is private and isolated from other users.

### Subscription Management

- As a user, I can add, edit, and remove subscriptions.
- As a user, I can see all my subscriptions in one place.

### Overview & AI

- As a user, I can see how much I spend monthly and yearly.
- As a user, I can optionally trigger AI insights to better understand my subscriptions.

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
