# Plan implementacji widoku Dashboard

## 1. Przegląd

Dashboard jest centralnym widokiem aplikacji Subbase, zapewniającym użytkownikom kompletne narzędzie do zarządzania subskrypcjami. Widok prezentuje podsumowanie kosztów miesięcznych i rocznych, listę wszystkich subskrypcji z paginacją, panel do generowania wglądów AI oraz dedykowany widok dla nowych użytkowników bez danych. Dashboard jest zbudowany jako interaktywny komponent React osadzony w stronie Astro, z pełną obsługą operacji CRUD poprzez API oraz responsywnym designem adaptującym się do różnych rozmiarów ekranów.

### 1.1 Powiązane dokumenty

- **PRD:** `.ai/prd.md` - sekcje Subscription Management i Overview & AI
- **UI Plan:** `.ai/ui-plan.md` - sekcja 2.2 Dashboard
- **API Plan:** `.ai/api-plan.md` - specyfikacja endpointów
- **Typy:** `src/types.ts` - definicje DTO i Command
- **Schematy:** `src/lib/schemas/subscription.schema.ts` - walidacja Zod
- **Middleware:** `src/middleware/index.ts` - obsługa sesji

### 1.2 Decyzje architektoniczne

- **Język komunikatów:** Polski (PL) - wszystkie komunikaty interfejsu w języku polskim
- **Walidacja:** Wykorzystanie istniejących schematów Zod z `subscription.schema.ts` (z lokalizacją komunikatów na PL)
- **Zarządzanie stanem:** Jeden główny `DashboardContext` zamiast wielu kontekstów (uproszczenie dla MVP)
- **Klient API:** Nowy plik `subscription-api.client.ts` (klient HTTP) - oddzielny od istniejącego `subscription.service.ts` (serwis backendowy)
- **Typy:** Wykorzystanie istniejących typów z `src/types.ts`, nowe typy ViewModel tylko gdzie konieczne

## 2. Routing widoku

- **Ścieżka:** `/`
- **Plik:** `src/pages/index.astro`
- **Ochrona:** Wymaga autentykacji (middleware weryfikuje sesję)
- **Przekierowanie:** Niezalogowani użytkownicy są przekierowywani na `/login`

## 3. Struktura komponentów

```
index.astro
└── Layout
    └── DashboardLayout (React, client:load)
        ├── TopBar
        │   ├── Logo
        │   └── LogoutButton
        ├── main
        │   ├── SummarySection
        │   │   ├── SummaryCard (miesięczny koszt)
        │   │   ├── SummaryCard (roczny koszt)
        │   │   └── StatusCounters
        │   │       ├── Badge (aktywne)
        │   │       ├── Badge (wstrzymane)
        │   │       └── Badge (anulowane)
        │   ├── SubscriptionSection
        │   │   ├── SectionHeader
        │   │   │   └── AddButton
        │   │   ├── SubscriptionList | EmptyState
        │   │   │   ├── SubscriptionItem (wiele)
        │   │   │   │   ├── SubscriptionInfo
        │   │   │   │   └── ActionButtons
        │   │   │   │       ├── EditButton
        │   │   │   │       └── DeleteButton
        │   │   └── Pagination
        │   └── AiInsightsPanel
        │       ├── PanelHeader (collapsible)
        │       ├── SubscriptionSelector (opcjonalny)
        │       ├── GenerateButton
        │       ├── InsightsList
        │       │   └── InsightItem (wiele)
        │       └── InsightsFooter (timestamp, disclaimer)
        ├── SubscriptionFormModal
        │   └── SubscriptionForm
        │       ├── FormField (name)
        │       ├── FormField (cost)
        │       ├── FormField (currency)
        │       ├── FormField (billing_cycle)
        │       ├── FormField (status)
        │       ├── FormField (start_date)
        │       ├── FormField (next_billing_date)
        │       ├── FormField (description)
        │       └── FormActions
        ├── DeleteConfirmDialog
        └── Toast (powiadomienia)
```

## 4. Szczegóły komponentów

### 4.1 DashboardLayout

- **Opis:** Główny kontener widoku dashboardu. Zarządza globalnym stanem aplikacji poprzez konteksty React, obsługuje pobieranie danych przy montowaniu oraz koordynuje komunikację między komponentami potomnymi.
- **Główne elementy:**
  - TopBar jako nagłówek
  - Element `<main>` z aria-label="Dashboard"
  - Obszary dla sekcji: summary, subscriptions, AI
  - Modalne okna (portal)
  - Toast container
- **Obsługiwane interakcje:**
  - Wylogowanie użytkownika
  - Obsługa błędu 401 (przekierowanie do /login)
- **Obsługiwana walidacja:** Brak (delegowana do komponentów potomnych)
- **Typy:**
  - `DashboardState`
  - `SubscriptionContextValue`
- **Propsy:**
  - `initialUser: User` - dane zalogowanego użytkownika z SSR

### 4.2 TopBar

- **Opis:** Nagłówek aplikacji widoczny na wszystkich stronach. Zawiera logo aplikacji (link do dashboardu) oraz przycisk wylogowania.
- **Główne elementy:**
  - Element `<header>` z aria-label
  - Logo/nazwa "Subbase" jako link do "/"
  - Button "Wyloguj" ze stanem loading
- **Obsługiwane interakcje:**
  - Kliknięcie logo - nawigacja do dashboardu
  - Kliknięcie "Wyloguj" - wylogowanie i przekierowanie do /login
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak specyficznych
- **Propsy:**
  - `onLogout: () => Promise<void>` - callback wylogowania

### 4.3 SummarySection

