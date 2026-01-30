# Testing Environment Setup Complete ✅

Environment testowy został pomyślnie skonfigurowany dla projektów jednostkowych (Vitest) i e2e (Playwright).

## Co zostało zrobione

### 1. Zainstalowane zależności

#### Unit Testing
- ✅ Vitest 4.0.18
- ✅ @vitest/ui
- ✅ @vitest/coverage-v8
- ✅ @testing-library/react
- ✅ @testing-library/user-event
- ✅ @testing-library/jest-dom
- ✅ @faker-js/faker
- ✅ jsdom

#### E2E Testing
- ✅ Playwright
- ✅ @axe-core/playwright (accessibility testing)
- ✅ Chromium browser

#### Helpers
- ✅ vite-tsconfig-paths (dla aliasów @/*)

### 2. Pliki konfiguracyjne

- ✅ `vitest.config.mts` - Konfiguracja Vitest
- ✅ `playwright.config.ts` - Konfiguracja Playwright
- ✅ `src/test/setup.ts` - Setup dla testów jednostkowych
- ✅ `.env.test` - Zmienne środowiskowe dla testów
- ✅ `.github/workflows/test.yml` - CI/CD pipeline

### 3. Struktura katalogów

```
subbase/
├── e2e/                          # Testy E2E (Playwright)
│   ├── auth/                     # Testy autentykacji
│   ├── dashboard/                # Testy dashboardu
│   ├── api/                      # Testy API
│   ├── fixtures/                 # Custom fixtures
│   └── pages/                    # Page Object Models
│
├── src/
│   ├── test/                     # Utilities dla testów jednostkowych
│   │   ├── setup.ts              # Global setup
│   │   ├── helpers/              # Custom helpers
│   │   │   ├── render.tsx        # renderWithProviders
│   │   │   └── waitFor.ts        # Wait utilities
│   │   └── mockData/             # Factories dla test data
│   │       ├── subscriptions.ts  # Mock subscriptions
│   │       └── users.ts          # Mock users
│   │
│   └── **/*.{test,spec}.{ts,tsx} # Testy jednostkowe
│
└── TESTING.md                    # Dokumentacja testowania
```

### 4. Skrypty NPM

```bash
# Testy jednostkowe
npm run test              # Uruchom wszystkie testy
npm run test:watch        # Tryb watch
npm run test:ui           # UI mode
npm run test:coverage     # Z coverage reportem

# Testy E2E
npm run test:e2e          # Uruchom testy E2E
npm run test:e2e:ui       # UI mode dla Playwright
npm run test:e2e:debug    # Debug mode
npm run test:e2e:codegen  # Generuj testy
```

### 5. Przykładowe testy

- ✅ `src/test/example.test.ts` - Przykładowy test
- ✅ `src/lib/utils.test.ts` - Test funkcji utils
- ✅ `src/lib/services/subscription.service.test.ts` - Test z mock data
- ✅ `e2e/auth/login.spec.ts` - E2E test logowania
- ✅ `e2e/dashboard/dashboard.spec.ts` - E2E test dashboardu
- ✅ `e2e/api/subscriptions.spec.ts` - E2E test API

### 6. Dokumentacja

- ✅ `TESTING.md` - Kompletny guide do testowania
- ✅ `e2e/README.md` - Dokumentacja testów E2E
- ✅ `src/test/README.md` - Dokumentacja testów jednostkowych

## Ważne uwagi

### 1. Vitest Globals

Ten projekt używa `globals: true` w Vitest. **NIE IMPORTUJ** `describe`, `it`, `expect`, `vi` z 'vitest':

```typescript
// ❌ ŹLE
import { describe, it, expect } from 'vitest';

// ✅ DOBRZE - używaj globals
describe('My Test', () => {
  it('works', () => {
    expect(true).toBe(true);
  });
});
```

### 2. TypeScript Path Aliases

Projekt używa aliasu `@/*` dla `./src/*`:

```typescript
import { generateMockSubscription } from '@/test/mockData/subscriptions';
```

### 3. Supabase dla testów

Podczas testów E2E, używaj lokalnej instancji Supabase:

```bash
# Uruchom Supabase lokalnie
npm run db:start

# Sprawdź status i pobierz klucze
npm run db:status
```

Zaktualizuj `.env.test` z kluczami z `supabase status`.

### 4. CI/CD

Testy są zautomatyzowane w GitHub Actions:
- Testy jednostkowe uruchamiają się na każdy push
- Testy E2E uruchamiają się na pull requesty
- Coverage jest generowane i uploadowane

## Weryfikacja instalacji

Sprawdź czy wszystko działa:

```bash
# 1. Uruchom testy jednostkowe
npm run test

# Powinno pokazać:
# ✓ src/test/example.test.ts (3 tests)
# ✓ src/lib/utils.test.ts (4 tests)
# ✓ src/lib/services/subscription.service.test.ts (5 tests)

# 2. Lista testów E2E
npx playwright test --list

# Powinno pokazać 27 testów w 4 plikach

# 3. Sprawdź coverage (opcjonalnie)
npm run test:coverage
```

## Następne kroki

1. **Pisz testy podczas developmentu**
   - Dodaj test najpierw (TDD)
   - Lub dodaj test zaraz po implementacji

2. **Używaj Page Object Model dla E2E**
   - Twórz POM dla każdej strony w `e2e/pages/`
   - Reużywaj locatory i akcje

3. **Monitoruj coverage**
   - Cel: 70% dla lines, functions, branches, statements
   - Sprawdzaj: `npm run test:coverage`

4. **Używaj fixtures dla E2E**
   - Zobacz `e2e/fixtures/auth.fixture.ts` jako przykład
   - Redukuj duplikację w setupie testów

5. **Mock external services**
   - OpenRouter API powinien być mockowany w testach
   - Supabase - używaj lokalnej instancji

## Rozwiązywanie problemów

### Testy jednostkowe nie działają

```bash
# Sprawdź czy używasz globals
# NIE importuj describe/it/expect z 'vitest'

# Sprawdź setup file
cat src/test/setup.ts
```

### Testy E2E timeoutują

```bash
# Zwiększ timeout w playwright.config.ts
# lub ustaw globalny timeout:
npx playwright test --timeout=60000
```

### Coverage jest za niski

```bash
# Sprawdź które pliki nie są pokryte
npm run test:coverage

# Otwórz HTML report
open coverage/index.html  # Mac/Linux
start coverage/index.html  # Windows
```

## Dodatkowe zasoby

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Faker.js Documentation](https://fakerjs.dev/)

---

**Status**: ✅ Gotowe do użycia
**Data**: 2026-01-30
**Wersja Vitest**: 4.0.18
**Wersja Playwright**: Latest
