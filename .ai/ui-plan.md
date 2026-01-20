# Architektura UI dla Subbase

## 1. Przegląd struktury UI

Subbase to aplikacja webowa do ręcznego zarządzania subskrypcjami, zbudowana w architekturze Astro z React Islands. Interfejs użytkownika składa się z dwóch głównych widoków: strony autentykacji oraz dashboardu będącego centralnym hubem aplikacji.

Architektura UI opiera się na następujących założeniach:

- Minimalna liczba widoków z dashboardem jako głównym miejscem interakcji
- Astro obsługuje routing i middleware, React Islands zapewniają interaktywność
- Shadcn/ui jako biblioteka komponentów zapewniająca spójność wizualną
- React Context do zarządzania stanem aplikacji bez zewnętrznych bibliotek
- Responsywny design z podejściem desktop-first i adaptacją do urządzeń mobilnych

Priorytetem jest prostota implementacji i użytkowania, z możliwością rozbudowy w przyszłości.

## 2. Lista widoków

### 2.1 Widok autentykacji

**Ścieżka:** `/login`

**Główny cel:** Umożliwienie użytkownikom rejestracji nowego konta oraz logowania do istniejącego konta w celu uzyskania dostępu do funkcjonalności aplikacji.

**Kluczowe informacje do wyświetlenia:**

- Formularz logowania z polami email i hasło
- Formularz  rejestracji z polami email, hasło i potwierdzenie hasła
- Komunikaty błędów walidacji i autentykacji
- Wskaźnik stanu ładowania podczas przetwarzania żądania

**Kluczowe komponenty widoku:**

- AuthCard - kontener opakowujący całą sekcję autentykacji
- AuthTabs - przełącznik między trybem logowania a rejestracji
- LoginForm - formularz logowania z walidacją
- RegisterForm - formularz rejestracji z walidacją potwierdzenia hasła
- FormError - komponent wyświetlający błędy formularza

**Względy UX:**

- Autofocus na pierwszym polu formularza przy wejściu na stronę
- Dezaktywacja przycisku submit podczas przetwarzania żądania
- Wizualny wskaźnik ładowania na przycisku podczas operacji
- Zachowanie wpisanych danych przy przełączaniu między tabami
- Jasne komunikaty błędów przy nieprawidłowych danych

**Względy dostępności:**

- Etykiety powiązane z polami formularza przez atrybut htmlFor
- Oznaczenie nieprawidłowych pól atrybutem aria-invalid
- Komunikaty błędów z role="alert" dla czytników ekranu
- Możliwość nawigacji między polami za pomocą klawisza Tab
- Wysoki kontrast tekstu względem tła

**Względy bezpieczeństwa:**

- Pola haseł z type="password" ukrywające wprowadzane znaki
- Tokeny JWT przechowywane w HTTP-only cookies zamiast localStorage
- Walidacja formatu email po stronie klienta przed wysłaniem
- Brak szczegółowych informacji o przyczynie błędu logowania w komunikatach

### 2.2 Dashboard

**Ścieżka:** `/`

**Główny cel:** Zapewnienie użytkownikowi centralnego miejsca do zarządzania wszystkimi subskrypcjami, przeglądania podsumowania kosztów oraz generowania wglądów AI.

**Kluczowe informacje do wyświetlenia:**

- Podsumowanie kosztów miesięcznych i rocznych
- Liczniki subskrypcji według statusu (aktywne, wstrzymane, anulowane)
- Lista wszystkich subskrypcji użytkownika z paginacją
- Szczegóły każdej subskrypcji: nazwa, koszt, cykl rozliczeniowy, status, daty
- Panel wglądów AI z wygenerowanymi obserwacjami
- Dedykowany widok dla użytkowników bez subskrypcji

**Kluczowe komponenty widoku:**

- DashboardLayout - główny układ strony z nawigacją
- SummarySection - sekcja podsumowania kosztów i liczników
- SubscriptionList - lista subskrypcji w formie tabeli lub kart
- SubscriptionItem - pojedynczy element listy z akcjami
- Pagination - kontrolki paginacji dla listy
- AiInsightsPanel - rozwijany panel z funkcją generowania wglądów
- EmptyState - widok dla nowych użytkowników bez danych
- SubscriptionFormModal - modal do dodawania i edycji subskrypcji
- DeleteConfirmDialog - dialog potwierdzenia usunięcia

**Względy UX:**

