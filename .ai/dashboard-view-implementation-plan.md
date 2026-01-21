# Plan implementacji widoku Dashboard

## 1. Przegląd

Dashboard jest centralnym widokiem aplikacji Subbase, zapewniającym użytkownikom kompletne narzędzie do zarządzania subskrypcjami. Widok prezentuje podsumowanie kosztów miesięcznych i rocznych, listę wszystkich subskrypcji z paginacją, panel do generowania wglądów AI oraz dedykowany widok dla nowych użytkowników bez danych. Dashboard jest zbudowany jako interaktywny komponent React osadzony w stronie Astro, z pełną obsługą operacji CRUD poprzez API oraz responsywnym designem adaptującym się do różnych rozmiarów ekranów.

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

### 5.1 Typy ViewModel dla formularza subskrypcji

```typescript
/** Wartości formularza subskrypcji */
interface SubscriptionFormValues {
  name: string;
  cost: string; // string dla kontroli inputa, konwertowane na number
  currency: string;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  start_date: string; // format YYYY-MM-DD
  next_billing_date: string; // format YYYY-MM-DD lub pusty string
  description: string;
}

/** Błędy walidacji formularza subskrypcji */
interface SubscriptionFormErrors {
  name?: string;
  cost?: string;
  currency?: string;
  billing_cycle?: string;
  status?: string;
  start_date?: string;
  next_billing_date?: string;
  description?: string;
}

/** Konwersja z SubscriptionDTO do SubscriptionFormValues */
function subscriptionToFormValues(dto: SubscriptionDTO): SubscriptionFormValues;

/** Konwersja z SubscriptionFormValues do CreateSubscriptionCommand */
function formValuesToCreateCommand(values: SubscriptionFormValues): CreateSubscriptionCommand;

/** Konwersja z SubscriptionFormValues do UpdateSubscriptionCommand */
function formValuesToUpdateCommand(values: SubscriptionFormValues): UpdateSubscriptionCommand;
```

### 5.2 Typy stanu dashboardu

```typescript
/** Stan głównego widoku dashboardu */
interface DashboardState {
  subscriptions: SubscriptionDTO[];
  summary: SubscriptionSummaryDTO | null;
  pagination: PaginationDTO;
  isLoading: boolean;
  error: string | null;
}

/** Stan panelu AI */
interface AiInsightsState {
  insights: AIInsightsDataDTO | null;
  selectedSubscriptionIds: string[];
  isGenerating: boolean;
  error: string | null;
  isExpanded: boolean;
}

/** Stan modalu formularza */
interface FormModalState {
  isOpen: boolean;
  mode: "create" | "edit";
  editingSubscription: SubscriptionDTO | null;
}

/** Stan dialogu usuwania */
interface DeleteDialogState {
  isOpen: boolean;
  subscription: SubscriptionDTO | null;
  isDeleting: boolean;
}
```

### 5.3 Typy z src/types.ts (wykorzystywane)

```typescript
// Już zdefiniowane w src/types.ts - do wykorzystania:
type SubscriptionDTO;
type SubscriptionListResponseDTO;
type SubscriptionResponseDTO;
type SubscriptionSummaryDTO;
type SubscriptionSummaryResponseDTO;
type CreateSubscriptionCommand;
type UpdateSubscriptionCommand;
type PatchSubscriptionCommand;
type SubscriptionQueryParams;
type AIInsightsCommand;
type AIInsightsResponseDTO;
type AIInsightsDataDTO;
type AIInsightDTO;
type PaginationDTO;
type ErrorResponseDTO;
type SubscriptionStatus;
type BillingCycle;
```

### 5.4 Typy kontekstu

```typescript
/** Wartość kontekstu subskrypcji */
interface SubscriptionContextValue {
  // Stan
  subscriptions: SubscriptionDTO[];
  summary: SubscriptionSummaryDTO | null;
  pagination: PaginationDTO;
  isLoading: boolean;
  error: string | null;
  
  // Akcje
  fetchSubscriptions: (params?: SubscriptionQueryParams) => Promise<void>;
  fetchSummary: () => Promise<void>;
  createSubscription: (data: CreateSubscriptionCommand) => Promise<SubscriptionDTO>;
  updateSubscription: (id: string, data: UpdateSubscriptionCommand) => Promise<SubscriptionDTO>;
  deleteSubscription: (id: string) => Promise<void>;
  setPage: (page: number) => void;
}
```

## 6. Zarządzanie stanem

### 6.1 SubscriptionContext

Główny kontekst zarządzający danymi subskrypcji i operacjami CRUD:

```typescript
const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionDTO[]>([]);
  const [summary, setSummary] = useState<SubscriptionSummaryDTO | null>(null);
  const [pagination, setPagination] = useState<PaginationDTO>({ page: 1, limit: 10, total: 0, total_pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Implementacja akcji...
}

function useSubscriptions() {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error("useSubscriptions must be used within SubscriptionProvider");
  return context;
}
```

### 6.2 Custom Hooks

**useSubscriptionForm** - zarządzanie stanem formularza subskrypcji:

```typescript
function useSubscriptionForm(initialValues?: SubscriptionFormValues) {
  // Zwraca: values, errors, isSubmitting, handleChange, handleSubmit, reset
}
```