- **Opis:** Sekcja wyświetlająca podsumowanie finansowe użytkownika. Prezentuje miesięczne i roczne koszty oraz liczniki subskrypcji według statusu. Zawsze widoczna na górze dashboardu.
- **Główne elementy:**
  - Section z aria-labelledby
  - Grid z kartami podsumowania
  - SummaryCard dla kosztu miesięcznego
  - SummaryCard dla kosztu rocznego
  - StatusCounters z Badge dla każdego statusu
  - SkeletonLoader podczas ładowania
- **Obsługiwane interakcje:** Brak (komponent prezentacyjny)
- **Obsługiwana walidacja:** Brak
- **Typy:**
  - `SubscriptionSummaryDTO`
- **Propsy:**
  - `summary: SubscriptionSummaryDTO | null`
  - `isLoading: boolean`

### 4.4 SummaryCard

- **Opis:** Pojedyncza karta w sekcji podsumowania wyświetlająca wartość liczbową z etykietą.
- **Główne elementy:**
  - Card (Shadcn/ui)
  - Etykieta (np. "Koszt miesięczny")
  - Wartość sformatowana z walutą
- **Obsługiwane interakcje:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak specyficznych
- **Propsy:**
  - `label: string`
  - `value: number`
  - `currency: string`

### 4.5 StatusCounters

- **Opis:** Komponent wyświetlający liczniki subskrypcji według statusu jako kolorowe badge.
- **Główne elementy:**
  - Kontener flex
  - Badge "Aktywne" (zielony) z liczbą
  - Badge "Wstrzymane" (żółty) z liczbą
  - Badge "Anulowane" (czerwony) z liczbą
- **Obsługiwane interakcje:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak specyficznych
- **Propsy:**
  - `activeCount: number`
  - `pausedCount: number`
  - `cancelledCount: number`

### 4.6 SubscriptionList

- **Opis:** Główna lista subskrypcji użytkownika. Na desktop renderowana jako tabela, na mobile jako stos kart. Obsługuje stany: ładowanie (skeleton), pusta lista (EmptyState), dane (lista elementów).
- **Główne elementy:**
  - Warunkowe renderowanie: SkeletonLoader | EmptyState | Lista
  - Desktop: Table (Shadcn/ui) z thead i tbody
  - Mobile: Div z układem kart
  - SubscriptionItem dla każdej subskrypcji
- **Obsługiwane interakcje:**
  - Delegowane do SubscriptionItem (edycja, usuwanie)
- **Obsługiwana walidacja:** Brak
- **Typy:**
  - `SubscriptionDTO[]`
- **Propsy:**
  - `subscriptions: SubscriptionDTO[]`
  - `isLoading: boolean`
  - `onEdit: (subscription: SubscriptionDTO) => void`
  - `onDelete: (subscription: SubscriptionDTO) => void`

### 4.7 SubscriptionItem

- **Opis:** Pojedynczy element listy subskrypcji. Wyświetla wszystkie kluczowe informacje o subskrypcji oraz przyciski akcji.
- **Główne elementy:**
  - Desktop: TableRow z TableCell dla każdej kolumny
  - Mobile: Card z ułożonymi informacjami
  - Nazwa subskrypcji
  - Koszt sformatowany z walutą
  - Badge cyklu rozliczeniowego
  - Badge statusu (kolorowy)
  - Data następnego rozliczenia
  - IconButton edycji (ołówek)
  - IconButton usuwania (kosz)
- **Obsługiwane interakcje:**
  - Kliknięcie przycisku edycji - otwiera modal edycji
  - Kliknięcie przycisku usuwania - otwiera dialog potwierdzenia
- **Obsługiwana walidacja:** Brak
- **Typy:**
  - `SubscriptionDTO`
- **Propsy:**
  - `subscription: SubscriptionDTO`
  - `onEdit: () => void`
  - `onDelete: () => void`

### 4.8 EmptyState

- **Opis:** Dedykowany widok wyświetlany gdy użytkownik nie ma żadnych subskrypcji. Zawiera przyjazny komunikat i zachętę do dodania pierwszej subskrypcji.
- **Główne elementy:**
  - Kontener z centrowaniem
  - Ikona lub ilustracja
  - Nagłówek "Brak subskrypcji"
  - Tekst zachęcający
  - Button CTA "Dodaj pierwszą subskrypcję"
- **Obsługiwane interakcje:**
  - Kliknięcie CTA - otwiera modal dodawania
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak specyficznych
- **Propsy:**
  - `onAddClick: () => void`

### 4.9 Pagination

- **Opis:** Kontrolki paginacji dla listy subskrypcji. Wyświetla przyciski nawigacji i informację o aktualnej stronie.
- **Główne elementy:**
  - Kontener flex z justify-between
  - Button "Poprzednia" (disabled na pierwszej stronie)
  - Informacja "Strona X z Y"
  - Button "Następna" (disabled na ostatniej stronie)
- **Obsługiwane interakcje:**
  - Kliknięcie "Poprzednia" - przejście do poprzedniej strony
  - Kliknięcie "Następna" - przejście do następnej strony
- **Obsługiwana walidacja:** Brak
- **Typy:**
  - `PaginationDTO`
- **Propsy:**
  - `pagination: PaginationDTO`
  - `onPageChange: (page: number) => void`
  - `isLoading: boolean`

### 4.10 AiInsightsPanel