- Podsumowanie zawsze widoczne na górze strony jako najważniejsza informacja
- Skeleton loaders podczas ładowania danych dla zachowania perceived performance
- Toast notifications informujące o wyniku operacji CRUD
- Smooth scroll do sekcji po wykonaniu akcji
- Zachowanie pozycji paginacji po edycji subskrypcji
- Wyraźne rozróżnienie wizualne statusów subskrypcji przez kolorowe badge

**Względy dostępności:**

- Tabela z prawidłową strukturą thead i tbody dla czytników ekranu
- Icon buttons z aria-label opisującym akcję
- Focus trap w otwartych modalach i dialogach
- Zamykanie modali klawiszem Escape
- Oznaczenie regionów strony przez aria-landmarks
- Skip link do głównej treści dla użytkowników klawiatury

**Względy bezpieczeństwa:**

- Weryfikacja sesji przez middleware Astro przed renderowaniem
- Row-Level Security na poziomie bazy danych izolująca dane użytkowników
- Brak ekspozycji identyfikatora użytkownika w interfejsie
- Automatyczne przekierowanie do /login przy wygasłej sesji (błąd 401)

## 3. Mapa podróży użytkownika

### 3.1 Przepływ nowego użytkownika

Nowy użytkownik wchodzący na stronę główną zostaje przekierowany przez middleware do widoku autentykacji. Na stronie /login widzi domyślnie aktywną zakładkę logowania. Po kliknięciu zakładki rejestracji przechodzi do formularza tworzenia konta.

Użytkownik wypełnia formularz rejestracji wprowadzając adres email, hasło oraz potwierdzenie hasła. Podczas wpisywania system waliduje format email oraz zgodność haseł inline. Po kliknięciu przycisku rejestracji następuje walidacja wszystkich pól i wysłanie żądania do Supabase Auth.

Po pomyślnej rejestracji użytkownik zostaje automatycznie zalogowany i przekierowany na dashboard. Jako nowy użytkownik bez subskrypcji widzi dedykowany empty state z komunikatem powitalnym i wyraźnym przyciskiem zachęcającym do dodania pierwszej subskrypcji.

Po kliknięciu przycisku CTA otwiera się modal formularza dodawania subskrypcji. Użytkownik wypełnia wymagane pola (nazwa, koszt, cykl rozliczeniowy, data rozpoczęcia) oraz opcjonalnie pozostałe pola. System waliduje dane inline dla formatów i przy submit dla reguł biznesowych.

Po zapisaniu subskrypcji modal się zamyka, lista odświeża się pokazując nową pozycję, sekcja podsumowania aktualizuje się o nowe koszty, a toast notification potwierdza sukces operacji.

### 3.2 Przepływ powracającego użytkownika

Powracający użytkownik wchodzący na stronę główną jest weryfikowany przez middleware. Jeśli sesja jest aktywna, widzi od razu dashboard ze swoimi danymi. Jeśli sesja wygasła, zostaje przekierowany do /login.

Na stronie logowania użytkownik wprowadza email i hasło. Po pomyślnej autentykacji zostaje przekierowany na dashboard, gdzie widzi podsumowanie kosztów oraz listę swoich subskrypcji.

Użytkownik może przeglądać listę subskrypcji, nawigować między stronami paginacji, oraz wykonywać operacje na pojedynczych elementach.

### 3.3 Przepływ edycji subskrypcji

Użytkownik klika przycisk edycji (ikona ołówka) przy wybranej subskrypcji na liście. Otwiera się modal formularza wypełniony aktualnymi danymi tej subskrypcji.

Użytkownik modyfikuje wybrane pola. System waliduje zmiany inline. Po kliknięciu przycisku zapisz następuje wysłanie żądania PUT/PATCH do API.

Po pomyślnej aktualizacji modal się zamyka, lista oraz podsumowanie odświeżają się odzwierciedlając zmiany, toast notification potwierdza sukces.

### 3.4 Przepływ usuwania subskrypcji

Użytkownik klika przycisk usuwania (ikona kosza) przy wybranej subskrypcji. Pojawia się dialog potwierdzenia zawierający nazwę subskrypcji i pytanie o potwierdzenie.

Użytkownik może kliknąć przycisk Anuluj zamykający dialog bez zmian lub przycisk Usuń wykonujący operację. Po kliknięciu Usuń następuje wysłanie żądania DELETE do API.

