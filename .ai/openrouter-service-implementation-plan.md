# Plan wdrozenia: OpenRouter Service

<implementation_breakdown>
1. Komponent: OpenRouterService (warstwa komunikacji z API)
   a. Funkcjonalnosc: centralny klient HTTP do wysylania chat completions, ustawiania naglowkow, timeoutow i parsowania odpowiedzi.
   b. Wyzwania:
      1) Stabilnosc polaczen i timeouty w przypadku wolnej odpowiedzi modelu.
      2) Zmiennosc formatu odpowiedzi i brak "choices".
      3) Rozne kody bledow HTTP i ich mapowanie na bledy domenowe.
   c. Rozwiazania:
      1) Konfigurowalny timeout i kontrola AbortController po stronie serwera.
      2) Defensywne parsowanie JSON + fallback na surowy tekst.
      3) Centralna mapa status -> blad domenowy i jednolity komunikat dla klienta.

2. Komponent: Konfiguracja srodowiskowa i parametry modelu
   a. Funkcjonalnosc: zarzadzanie kluczem API, base URL, domyslnym modelem i parametrami (temperature, max_tokens, top_p).
   b. Wyzwania:
      1) Brak konfiguracji na srodowisku docelowym.
      2) Konflikt ustawien globalnych z ustawieniami per-zadanie.
   c. Rozwiazania:
      1) Guard clauses przy inicjalizacji i czytelny komunikat bledu.
      2) Strategia "domyslne + nadpisanie" z walidacja zakresow.

3. Komponent: Budowanie wiadomosci (system/user)
   a. Funkcjonalnosc: skladanie promptu z komunikatu systemowego i uzytkownika.
   b. Wyzwania:
      1) Niejednoznaczna kolejnosc wiadomosci i brak spojnosc kontekstu.
      2) Nadmierna dlugosc promptu i przekroczenie limitu tokenow.
   c. Rozwiazania:
      1) Jednolita polityka: system zawsze jako pierwsza wiadomosc.
      2) Limitowanie i streszczanie danych wejsciowych.

4. Komponent: response_format (ustrukturyzowane odpowiedzi)
   a. Funkcjonalnosc: wymuszenie odpowiedzi JSON zgodnej ze schematem.
   b. Wyzwania:
      1) Model zwraca niepoprawny JSON lub tekst oko.
      2) Rozjazd schematu z oczekiwaniami logiki biznesowej.
   c. Rozwiazania:
      1) Wymuszenie "strict: true" i walidacja po stronie serwera.
      2) Wersjonowanie schematow i testy kontraktowe.

5. Komponent: Walidacja i mapowanie odpowiedzi
   a. Funkcjonalnosc: ekstrakcja odpowiedzi modelu, walidacja JSON, mapowanie na typy domenowe.
   b. Wyzwania:
      1) Brak danych wymaganych w JSON.
      2) Rownolegla obsluga odpowiedzi tekstowych i JSON.
   c. Rozwiazania:
      1) Walidacja wymaganych pol i czytelne komunikaty bledu.
      2) Dwie sciezki parsowania: JSON Schema i fallback na tekst.

6. Komponent: Logowanie i obserwowalnosc
   a. Funkcjonalnosc: logi techniczne (statusy, czasy), bez danych wrazliwych.
   b. Wyzwania:
      1) Ryzyko logowania PII i tresci promptu.
      2) Brak korelacji bledow z zadaniami.
   c. Rozwiazania:
      1) Redakcja logow i maskowanie danych.
      2) ID zadania i metryki czasu odpowiedzi.

7. Komponent: Integracja z API (Astro)
   a. Funkcjonalnosc: endpointy serwerowe, ktore wywoluja OpenRouterService.
   b. Wyzwania:
      1) Wydajnosc i równolegly dostep.
      2) Bezpieczenstwo i autoryzacja zadan.
   c. Rozwiazania:
      1) Limity zadan per uzytkownik i cache.
      2) Autoryzacja w middleware i kontrola origin.

8. Komponent: Typy i kontrakty (TypeScript)
   a. Funkcjonalnosc: definicje typow wiadomosci, konfiguracji, odpowiedzi i bledow.
   b. Wyzwania:
      1) Rozjazd typow TS z JSON schema.
      2) Zaleznosci miedzy warstwami (API, serwis, UI).
   c. Rozwiazania:
      1) Jeden zrodlowy schemat i generacja typow.
      2) Dedykowane DTO w `src/types.ts`.