- **Opis:** Rozwijany panel umożliwiający generowanie wglądów AI. Zawiera opcjonalny wybór subskrypcji do analizy, przycisk generowania oraz listę wygenerowanych obserwacji.
- **Główne elementy:**
  - Collapsible (Shadcn/ui) jako kontener
  - CollapsibleTrigger z nagłówkiem i ikoną strzałki
  - CollapsibleContent z zawartością panelu
  - Opcjonalny SubscriptionSelector (checkboxy)
  - Button "Generuj wglądy AI" ze stanem loading
  - InsightsList z wygenerowanymi wglądami
  - Footer z timestamp i disclaimerem
  - Komunikat błędu dla 503
- **Obsługiwane interakcje:**
  - Kliknięcie nagłówka - rozwinięcie/zwinięcie panelu
  - Zaznaczanie checkboxów subskrypcji
  - Kliknięcie "Generuj wglądy AI" - wywołanie API
- **Obsługiwana walidacja:** Brak
- **Typy:**
  - `AIInsightsDataDTO`
  - `AIInsightsCommand`
- **Propsy:**
  - `subscriptions: SubscriptionDTO[]` - lista do wyboru
  - `onGenerateInsights: (subscriptionIds?: string[]) => Promise<AIInsightsDataDTO>`

### 4.11 InsightItem

- **Opis:** Pojedynczy element listy wglądów AI. Wyświetla typ obserwacji i treść komunikatu.
- **Główne elementy:**
  - Kontener z ikoną typu
  - Tekst komunikatu
- **Obsługiwane interakcje:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:**
  - `AIInsightDTO`
- **Propsy:**
  - `insight: AIInsightDTO`

### 4.12 SubscriptionFormModal

- **Opis:** Modal zawierający formularz dodawania i edycji subskrypcji. Tryb określany przez obecność initialData.
- **Główne elementy:**
  - Dialog (Shadcn/ui)
  - DialogContent z focus trap
  - DialogHeader z tytułem (dynamicznym)
  - SubscriptionForm
  - DialogFooter z przyciskami
- **Obsługiwane interakcje:**
  - Zamknięcie przez przycisk X
  - Zamknięcie przez kliknięcie overlay
  - Zamknięcie klawiszem Escape
  - Submit formularza
- **Obsługiwana walidacja:** Delegowana do SubscriptionForm
- **Typy:**
  - `SubscriptionDTO` (dla edycji)
  - `CreateSubscriptionCommand`
  - `UpdateSubscriptionCommand`
- **Propsy:**
  - `isOpen: boolean`
  - `onClose: () => void`
  - `initialData?: SubscriptionDTO` - dane do edycji (null = tryb dodawania)
  - `onSubmit: (data: CreateSubscriptionCommand | UpdateSubscriptionCommand) => Promise<void>`

### 4.13 SubscriptionForm

- **Opis:** Formularz do tworzenia i edycji subskrypcji. Zawiera wszystkie wymagane pola z odpowiednią walidacją.
- **Główne elementy:**
  - Element `<form>`
  - FormField name (Input text)
  - FormField cost (Input number)
  - FormField currency (Select)
  - FormField billing_cycle (Select)
  - FormField status (Select)
  - FormField start_date (Input date)
  - FormField next_billing_date (Input date, opcjonalne)
  - FormField description (Textarea, opcjonalne)
  - FormError dla błędów ogólnych
  - Button "Zapisz" ze stanem loading
  - Button "Anuluj"
- **Obsługiwane interakcje:**
  - Wypełnianie pól formularza
  - Submit formularza
  - Anulowanie (zamknięcie modalu)
- **Obsługiwana walidacja:**
  - name: wymagane, niepuste, max 255 znaków
  - cost: wymagane, > 0, ≤ 100000, max 2 miejsca po przecinku
  - currency: wymagane, 3 znaki (domyślnie PLN)
  - billing_cycle: wymagane, "monthly" lub "yearly"
  - status: wymagane, "active", "paused" lub "cancelled"
  - start_date: wymagane, format YYYY-MM-DD
  - next_billing_date: opcjonalne, format YYYY-MM-DD, musi być ≥ start_date
  - description: opcjonalne, max 1000 znaków
- **Typy:**
  - `SubscriptionFormValues`
  - `SubscriptionFormErrors`
  - `CreateSubscriptionCommand`
  - `UpdateSubscriptionCommand`
- **Propsy:**
  - `initialValues?: SubscriptionFormValues`
  - `onSubmit: (values: SubscriptionFormValues) => Promise<void>`
  - `onCancel: () => void`
  - `isSubmitting: boolean`
  - `submitError?: string`

### 4.14 DeleteConfirmDialog

- **Opis:** Dialog potwierdzenia usunięcia subskrypcji. Wymaga jawnego potwierdzenia przed usunięciem.
- **Główne elementy:**
  - AlertDialog (Shadcn/ui)
  - AlertDialogContent
  - AlertDialogHeader z ostrzeżeniem
  - AlertDialogDescription z nazwą subskrypcji
  - AlertDialogFooter z przyciskami
  - Button "Anuluj" (secondary)
  - Button "Usuń" (destructive) ze stanem loading
- **Obsługiwane interakcje:**
  - Kliknięcie "Anuluj" - zamknięcie bez akcji
  - Kliknięcie "Usuń" - wykonanie usunięcia
  - Naciśnięcie Escape - zamknięcie bez akcji
- **Obsługiwana walidacja:** Brak
- **Typy:**
  - `SubscriptionDTO`
- **Propsy:**
  - `isOpen: boolean`
  - `subscription: SubscriptionDTO | null`
  - `onClose: () => void`
  - `onConfirm: () => Promise<void>`
  - `isDeleting: boolean`

## 5. Typy

### 5.1 Wykorzystanie istniejących typów z `src/types.ts`

Wszystkie typy DTO i Command są już zdefiniowane w projekcie. **Nie duplikować**, tylko importować:

```typescript
// Import z src/types.ts
import type {
  // Enums
  SubscriptionStatus,
  BillingCycle,
  
  // DTOs (odpowiedzi API)
  SubscriptionDTO,
  SubscriptionListResponseDTO,
  SubscriptionResponseDTO,
  SubscriptionSummaryDTO,
  SubscriptionSummaryResponseDTO,
  PaginationDTO,
  
  // Commands (żądania API)
  CreateSubscriptionCommand,
  UpdateSubscriptionCommand,
  PatchSubscriptionCommand,
  SubscriptionQueryParams,
  
  // AI
  AIInsightsCommand,
  AIInsightsResponseDTO,
  AIInsightsDataDTO,
  AIInsightDTO,
  
  // Errors
  ErrorResponseDTO,
  FieldErrorDTO,
} from "@/types";
```

### 5.2 Nowe typy ViewModel (do utworzenia w `src/types/dashboard.types.ts`)

```typescript
import type { 
  SubscriptionDTO, 
  SubscriptionSummaryDTO, 
  PaginationDTO,
  AIInsightsDataDTO,
  BillingCycle,
  SubscriptionStatus,
  CreateSubscriptionCommand,
  UpdateSubscriptionCommand,
  SubscriptionQueryParams,
} from "@/types";

// ============================================================================
// Form ViewModel Types
// ============================================================================

/** 
 * Wartości formularza subskrypcji (ViewModel)
 * cost jest stringiem dla kontroli inputa, konwertowane na number przy submit
 */
export interface SubscriptionFormValues {
  name: string;
  cost: string;
  currency: string;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  start_date: string;
  next_billing_date: string;
  description: string;
}

/** Błędy walidacji formularza */
export type SubscriptionFormErrors = Partial<Record<keyof SubscriptionFormValues, string>>;

// ============================================================================
// Conversion Functions
// ============================================================================

/** Konwersja z SubscriptionDTO do SubscriptionFormValues */
export function subscriptionToFormValues(dto: SubscriptionDTO): SubscriptionFormValues {
  return {
    name: dto.name,
    cost: dto.cost.toString(),
    currency: dto.currency,
    billing_cycle: dto.billing_cycle,
    status: dto.status,
    start_date: dto.start_date,
    next_billing_date: dto.next_billing_date ?? "",
    description: dto.description ?? "",
  };
}

/** Konwersja z SubscriptionFormValues do CreateSubscriptionCommand */
export function formValuesToCreateCommand(values: SubscriptionFormValues): CreateSubscriptionCommand {
  return {
    name: values.name,
    cost: parseFloat(values.cost),
    currency: values.currency,
    billing_cycle: values.billing_cycle,
    status: values.status,
    start_date: values.start_date,
    next_billing_date: values.next_billing_date || null,
    description: values.description || null,
  };
}

/** Konwersja z SubscriptionFormValues do UpdateSubscriptionCommand */
export function formValuesToUpdateCommand(values: SubscriptionFormValues): UpdateSubscriptionCommand {
  return {
    name: values.name,
    cost: parseFloat(values.cost),
    currency: values.currency,
    billing_cycle: values.billing_cycle,
    status: values.status,
    start_date: values.start_date,
    next_billing_date: values.next_billing_date || null,
    description: values.description || null,
  };
}

// ============================================================================
// Dashboard State Types
// ============================================================================

/** Główny stan dashboardu (dla DashboardContext) */
export interface DashboardState {
  // Dane
  subscriptions: SubscriptionDTO[];
  summary: SubscriptionSummaryDTO | null;
  pagination: PaginationDTO;
  
  // Stany ładowania
  isLoading: boolean;
  isSummaryLoading: boolean;
  
  // Błędy
  error: string | null;
  
  // AI Insights
  aiInsights: AIInsightsDataDTO | null;
  isGeneratingInsights: boolean;
  aiError: string | null;
  
  // Modal/Dialog
  formModal: {
    isOpen: boolean;
    mode: "create" | "edit";
    editingSubscription: SubscriptionDTO | null;
  };
  deleteDialog: {
    isOpen: boolean;
    subscription: SubscriptionDTO | null;
    isDeleting: boolean;
  };
}

// ============================================================================
// Context Types
// ============================================================================

/** Wartość DashboardContext */
export interface DashboardContextValue extends DashboardState {
  // Akcje CRUD
  fetchSubscriptions: (params?: SubscriptionQueryParams) => Promise<void>;
  fetchSummary: () => Promise<void>;
  createSubscription: (data: CreateSubscriptionCommand) => Promise<SubscriptionDTO>;
  updateSubscription: (id: string, data: UpdateSubscriptionCommand) => Promise<SubscriptionDTO>;
  deleteSubscription: (id: string) => Promise<void>;
  
  // Akcje paginacji
  setPage: (page: number) => void;
  
  // Akcje AI
  generateInsights: (subscriptionIds?: string[]) => Promise<void>;
  
  // Akcje modali
  openCreateModal: () => void;
  openEditModal: (subscription: SubscriptionDTO) => void;
  closeFormModal: () => void;
  openDeleteDialog: (subscription: SubscriptionDTO) => void;
  closeDeleteDialog: () => void;
}
```

## 6. Zarządzanie stanem

### 6.1 Architektura - jeden DashboardContext

Dla MVP stosujemy **jeden główny kontekst** zamiast wielu mniejszych. Upraszcza to implementację i debugging.