Po pomyślnym usunięciu dialog się zamyka, element znika z listy, podsumowanie aktualizuje się, toast notification potwierdza sukces.

### 3.5 Przepływ generowania wglądów AI

Użytkownik na dashboardzie widzi zwiniętą sekcję panelu AI. Po rozwinięciu sekcji widzi przycisk "Generuj wglądy AI" oraz opcjonalną listę checkboxów pozwalającą wybrać konkretne subskrypcje do analizy.

Użytkownik opcjonalnie zaznacza subskrypcje do analizy lub pozostawia puste pole (analiza wszystkich aktywnych). Po kliknięciu przycisku generowania pojawia się wskaźnik ładowania.

Po otrzymaniu odpowiedzi z API wyświetla się lista wygenerowanych obserwacji wraz z timestamp generowania oraz disclaimer o informacyjnym charakterze AI.

W przypadku niedostępności usługi AI (błąd 503) wyświetla się komunikat informujący o tymczasowej niedostępności bez blokowania pozostałych funkcji dashboardu.

### 3.6 Przepływ obsługi błędów

Przy błędzie walidacji formularza użytkownik widzi komunikaty błędów inline przy nieprawidłowych polach oraz opcjonalnie podsumowanie błędów na górze formularza. Przycisk submit pozostaje dostępny po poprawieniu błędów.

Przy błędzie sieciowym lub serwera użytkownik widzi toast notification z komunikatem o błędzie. W przypadku krytycznych operacji pojawia się opcja ponowienia próby.

Przy błędzie 401 (nieautoryzowany dostęp) użytkownik zostaje automatycznie przekierowany do strony logowania z zachowaniem kontekstu próbowanej operacji gdzie to możliwe.

## 4. Układ i struktura nawigacji

### 4.1 Globalny layout aplikacji

Aplikacja wykorzystuje wspólny layout Astro definiujący podstawową strukturę strony. Layout zawiera nagłówek (top-bar) widoczny na wszystkich stronach oraz główny obszar treści renderujący zawartość konkretnego widoku.

### 4.2 Nagłówek aplikacji (Top-bar)

Nagłówek ma minimalistyczny design i zawiera:

- Logo aplikacji Subbase po lewej stronie, będące jednocześnie linkiem do dashboardu
- Przycisk wylogowania po prawej stronie, widoczny tylko dla zalogowanych użytkowników

Nagłówek pozostaje stały podczas scrollowania dla łatwego dostępu do wylogowania.

### 4.3 Nawigacja w widoku autentykacji

Widok /login nie zawiera dodatkowej nawigacji poza tabami przełączającymi między formularzem logowania a rejestracji. Tabs są zaimplementowane jako komponent Shadcn/ui Tabs zapewniający dostępność i spójność wizualną.

### 4.4 Nawigacja w dashboardzie

Dashboard jest widokiem jednostronicowym bez podstron. Nawigacja odbywa się poprzez:

- Scrollowanie między sekcjami (podsumowanie, lista, panel AI)
- Paginację w liście subskrypcji (Previous/Next oraz numery stron)
- Otwieranie i zamykanie modali/dialogów dla operacji CRUD
- Rozwijanie i zwijanie panelu AI Insights

Stan paginacji jest przechowywany w React state z możliwością przeniesienia do URL params w przyszłości dla zachowania stanu przy odświeżeniu strony.

### 4.5 Modalne okna dialogowe

Modalne okna służą do operacji wymagających pełnej uwagi użytkownika:

- Modal formularza subskrypcji otwierany przyciskiem "Dodaj subskrypcję" lub "Edytuj"
- AlertDialog potwierdzenia otwierany przyciskiem usuwania

Modale implementują focus trap utrzymujący fokus wewnątrz okna, zamykanie klawiszem Escape oraz przyciskiem zamknij, oraz overlay blokujący interakcję z tłem.

## 5. Kluczowe komponenty

### 5.1 Komponenty autentykacji

**AuthCard** - kontener wizualny dla sekcji autentykacji oparty na komponencie Card z Shadcn/ui. Zapewnia spójne odstępy, cienie i zaokrąglenia dla formularzy logowania i rejestracji.

**AuthTabs** - komponent przełączający między formularzami logowania i rejestracji. Wykorzystuje Tabs z Shadcn/ui z dwoma zakładkami. Zachowuje stan wprowadzonych danych przy przełączaniu.

**LoginForm** - formularz logowania zawierający pola email i hasło, przycisk submit z obsługą stanu ładowania, oraz obszar wyświetlania błędów. Integruje się z Supabase Auth przez signInWithPassword.