9. Komponent: Testy i walidacja kontraktow
   a. Funkcjonalnosc: testy jednostkowe parsowania i walidacji odpowiedzi.
   b. Wyzwania:
      1) Trudnosc w deterministycznym testowaniu odpowiedzi LLM.
      2) Brak mockow stabilnych dla API.
   c. Rozwiazania:
      1) Testy na statycznych fixture odpowiedzi.
      2) Mockowanie klienta HTTP i walidacja schematu.

Elementy wymagane przez OpenRouter API i przyklady:
1. Komunikat systemowy
   - Metody: staly komunikat konfiguracyjny; komunikat per-zadanie.
   - Przyklady:
     1) "Jestes asystentem Subbase. Odpowiadaj zwiezle, bez rozwlekania."
     2) "Masz role analityka subskrypcji. Zwracaj dane w formie JSON."
2. Komunikat uzytkownika
   - Metody: bezposredni prompt; prompt z danymi z bazy po stronie serwera.
   - Przyklady:
     1) "Stworz podsumowanie kosztow subskrypcji za ostatnie 30 dni."
     2) "Wskaz 3 subskrypcje do optymalizacji na podstawie danych."
3. response_format (JSON schema)
   - Metody: schemat bazowy; schematy wersjonowane per przypadek uzycia.
   - Przyklady:
     1) { type: "json_schema", json_schema: { name: "InsightsSchema", strict: true, schema: { type: "object", properties: { summary: { type: "string" }, recommendations: { type: "array", items: { type: "string" } } }, required: ["summary", "recommendations"], additionalProperties: false } } }
     2) { type: "json_schema", json_schema: { name: "CostBreakdownSchema", strict: true, schema: { type: "object", properties: { total: { type: "number" }, items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, amount: { type: "number" } }, required: ["name", "amount"], additionalProperties: false } } }, required: ["total", "items"], additionalProperties: false } } }
4. Nazwa modelu
   - Metody: domyslny model w konfiguracji; nadpisanie per-zadanie.
   - Przyklady:
     1) "openai/gpt-4.1-mini"
     2) "anthropic/claude-3.5-sonnet"
5. Parametry modelu
   - Metody: domyslne parametry; parametry per-zadanie z walidacja.
   - Przyklady:
     1) { temperature: 0.2, max_tokens: 700, top_p: 0.9 }
     2) { temperature: 0.7, max_tokens: 1200, top_p: 1 }

Scenariusze bledow (globalne):
1. Brak klucza OPENROUTER_API_KEY w srodowisku.
2. Brak polaczenia sieciowego lub DNS.
3. Timeout odpowiedzi API.
4. HTTP 401/403 - nieprawidlowe uprawnienia.
5. HTTP 404 - nieistniejacy model.
6. HTTP 429 - rate limit.
7. HTTP 400 - nieprawidlowy payload.
8. HTTP 500/503 - problemy po stronie OpenRouter.
9. Brak "choices" lub pusty content.
10. Odpowiedz niezgodna z response_format.
</implementation_breakdown>

## 1. Opis uslugi
OpenRouter Service to warstwa serwerowa odpowiedzialna za bezpieczna komunikacje z OpenRouter API w aplikacji Astro/TypeScript. Serwis udostepnia jednolite API do wysylania chat completions, obsluguje konfiguracje modeli, parametrow, response_format, a takze zapewnia defensywne parsowanie i mapowanie bledow. Serwis ma dzialac jako element backendu (Astro API routes) i nie moze byc wywolywany bezposrednio z klienta.

## 2. Opis konstruktora
Zalecany jest konstruktor w formie funkcji fabrykujacej, aby uniknac globalnego stanu:
- `createOpenRouterService(config)` zwraca obiekt z metodami.
- `config` zawiera: `apiKey`, `baseUrl`, `defaultModel`, `defaultParams`, `appTitle`, `referer`.
- Konstruktor wykonuje walidacje preconditions (guard clauses) i ustawia domyslne wartosci.

## 3. Publiczne metody i pola
1. `sendChatCompletion(request)`  
   - Wejscie: `messages`, `model?`, `params?`, `responseFormat?`, `timeout?`.  
   - Wyjscie: `content` (string) oraz opcjonalnie `parsed` (gdy response_format).  
   - Odpowiedzialnosc: budowa payloadu, wysylka, parsowanie, mapowanie bledow.