```typescript
// src/lib/contexts/DashboardContext.tsx
import { createContext, useContext, useReducer, useCallback } from "react";
import type { DashboardContextValue, DashboardState } from "@/types/dashboard.types";
import * as api from "@/lib/services/subscription-api.client";

const initialState: DashboardState = {
  subscriptions: [],
  summary: null,
  pagination: { page: 1, limit: 10, total: 0, total_pages: 0 },
  isLoading: true,
  isSummaryLoading: true,
  error: null,
  aiInsights: null,
  isGeneratingInsights: false,
  aiError: null,
  formModal: { isOpen: false, mode: "create", editingSubscription: null },
  deleteDialog: { isOpen: false, subscription: null, isDeleting: false },
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  
  // Implementacja akcji przez useCallback...
  // Każda akcja wywołuje API client i aktualizuje stan przez dispatch
  
  return (
    <DashboardContext.Provider value={{ ...state, /* akcje */ }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}
```

### 6.2 Custom Hooks (wydzielone z kontekstu)

**useSubscriptionForm** - zarządzanie stanem formularza z walidacją Zod:

```typescript
// src/lib/hooks/useSubscriptionForm.ts
import { useState, useCallback } from "react";
import { subscriptionFormSchema } from "@/lib/schemas/subscription-form.schema";
import type { SubscriptionFormValues, SubscriptionFormErrors } from "@/types/dashboard.types";

export function useSubscriptionForm(initialValues?: Partial<SubscriptionFormValues>) {
  const [values, setValues] = useState<SubscriptionFormValues>(/* defaults */);
  const [errors, setErrors] = useState<SubscriptionFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const validate = useCallback(() => {
    const result = subscriptionFormSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors(/* mapuj fieldErrors na SubscriptionFormErrors */);
      return false;
    }
    setErrors({});
    return true;
  }, [values]);
  
  // handleChange, handleBlur, handleSubmit, reset
  
  return { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit, reset, validate };
}
```

### 6.3 Schema walidacji formularza (z polskimi komunikatami)

Utworzyć plik `src/lib/schemas/subscription-form.schema.ts`:

```typescript
import { z } from "zod";

export const subscriptionFormSchema = z
  .object({
    name: z
      .string()
      .min(1, "Nazwa jest wymagana")
      .max(255, "Nazwa może mieć maksymalnie 255 znaków"),
    cost: z
      .string()
      .min(1, "Koszt jest wymagany")
      .refine((val) => !isNaN(parseFloat(val)), "Koszt musi być liczbą")
      .refine((val) => parseFloat(val) > 0, "Koszt musi być większy od 0")
      .refine((val) => parseFloat(val) <= 100000, "Koszt nie może przekraczać 100 000")
      .refine((val) => /^\d+(\.\d{1,2})?$/.test(val), "Koszt może mieć maksymalnie 2 miejsca po przecinku"),
    currency: z
      .string()
      .length(3, "Waluta musi mieć 3 znaki"),
    billing_cycle: z.enum(["monthly", "yearly"], {
      errorMap: () => ({ message: "Wybierz cykl rozliczeniowy" }),
    }),
    status: z.enum(["active", "paused", "cancelled"], {
      errorMap: () => ({ message: "Wybierz status" }),
    }),
    start_date: z
      .string()
      .min(1, "Data rozpoczęcia jest wymagana")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Nieprawidłowy format daty"),
    next_billing_date: z
      .string()
      .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Nieprawidłowy format daty")
      .optional()
      .or(z.literal("")),
    description: z
      .string()
      .max(1000, "Opis może mieć maksymalnie 1000 znaków")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => !data.next_billing_date || data.next_billing_date >= data.start_date,
    {
      message: "Data następnego rozliczenia nie może być wcześniejsza niż data rozpoczęcia",
      path: ["next_billing_date"],
    }
  );

export type SubscriptionFormSchema = z.infer<typeof subscriptionFormSchema>;
```

### 6.4 Stan lokalny komponentów

Niektóre stany są zarządzane lokalnie w komponentach (nie w kontekście):
- `AiInsightsPanel` - `isExpanded`, `selectedSubscriptionIds` (UI state)
- `SubscriptionForm` - przez hook `useSubscriptionForm`

## 7. Integracja API

### 7.1 Pobieranie listy subskrypcji

- **Endpoint:** `GET /api/subscriptions`
- **Query params:** `page`, `limit`, `status` (opcjonalny)
- **Typ żądania:** `SubscriptionQueryParams`
- **Typ odpowiedzi:** `SubscriptionListResponseDTO`
- **Moment wywołania:** Przy montowaniu, zmianie strony, po operacjach CRUD

### 7.2 Pobieranie podsumowania

- **Endpoint:** `GET /api/subscriptions/summary`
- **Typ odpowiedzi:** `SubscriptionSummaryResponseDTO`
- **Moment wywołania:** Przy montowaniu, po operacjach CRUD

### 7.3 Tworzenie subskrypcji

- **Endpoint:** `POST /api/subscriptions`
- **Typ żądania:** `CreateSubscriptionCommand`
- **Typ odpowiedzi:** `SubscriptionResponseDTO`
- **Moment wywołania:** Submit formularza w trybie dodawania

### 7.4 Aktualizacja subskrypcji

- **Endpoint:** `PUT /api/subscriptions/:id`
- **Typ żądania:** `UpdateSubscriptionCommand`
- **Typ odpowiedzi:** `SubscriptionResponseDTO`
- **Moment wywołania:** Submit formularza w trybie edycji

### 7.5 Usuwanie subskrypcji

- **Endpoint:** `DELETE /api/subscriptions/:id`
- **Typ odpowiedzi:** Status 204 (brak body)
- **Moment wywołania:** Potwierdzenie w DeleteConfirmDialog