**useAiInsights** - zarządzanie panelem AI:

```typescript
function useAiInsights() {
  // Zwraca: insights, isGenerating, error, isExpanded, selectedIds, 
  //         toggleExpanded, toggleSubscription, generateInsights
}
```

**useDeleteConfirm** - zarządzanie dialogiem usuwania:

```typescript
function useDeleteConfirm() {
  // Zwraca: isOpen, subscription, isDeleting, openDialog, closeDialog, confirmDelete
}
```

### 6.3 Stan lokalny komponentów

- `SubscriptionFormModal` - isOpen, mode
- `AiInsightsPanel` - isExpanded, selectedSubscriptionIds
- `Pagination` - zarządzane przez SubscriptionContext

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

### Krok 1: Instalacja wymaganych komponentów Shadcn/ui

Zainstalować przez CLI Shadcn:
- Table
- Dialog
- AlertDialog
- Collapsible
- Select
- Input (jeśli nie ma)
- Label (jeśli nie ma)
- Textarea
- Badge
- Skeleton
- Sonner (toast)

### Krok 2: Utworzenie typów ViewModel

Utworzyć plik `src/types/dashboard.types.ts`:
- SubscriptionFormValues i SubscriptionFormErrors
- DashboardState, AiInsightsState, FormModalState, DeleteDialogState
- Funkcje konwersji między DTO a ViewModel

### Krok 3: Implementacja SubscriptionContext

Utworzyć plik `src/lib/contexts/SubscriptionContext.tsx`:
- Definicja kontekstu i providera
- Implementacja fetchSubscriptions, fetchSummary
- Implementacja createSubscription, updateSubscription, deleteSubscription
- Hook useSubscriptions

### Krok 4: Implementacja serwisu API

Utworzyć plik `src/lib/services/subscription-api.service.ts`:
- Funkcje do komunikacji z API
- Obsługa tokenów i nagłówków
- Mapowanie odpowiedzi i błędów

### Krok 5: Implementacja komponentu TopBar

Utworzyć plik `src/components/dashboard/TopBar.tsx`:
- Logo z linkiem do "/"
- Przycisk wylogowania z integracją Supabase Auth

### Krok 6: Implementacja SummarySection

Utworzyć pliki:
- `src/components/dashboard/SummarySection.tsx`
- `src/components/dashboard/SummaryCard.tsx`
- `src/components/dashboard/StatusCounters.tsx`

### Krok 7: Implementacja SubscriptionList

Utworzyć pliki:
- `src/components/dashboard/SubscriptionList.tsx`
- `src/components/dashboard/SubscriptionItem.tsx`
- `src/components/dashboard/EmptyState.tsx`

### Krok 8: Implementacja Pagination

Utworzyć plik `src/components/dashboard/Pagination.tsx`:
- Przyciski nawigacji
- Wyświetlanie informacji o stronach
- Obsługa stanów disabled

### Krok 9: Implementacja SubscriptionForm

Utworzyć plik `src/components/dashboard/SubscriptionForm.tsx`:
- Wszystkie pola formularza
- Walidacja zgodna ze specyfikacją API
- Hook useSubscriptionForm

### Krok 10: Implementacja SubscriptionFormModal

Utworzyć plik `src/components/dashboard/SubscriptionFormModal.tsx`:
- Dialog z Shadcn/ui
- Integracja z SubscriptionForm
- Obsługa trybów create/edit

### Krok 11: Implementacja DeleteConfirmDialog

Utworzyć plik `src/components/dashboard/DeleteConfirmDialog.tsx`:
- AlertDialog z Shadcn/ui
- Wyświetlanie nazwy subskrypcji
- Obsługa stanu loading przy usuwaniu

### Krok 12: Implementacja AiInsightsPanel

Utworzyć pliki:
- `src/components/dashboard/AiInsightsPanel.tsx`
- `src/components/dashboard/InsightItem.tsx`
- Hook useAiInsights

### Krok 13: Implementacja DashboardLayout

Utworzyć plik `src/components/dashboard/DashboardLayout.tsx`:
- Kompozycja wszystkich sekcji
- Owinięcie w SubscriptionProvider
- Inicjalizacja pobierania danych

### Krok 14: Utworzenie strony Astro

Zaktualizować plik `src/pages/index.astro`:
- Sprawdzenie sesji użytkownika
- Przekierowanie niezalogowanych do /login
- Osadzenie DashboardLayout z client:load

### Krok 15: Stylowanie i responsywność

- Implementacja układu grid dla SummarySection
- Responsywne przełączanie Table/Cards w SubscriptionList
- Responsywne marginesy i paddingi
- Skeleton loaders dla wszystkich sekcji

### Krok 16: Implementacja dostępności

- Dodanie aria-labels do wszystkich sekcji
- Implementacja focus trap w modalach
- Skip link do głównej treści
- Testowanie nawigacji klawiaturą

### Krok 17: Testowanie integracyjne

- Test pełnego cyklu CRUD
- Test paginacji
- Test generowania wglądów AI
- Test obsługi błędów
- Test responsywności
- Test dostępności