2. `buildMessages(input)`  
   - Tworzy kolekcje wiadomosci zgodnie z polityka: system -> user -> assistant.

3. `parseResponse(content, responseFormat?)`  
   - Probuje sparsowac JSON, waliduje ze schematem, w razie bledu zwraca tekst.

Publiczne pola (odczyt):
- `defaultModel`
- `defaultParams`

## 4. Prywatne metody i pola
1. `buildPayload(messages, model, params, responseFormat)`  
   - Tworzy strukture zgodna z OpenRouter API.

2. `callApi(payload, timeout)`  
   - Obsluguje fetch, naglowki, timeout i mapowanie statusu HTTP.

3. `mapHttpError(status)`  
   - Mapuje statusy na bledy domenowe.

4. `extractContent(responseJson)`  
   - Defensywnie pobiera `choices[0].message.content`.

Prywatne pola:
- `apiKey`
- `baseUrl`
- `appTitle`
- `referer`

## 5. Obsluga bledow
Serwis powinien mapowac bledy na jednolity zestaw bledow domenowych, np. `aiServiceUnavailableError()` z `@/lib/errors`. Krytyczne sa guard clauses w konstruktorze i w `sendChatCompletion`. Wszystkie bledy techniczne logujemy po stronie serwera z redakcja danych.

## 6. Kwestie bezpieczenstwa
- Klucz API tylko po stronie serwera, nigdy w kodzie klienta.
- Dostep do endpointow AI kontrolowany przez middleware i autoryzacje.
- Redakcja logow (PII, dane kont).
- Limitowanie rozmiaru promptu i parametrow modelu.
- Weryfikacja pochodzenia zapytan (origin/referer).

## 7. Plan wdrozenia krok po kroku
1. Konfiguracja srodowiska  
   - Dodaj `OPENROUTER_API_KEY` oraz opcjonalnie `OPENROUTER_BASE_URL` do `.env` i `.env.example`.

2. Utworzenie serwisu  
   - Dodaj `src/lib/services/openrouter.service.ts` jako warstwe komunikacji.  
   - Zdefiniuj typy DTO w `src/types.ts`.

3. Implementacja konstruktora  
   - Ustal domyslny model i parametry.  
   - Dodaj guard clauses i walidacje.

4. Implementacja `sendChatCompletion`  
   - Buduj payload z `messages`, `model`, `params`, `response_format`.  
   - Ustaw naglowki `Authorization`, `HTTP-Referer`, `X-Title`.  
   - Obsluz timeout i mapowanie bledow HTTP.

5. Konfiguracja komunikatow i response_format  
   - System: ustaw stale instrukcje w `buildMessages`.  
   - User: przyjmuj dane z API endpointu.  
   - response_format: przyjmij schemat JSON z wzorca:  
     `{ type: "json_schema", json_schema: { name: "SchemaName", strict: true, schema: { ... } } }`

6. Integracja z API Astro  
   - Utworz endpointy w `src/pages/api/ai/...` i deleguj do serwisu.  
   - Zwracaj wynik w spojnyn formacie API.

7. Walidacja i testy  
   - Dodaj testy `parseResponse` i walidacji schematow JSON.  
   - Przetestuj bledy HTTP i timeouty.

8. Dokumentacja i wdrozenie  
   - Zaktualizuj README o konfiguracje OpenRouter.  
   - Zweryfikuj limity i koszty na OpenRouter.  
   - Skonfiguruj logowanie i monitoring w produkcji.
# Plan refaktoryzacji: OpenRouter Service

## 1. Stan obecny

### 1.1 Istniejąca implementacja
Plik `src/lib/services/ai-insights.service.ts` zawiera pełną implementację komunikacji z OpenRouter API:
- ✅ Budowanie komunikatów (system + user prompts)
- ✅ Wywołanie OpenRouter API (`fetch` z timeoutem 30s)
- ✅ Obsługa błędów HTTP (401, 429, 500, 503)
- ✅ Parsing odpowiedzi JSON z fallback
- ✅ Nagłówki `HTTP-Referer` i `X-Title`