### 7.6 Generowanie wglądów AI

- **Endpoint:** `POST /api/ai/insights`
- **Typ żądania:** `AIInsightsCommand`
- **Typ odpowiedzi:** `AIInsightsResponseDTO`
- **Moment wywołania:** Kliknięcie "Generuj wglądy AI"

### 7.7 Obsługa tokenów

Wszystkie żądania API wymagają tokena JWT w nagłówku Authorization:

```typescript
const token = await supabase.auth.getSession().then(s => s.data.session?.access_token);
const response = await fetch(url, {
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  // ...
});
```

## 7A. Integracja z Middleware

### 7A.1 Działanie middleware (`src/middleware/index.ts`)

Istniejący middleware automatycznie:
- Tworzy instancję klienta Supabase i ustawia `context.locals.supabase`
- Dla stron Astro (non-API routes): używa cookie-based session
- Dla API routes: używa Bearer token z nagłówka Authorization
- Weryfikuje sesję i ustawia `context.locals.user`

### 7A.2 Ochrona strony dashboard w index.astro

```astro
---
// src/pages/index.astro
import Layout from "@/layouts/Layout.astro";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

// Middleware automatycznie ustawia locals.user
const user = Astro.locals.user;

// Przekieruj niezalogowanych użytkowników
if (!user) {
  return Astro.redirect("/login");
}

// Przekaż user do komponentu React (opcjonalnie, dla wyświetlenia email w TopBar)
---

<Layout title="Dashboard - Subbase">
  <DashboardLayout client:load />
</Layout>
```

### 7A.3 Obsługa wygasłej sesji (401)

Gdy API zwraca 401:
1. Klient API wyrzuca błąd z kodem "UNAUTHORIZED"
2. DashboardContext przechwytuje błąd
3. Wyświetla toast "Sesja wygasła. Zaloguj się ponownie."
4. Przekierowuje na `/login` przez `window.location.href`

```typescript
// W subscription-api.client.ts
if (response.status === 401) {
  throw new ApiError("Sesja wygasła", "UNAUTHORIZED", 401);
}

// W DashboardContext
catch (error) {
  if (error instanceof ApiError && error.code === "UNAUTHORIZED") {
    toast.error("Sesja wygasła. Zaloguj się ponownie.");
    window.location.href = "/login";
    return;
  }
  // ... inne błędy
}
```

## 8. Interakcje użytkownika

| Interakcja | Komponent | Rezultat |
|------------|-----------|----------|
| Kliknięcie "Dodaj subskrypcję" | SectionHeader/EmptyState | Otwarcie modalu w trybie dodawania |
| Kliknięcie ikony edycji | SubscriptionItem | Otwarcie modalu z danymi subskrypcji |
| Kliknięcie ikony usuwania | SubscriptionItem | Otwarcie dialogu potwierdzenia |
| Wypełnienie formularza i submit | SubscriptionForm | Walidacja, wysłanie żądania, toast, zamknięcie modalu |
| Potwierdzenie usunięcia | DeleteConfirmDialog | Wysłanie żądania DELETE, toast, odświeżenie listy |
| Kliknięcie "Poprzednia"/"Następna" | Pagination | Zmiana strony, pobranie nowych danych |
| Rozwinięcie panelu AI | AiInsightsPanel | Wyświetlenie zawartości panelu |
| Kliknięcie "Generuj wglądy AI" | AiInsightsPanel | Wywołanie API, wyświetlenie wyników lub błędu |
| Kliknięcie "Wyloguj" | TopBar | Wylogowanie, przekierowanie do /login |
| Naciśnięcie Escape w modalu | SubscriptionFormModal | Zamknięcie modalu bez zapisywania |

## 9. Warunki i walidacja

### 9.1 Walidacja pola name

- **Warunek:** Pole nie może być puste
- **Warunek:** Maksymalnie 255 znaków
- **Komunikat błędu (puste):** "Nazwa jest wymagana"
- **Komunikat błędu (długość):** "Nazwa może mieć maksymalnie 255 znaków"

### 9.2 Walidacja pola cost

- **Warunek:** Pole nie może być puste
- **Warunek:** Wartość > 0
- **Warunek:** Wartość ≤ 100000
- **Warunek:** Maksymalnie 2 miejsca po przecinku
- **Komunikat błędu (puste):** "Koszt jest wymagany"
- **Komunikat błędu (min):** "Koszt musi być większy od 0"
- **Komunikat błędu (max):** "Koszt nie może przekraczać 100 000"
- **Komunikat błędu (decimal):** "Koszt może mieć maksymalnie 2 miejsca po przecinku"

### 9.3 Walidacja pola currency

- **Warunek:** Pole nie może być puste
- **Warunek:** Dokładnie 3 znaki
- **Wartość domyślna:** "PLN"
- **Komunikat błędu:** "Waluta musi mieć 3 znaki"

### 9.4 Walidacja pola billing_cycle

- **Warunek:** Pole nie może być puste
- **Warunek:** Wartość musi być "monthly" lub "yearly"
- **Komunikat błędu:** "Wybierz cykl rozliczeniowy"

### 9.5 Walidacja pola status

- **Warunek:** Pole nie może być puste
- **Warunek:** Wartość musi być "active", "paused" lub "cancelled"
- **Wartość domyślna:** "active"
- **Komunikat błędu:** "Wybierz status"

### 9.6 Walidacja pola start_date

- **Warunek:** Pole nie może być puste
- **Warunek:** Format YYYY-MM-DD
- **Komunikat błędu (puste):** "Data rozpoczęcia jest wymagana"
- **Komunikat błędu (format):** "Nieprawidłowy format daty"