**RegisterForm** - formularz rejestracji zawierający pola email, hasło i potwierdzenie hasła. Waliduje zgodność haseł przed wysłaniem. Integruje się z Supabase Auth przez signUp.

### 5.2 Komponenty dashboardu

**SummarySection** - sekcja wyświetlająca podsumowanie finansowe użytkownika. Prezentuje miesięczny i roczny koszt w formacie walutowym oraz liczniki subskrypcji według statusu jako kolorowe badge. Pobiera dane z endpointu /api/subscriptions/summary.

**SubscriptionList** - główny komponent listy subskrypcji adaptujący się do rozmiaru ekranu. Na desktopie renderuje Table z Shadcn/ui, na mobile renderuje układ kart. Obsługuje stany: ładowanie (skeleton), pusta lista (empty state), dane (lista elementów).

**SubscriptionItem** - pojedynczy element listy subskrypcji wyświetlający nazwę, koszt sformatowany z walutą, cykl rozliczeniowy jako badge, status jako kolorowy badge, datę następnego rozliczenia, oraz przyciski akcji edycji i usuwania.

**Pagination** - komponent kontrolek paginacji zawierający przyciski Previous i Next oraz numery stron. Dezaktywuje przyciski na krańcach zakresu. Wyświetla informację o aktualnej stronie i łącznej liczbie stron.

**EmptyState** - dedykowany widok dla użytkowników bez subskrypcji. Zawiera przyjazny komunikat powitalny, ilustrację lub ikonę, oraz wyraźny przycisk CTA otwierający modal dodawania.

### 5.3 Komponenty AI

**AiInsightsPanel** - rozwijana sekcja panelu AI. W stanie zwiniętym pokazuje nagłówek z przyciskiem rozwijania. W stanie rozwiniętym pokazuje opcjonalny wybór subskrypcji do analizy, przycisk generowania, listę wglądów, timestamp i disclaimer.

**InsightItem** - pojedynczy element listy wglądów AI. Wyświetla typ obserwacji oraz treść komunikatu. Stosuje spójne formatowanie dla różnych typów insights.

### 5.4 Komponenty formularzy

**SubscriptionFormModal** - modal zawierający formularz dodawania i edycji subskrypcji. Obsługuje oba tryby poprzez prop mode lub obecność initialData. Zawiera pola: nazwa (input text), koszt (input number), waluta (select z domyślną wartością PLN), cykl rozliczeniowy (select: miesięczny/roczny), status (select: aktywny/wstrzymany/anulowany), data rozpoczęcia (date picker), data następnego rozliczenia (date picker), opis (textarea). Implementuje walidację hybrydową z wykorzystaniem Zod.

**DeleteConfirmDialog** - AlertDialog z Shadcn/ui wyświetlający potwierdzenie usunięcia. Zawiera nazwę subskrypcji w treści, przycisk Usuń ze stylem destructive, oraz przycisk Anuluj.

### 5.5 Komponenty współdzielone

**TopBar** - nagłówek aplikacji z logo i przyciskiem logout. Warunkowo renderuje przycisk logout na podstawie stanu autentykacji z AuthContext.

**LoadingSpinner** - wskaźnik ładowania używany w przyciskach i sekcjach podczas operacji asynchronicznych.

**Toast** - komponent powiadomień oparty na Sonner z Shadcn/ui. Wyświetla komunikaty sukcesu, błędu i informacyjne. Automatycznie znika po określonym czasie.

**Badge** - komponent etykiety używany do wyświetlania statusu subskrypcji i cyklu rozliczeniowego. Warianty kolorystyczne: default, success (aktywny), warning (wstrzymany), destructive (anulowany).

**FormField** - wrapper dla pól formularza zawierający label, input, oraz obszar komunikatu błędu. Obsługuje stany: default, error, disabled.

### 5.6 Konteksty React

**AuthContext** - kontekst zarządzający stanem autentykacji. Udostępnia informacje o zalogowanym użytkowniku, funkcję logout, oraz stan ładowania sesji. Wykorzystywany przez TopBar i middleware protection.

**SubscriptionContext** - kontekst zarządzający danymi subskrypcji. Przechowuje listę subskrypcji, dane summary, stan paginacji, stany loading i error. Udostępnia funkcje CRUD wykonujące operacje na API i odświeżające dane po mutacjach.