### 1.2 Problemy do rozwiązania
1. **Brak separacji odpowiedzialności** - logika komunikacji z OpenRouter jest połączona z logiką biznesową generowania insights
2. **Trudność w ponownym użyciu** - niemożliwe użycie tej samej logiki OpenRouter dla innych przypadków (np. inne prompty, inne formaty odpowiedzi)
3. **Utrudnione testowanie** - brak możliwości testowania komunikacji OpenRouter niezależnie od logiki insights

### 1.3 Cel refaktoryzacji
Wydzielić **generyczną warstwę komunikacji z OpenRouter** jako osobny serwis, zachowując:
- ✅ Wzorzec functional (jak wszystkie serwisy w projekcie)
- ✅ Prostotę implementacji (MVP)
- ✅ Zgodność z istniejącymi konwencjami
- ✅ Brak breaking changes dla istniejących endpointów

---

## 2. Architektura docelowa

### 2.1 Wzorzec functional (zgodny z projektem)
Serwis jako **prosty obiekt z metodami** (nie klasa):

```typescript
export const OpenRouterService = {
  async sendChatCompletion(config: ChatConfig, messages: OpenRouterMessage[]): Promise<string> {
    // implementacja
  },
  
  parseJsonResponse<T>(content: string): T | null {
    // implementacja
  }
}
```

### 2.2 Struktura konfiguracji
Konfiguracja przekazywana jako **parametr funkcji** (nie przechowywana w instancji):

```typescript
interface ChatConfig {
  model?: string;              // domyślnie: "openai/gpt-4o-mini"
  temperature?: number;         // domyślnie: 0.7
  max_tokens?: number;          // domyślnie: 1000
  timeout?: number;             // domyślnie: 30000 (ms)
}
```

### 2.3 Integracja z istniejącym kodem
`ai-insights.service.ts` będzie używał `OpenRouterService`:

```typescript
// Przed refaktoryzacją:
const insights = await AIInsightsService.callAIService(subscriptions);

// Po refaktoryzacji:
const messages = AIInsightsService.buildMessages(subscriptions);
const response = await OpenRouterService.sendChatCompletion(config, messages);
const insights = AIInsightsService.parseInsights(response);
```

---

## 3. Interfejs serwisu (API publiczne)

### 3.1 Główna metoda: `sendChatCompletion()`
```typescript
async sendChatCompletion(
  config: ChatConfig,
  messages: OpenRouterMessage[]
): Promise<string>
```

**Odpowiedzialność:**
- Walidacja klucza API (guard clause)
- Budowanie payloadu zgodnego z OpenRouter API
- Wysyłka żądania z timeoutem
- Obsługa błędów HTTP
- Zwrócenie zawartości odpowiedzi modelu

**Zwraca:** surową treść odpowiedzi (string)

**Rzuca:** `ApiError` z odpowiednimi kodami błędów

### 3.2 Pomocnicza metoda: `parseJsonResponse()`
```typescript
parseJsonResponse<T>(content: string): T | null
```