### 9.7 Walidacja pola next_billing_date

- **Warunek:** Opcjonalne (może być puste lub null)
- **Warunek:** Jeśli podane, format YYYY-MM-DD
- **Warunek:** Jeśli podane, musi być ≥ start_date
- **Komunikat błędu (format):** "Nieprawidłowy format daty"
- **Komunikat błędu (relacja):** "Data następnego rozliczenia nie może być wcześniejsza niż data rozpoczęcia"

### 9.8 Walidacja pola description

- **Warunek:** Opcjonalne
- **Warunek:** Maksymalnie 1000 znaków
- **Komunikat błędu:** "Opis może mieć maksymalnie 1000 znaków"

### 9.9 Wpływ walidacji na interfejs

- Błędy wyświetlane inline pod polami
- Pola z błędami mają czerwoną ramkę i aria-invalid="true"
- Przycisk "Zapisz" jest aktywny, walidacja przy submit
- Podczas wysyłania przyciski są wyłączone, widoczny spinner

## 10. Obsługa błędów

### 10.1 Błędy walidacji (400)

- Wyświetlane inline w formularzu
- Struktura odpowiedzi: `ErrorResponseDTO` z `details: FieldErrorDTO[]`
- Mapowanie pól błędów na pola formularza

### 10.2 Błędy autoryzacji (401)

- Automatyczne przekierowanie do `/login`
- Toast z komunikatem: "Sesja wygasła. Zaloguj się ponownie."
- Czyszczenie stanu sesji

### 10.3 Błędy "nie znaleziono" (404)

- Toast z komunikatem: "Subskrypcja nie została znaleziona"
- Odświeżenie listy subskrypcji

### 10.4 Błędy serwera (500)

- Toast z komunikatem: "Wystąpił błąd serwera. Spróbuj ponownie później."
- Zachowanie aktualnego stanu interfejsu

### 10.5 Niedostępność usługi AI (503)

- Wyświetlenie komunikatu w panelu AI: "Usługa AI jest tymczasowo niedostępna"
- Pozostałe funkcjonalności dashboardu działają normalnie
- Przycisk generowania wraca do stanu aktywnego

### 10.6 Błędy sieciowe

- Toast z komunikatem: "Nie można połączyć z serwerem"
- Możliwość ponowienia akcji
- Zachowanie wpisanych danych w formularzu

### 10.7 Implementacja toast notifications

Wykorzystanie Sonner z Shadcn/ui dla spójnych powiadomień:

```typescript
// Sukces
toast.success("Subskrypcja została dodana");
toast.success("Subskrypcja została zaktualizowana");
toast.success("Subskrypcja została usunięta");

// Błędy
toast.error("Nie udało się zapisać subskrypcji");
toast.error("Nie udało się usunąć subskrypcji");
toast.error("Sesja wygasła. Zaloguj się ponownie.");
```

## 11. Kroki implementacji

### Faza 1: Przygotowanie infrastruktury

#### Krok 1.1: Instalacja komponentów Shadcn/ui

```bash
npx shadcn@latest add table dialog alert-dialog collapsible select textarea badge skeleton sonner
```

**Uwaga:** Input, Label, Card, Button już istnieją w projekcie.

#### Krok 1.2: Utworzenie typów ViewModel

Utworzyć plik `src/types/dashboard.types.ts`:
- `SubscriptionFormValues`, `SubscriptionFormErrors`
- `DashboardState`, `DashboardContextValue`
- Funkcje konwersji: `subscriptionToFormValues`, `formValuesToCreateCommand`, `formValuesToUpdateCommand`

#### Krok 1.3: Utworzenie schematu walidacji formularza

Utworzyć plik `src/lib/schemas/subscription-form.schema.ts`:
- Schema Zod z polskimi komunikatami błędów
- Walidacja wszystkich pól zgodna z `subscription.schema.ts`

#### Krok 1.4: Implementacja klienta API

Utworzyć plik `src/lib/services/subscription-api.client.ts`:

```typescript
import type {
  SubscriptionListResponseDTO,
  SubscriptionResponseDTO,
  SubscriptionSummaryResponseDTO,
  AIInsightsResponseDTO,
  CreateSubscriptionCommand,
  UpdateSubscriptionCommand,
  SubscriptionQueryParams,
  AIInsightsCommand,
  ErrorResponseDTO,
} from "@/types";

const API_BASE = "/api";

async function getAuthHeaders(): Promise<HeadersInit> {
  // Pobierz token z Supabase session
  const { createSupabaseBrowserClient } = await import("@/db/supabase.browser");
  const supabase = createSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    "Content-Type": "application/json",
    ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
  };
}

export async function fetchSubscriptions(params?: SubscriptionQueryParams): Promise<SubscriptionListResponseDTO> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", params.page.toString());
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.status) query.set("status", params.status);
  
  const response = await fetch(`${API_BASE}/subscriptions?${query}`, {
    headers: await getAuthHeaders(),
  });
  
  if (!response.ok) {
    const error: ErrorResponseDTO = await response.json();
    throw new ApiError(error.error.message, error.error.code, response.status);
  }
  
  return response.json();
}

// Analogicznie: fetchSummary, createSubscription, updateSubscription, 
// deleteSubscription, generateInsights
```

### Faza 2: Zarządzanie stanem

#### Krok 2.1: Implementacja DashboardContext

Utworzyć plik `src/lib/contexts/DashboardContext.tsx`:
- Provider z useReducer dla zarządzania stanem
- Wszystkie akcje CRUD i AI
- Akcje obsługi modali/dialogów
- Hook `useDashboard()`

#### Krok 2.2: Implementacja useSubscriptionForm

Utworzyć plik `src/lib/hooks/useSubscriptionForm.ts`:
- Zarządzanie wartościami formularza
- Walidacja przez schema Zod
- handleChange, handleBlur, handleSubmit, reset

### Faza 3: Komponenty prezentacyjne

#### Krok 3.1: TopBar

Utworzyć `src/components/dashboard/TopBar.tsx`:
- Logo "Subbase" jako link do "/"
- Przycisk "Wyloguj" z integracją Supabase Auth signOut

#### Krok 3.2: SummarySection

Utworzyć pliki:
- `src/components/dashboard/SummarySection.tsx` - kontener sekcji
- `src/components/dashboard/SummaryCard.tsx` - karta z wartością
- `src/components/dashboard/StatusCounters.tsx` - badge ze statusami

#### Krok 3.3: SubscriptionList

Utworzyć pliki:
- `src/components/dashboard/SubscriptionList.tsx` - lista/tabela
- `src/components/dashboard/SubscriptionItem.tsx` - pojedynczy element
- `src/components/dashboard/EmptyState.tsx` - widok pustej listy
- `src/components/dashboard/Pagination.tsx` - kontrolki paginacji

### Faza 4: Komponenty interaktywne

#### Krok 4.1: SubscriptionForm i Modal

Utworzyć pliki:
- `src/components/dashboard/SubscriptionForm.tsx` - formularz z walidacją
- `src/components/dashboard/SubscriptionFormModal.tsx` - modal opakowujący

#### Krok 4.2: DeleteConfirmDialog

Utworzyć `src/components/dashboard/DeleteConfirmDialog.tsx`:
- AlertDialog z Shadcn/ui
- Przycisk "Usuń" ze stanem loading

#### Krok 4.3: AiInsightsPanel

Utworzyć pliki:
- `src/components/dashboard/AiInsightsPanel.tsx` - rozwijany panel
- `src/components/dashboard/InsightItem.tsx` - pojedynczy insight

### Faza 5: Integracja

#### Krok 5.1: DashboardLayout

Utworzyć `src/components/dashboard/DashboardLayout.tsx`:
- Kompozycja wszystkich sekcji
- Owinięcie w `DashboardProvider`
- useEffect do inicjalnego pobrania danych
- Toaster z Sonner

#### Krok 5.2: Strona Astro

Zaktualizować `src/pages/index.astro`:

```astro
---
import Layout from "@/layouts/Layout.astro";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

// Middleware ustawia locals.user
const user = Astro.locals.user;

// Przekieruj niezalogowanych do /login
if (!user) {
  return Astro.redirect("/login");
}
---

<Layout title="Dashboard - Subbase">
  <DashboardLayout client:load initialUser={user} />
</Layout>
```

### Faza 6: Polish

#### Krok 6.1: Stylowanie i responsywność

- Grid layout dla SummarySection (1 kolumna mobile, 2-3 desktop)
- Responsywne przełączanie Table ↔ Cards w SubscriptionList
- Skeleton loaders dla wszystkich sekcji ładowania
- Spójne marginesy i paddingi (Tailwind spacing scale)

#### Krok 6.2: Dostępność

- `aria-label` na wszystkich interactive elements
- `role="region"` z `aria-labelledby` na sekcjach
- Focus trap w modalach (obsługiwane przez Shadcn Dialog)
- Skip link do main content

#### Krok 6.3: Testowanie manualne

Scenariusze do przetestowania:
- [ ] Dashboard ładuje się z danymi użytkownika
- [ ] Empty state dla nowego użytkownika
- [ ] Dodanie subskrypcji → lista i summary się odświeżają
- [ ] Edycja subskrypcji → zmiany widoczne na liście
- [ ] Usunięcie subskrypcji → element znika, summary się aktualizuje
- [ ] Paginacja działa poprawnie
- [ ] Generowanie AI insights (sukces i błąd 503)
- [ ] Wylogowanie → przekierowanie na /login
- [ ] Błąd 401 → automatyczne przekierowanie
- [ ] Responsywność na mobile
- [ ] Nawigacja klawiaturą

---

## 12. Historia zmian dokumentu

### v1.1 (2026-01-21)

Zmiany wprowadzone po code review:

1. **Dodano sekcję 1.1 Powiązane dokumenty** - jawne odniesienia do PRD, UI Plan, API Plan, types.ts, schematów Zod i middleware
2. **Dodano sekcję 1.2 Decyzje architektoniczne** - język PL, uproszczony jeden DashboardContext, rozdzielenie klienta API od serwisu backendowego
3. **Przebudowano sekcję 5 Typy**:
   - Dodano jawne importy z `src/types.ts` (zamiast duplikowania)
   - Nowe typy ViewModel tylko gdzie konieczne (`SubscriptionFormValues`, `DashboardState`)
   - Dodano funkcje konwersji między DTO a ViewModel
4. **Uproszczono sekcję 6 Zarządzanie stanem**:
   - Jeden `DashboardContext` zamiast wielu kontekstów
   - Dodano pełny schema walidacji formularza z polskimi komunikatami (`subscription-form.schema.ts`)
5. **Dodano sekcję 7A Integracja z Middleware** - opis działania middleware i obsługi 401
6. **Przeorganizowano kroki implementacji**:
   - Podział na fazy: Infrastruktura → Stan → Komponenty prezentacyjne → Komponenty interaktywne → Integracja → Polish
   - Logiczna kolejność: typy → schematy → klient API → kontekst → komponenty → strona
   - Dodano przykłady kodu dla klienta API
7. **Rozszerzono scenariusze testowe** - konkretne przypadki z checklistą