**Odpowiedzialność:**
- Próba parsowania JSON z odpowiedzi
- Ekstrakcja JSON z markdown (```)
- Zwrócenie `null` w przypadku błędu parsowania

**Zwraca:** sparsowany obiekt lub `null`

---

## 4. Typy danych

### 4.1 Podstawowe typy
```typescript
interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatConfig {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  timeout?: number;
}

interface OpenRouterResponse {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
  error?: {
    message: string;
  };
}
```

---

## 5. Obsługa błędów

### 5.1 Scenariusze błędów
1. **Brak klucza API** → `aiServiceUnavailableError()`
2. **Błędy sieciowe** (DNS, brak połączenia) → `aiServiceUnavailableError()`
3. **Timeout** (>30s) → `aiServiceUnavailableError()`
4. **HTTP 401/403** → `aiServiceUnavailableError()` + log szczegółów
5. **HTTP 429** (rate limit) → `aiServiceUnavailableError()` + log rate limit
6. **HTTP 400** → `aiServiceUnavailableError()` + log nieprawidłowego payloadu
7. **HTTP 404** → `aiServiceUnavailableError()` + log nieistniejącego modelu
8. **HTTP 500/503** → `aiServiceUnavailableError()`
9. **Brak `choices` w odpowiedzi** → `aiServiceUnavailableError()`

### 5.2 Strategia obsługi
```typescript
// Użycie istniejących error factories z @/lib/errors
import { aiServiceUnavailableError } from "@/lib/errors";

if (!apiKey) {
  console.error("OPENROUTER_API_KEY is not configured");
  throw aiServiceUnavailableError();
}

if (!response.ok) {
  console.error("OpenRouter API error:", response.status, response.statusText);
  throw aiServiceUnavailableError();
}
```

**Zasada:** używaj bezpośrednio `aiServiceUnavailableError()` - zgodnie z istniejącym kodem w `ai-insights.service.ts`.

## 6. Kwestie bezpieczeństwa
- Klucz API wyłącznie po stronie serwera; nie eksponować go w kodzie klienta.
- Używać zmiennych środowiskowych (np. `.env`, `.env.example`).
- Filtracja logów i danych wrażliwych (PII).
- Ograniczanie payloadu i walidacja wejść przed wysłaniem do API.
- Weryfikacja źródła wywołań (np. middleware, autoryzacja w `src/middleware/index.ts`).

## 7. Plan wdrożenia krok po kroku
1. **Konfiguracja środowiska**
   - Dodaj `OPENROUTER_API_KEY` i opcjonalnie `OPENROUTER_BASE_URL` do `.env`.
   - Uaktualnij `.env.example`, aby dokumentował wymagane zmienne.

2. **Struktura plików**
   - Utwórz `src/lib/services/openrouter.service.ts`.
   - Dodaj typy pomocnicze w `src/types.ts` lub `src/lib/schemas` (np. schematy odpowiedzi).

3. **Model danych i interfejsy**
   - Zdefiniuj typy:
     - `OpenRouterMessage`, `OpenRouterPayload`, `OpenRouterResponse`
     - `ChatInput`, `ChatRequest`, `ChatResult`
   - Zadbaj o spójność z TypeScript 5.

4. **Implementacja konstruktora**
   - Wymuś `apiKey` i `baseUrl` (guard clauses).
   - Ustaw domyślny model i parametry.
   - Dodaj nagłówki aplikacji: `HTTP-Referer` oraz `X-Title`.

5. **Budowa komunikatów (system + user)**
   - **Przykład 1: komunikat systemowy**
     - Treść: “Jesteś asystentem aplikacji Subbase. Odpowiadasz krótko i konkretnie.”
     - Implementacja: `messages.unshift({ role: "system", content: systemMessage })`
   - **Przykład 2: komunikat użytkownika**
     - Treść: “Przygotuj podsumowanie subskrypcji za ostatni miesiąc.”
     - Implementacja: `messages.push({ role: "user", content: userMessage })`

6. **Ustrukturyzowane odpowiedzi (response_format)**
   - **Przykład 1: schemat JSON dla podsumowania**
     - `response_format`:
       ```
       { type: "json_schema", json_schema: { name: "SummarySchema", strict: true, schema: { type: "object", properties: { total: { type: "number" }, items: { type: "array", items: { type: "string" } } }, required: ["total", "items"], additionalProperties: false } } }
       ```
     - Implementacja: do payloadu `response_format`.
   - **Przykład 2: walidacja**
     - Po otrzymaniu odpowiedzi: parse JSON → waliduj zgodność ze schematem → zwróć wynik.

7. **Nazwa modelu**
   - **Przykład:**
     - `model: "openai/gpt-4.0-mini"`
   - Ustaw w payloadzie, z możliwością nadpisania w `ChatRequest`.

8. **Parametry modelu**
   - **Przykłady:**
     - `temperature: 0.2`
     - `top_p: 0.9`
     - `max_tokens: 512`
   - Pozwól nadpisać parametry per żądanie.

9. **Warstwa API (Astro)**
   - Utwórz endpoint w `src/pages/api/ai/...` do obsługi czatów.
   - Endpoint deleguje do `OpenRouterService` i zwraca jednolity wynik.

10. **Obsługa błędów i logowanie**
   - Mapuj błędy HTTP na kody domenowe (np. `RATE_LIMIT`, `UNAUTHORIZED`).
   - Loguj techniczne informacje, zwracaj przyjazne komunikaty użytkownikowi.

11. **Testy i weryfikacja**
   - Dodaj testy jednostkowe dla `buildRequestPayload` i `parseResponse`.
   - Zaimplementuj testy walidacji `response_format`.

12. **Dokumentacja i gotowość produkcyjna**
   - Zaktualizuj README o konfigurację OpenRouter.
   - Sprawdź limity i koszty w dokumentacji OpenRouter.
   - Skonfiguruj monitorowanie błędów i alerty.
