# Page Object Models (POM) - Dokumentacja

## 📚 Przegląd

Ten dokument opisuje klasy Page Object Model stworzone dla testów E2E z wykorzystaniem Playwright. Klasy POM enkapsulują interakcje ze stronami, zapewniając łatwiejsze w utrzymaniu i bardziej czytelne testy.

## 🏗️ Struktura klas POM

```
e2e/
├── pages/
│   ├── index.ts              # Centralized exports
│   ├── LoginPage.ts          # Login page POM
│   ├── RegisterPage.ts       # Register page POM
│   └── DashboardPage.ts      # Dashboard page POM
```

---

## 📄 LoginPage

Klasa dla strony logowania z obsługą przełączania zakładek między logowaniem a rejestracją.

### Konstruktor

```typescript
const loginPage = new LoginPage(page);
```

### Elementy (Locators)

| Element | Test ID | Opis |
|---------|---------|------|
| `authCard` | `auth-card` | Karta autentykacji |
| `loginTab` | `auth-tab-login` | Zakładka logowania |
| `registerTab` | `auth-tab-register` | Zakładka rejestracji |
| `loginForm` | `login-form` | Formularz logowania |
| `emailInput` | `login-email-input` | Input email |
| `passwordInput` | `login-password-input` | Input hasło |
| `submitButton` | `login-submit-button` | Przycisk submit |

### Metody

#### `goto(): Promise<void>`
Przechodzi do strony `/login` i czeka na widoczność karty autentykacji.

```typescript
await loginPage.goto();
```

#### `switchToLoginTab(): Promise<void>`
Przełącza na zakładkę logowania i czeka na widoczność formularza.

```typescript
await loginPage.switchToLoginTab();
```

#### `switchToRegisterTab(): Promise<void>`
Przełącza na zakładkę rejestracji.

```typescript
await loginPage.switchToRegisterTab();
```

#### `login(email: string, password: string): Promise<void>`
Wypełnia formularz logowania i klika przycisk submit.

```typescript
await loginPage.login("user@example.com", "password123");
```

#### `performLogin(email: string, password: string): Promise<void>`
Kompletny flow logowania: przechodzi na stronę, przełącza zakładkę i loguje.

```typescript
await loginPage.performLogin("user@example.com", "password123");
```

#### `isLoginFormVisible(): Promise<boolean>`
Sprawdza czy formularz logowania jest widoczny.

```typescript
const isVisible = await loginPage.isLoginFormVisible();
```

### Przykład użycia

```typescript
test("should login successfully", async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  await loginPage.goto();
  await loginPage.login("test@example.com", "password123");
  
  await expect(page).toHaveURL("/");
});
```

---

## 📄 RegisterPage

Klasa dla strony rejestracji z obsługą formularza i widoku sukcesu.

### Konstruktor

```typescript
const registerPage = new RegisterPage(page);
```

### Elementy (Locators)

| Element | Test ID | Opis |
|---------|---------|------|
| `authCard` | `auth-card` | Karta autentykacji |
| `loginTab` | `auth-tab-login` | Zakładka logowania |
| `registerTab` | `auth-tab-register` | Zakładka rejestracji |
| `registerForm` | `register-form` | Formularz rejestracji |
| `emailInput` | `register-email-input` | Input email |
| `passwordInput` | `register-password-input` | Input hasło |
| `confirmPasswordInput` | `register-confirm-password-input` | Input potwierdzenie hasła |
| `submitButton` | `register-submit-button` | Przycisk submit |
| `successMessage` | `register-success-message` | Komunikat sukcesu |
| `goToLoginButton` | `register-success-go-to-login-button` | Przycisk przejścia do logowania |

### Metody

#### `goto(): Promise<void>`
Przechodzi do strony `/login`, przełącza na zakładkę rejestracji i czeka na widoczność formularza.

```typescript
await registerPage.goto();
```

#### `switchToRegisterTab(): Promise<void>`
Przełącza na zakładkę rejestracji i czeka na widoczność formularza.

```typescript
await registerPage.switchToRegisterTab();
```

#### `switchToLoginTab(): Promise<void>`
Przełącza na zakładkę logowania.

```typescript
await registerPage.switchToLoginTab();
```

#### `fillEmail(email: string): Promise<void>`
Wypełnia pole email.

```typescript
await registerPage.fillEmail("user@example.com");
```

#### `fillPassword(password: string): Promise<void>`
Wypełnia pole hasło.

```typescript
await registerPage.fillPassword("SecurePass123!");
```

#### `fillConfirmPassword(password: string): Promise<void>`
Wypełnia pole potwierdzenia hasła.

```typescript
await registerPage.fillConfirmPassword("SecurePass123!");
```

#### `fillRegistrationForm(email: string, password: string, confirmPassword?: string): Promise<void>`
Wypełnia cały formularz rejestracji. Jeśli `confirmPassword` nie jest podane, używa wartości `password`.

```typescript
await registerPage.fillRegistrationForm("user@example.com", "SecurePass123!");
```

#### `submit(): Promise<void>`
Klika przycisk submit.

```typescript
await registerPage.submit();
```

#### `register(email: string, password: string, confirmPassword?: string): Promise<void>`
Wypełnia formularz i klika submit.

```typescript
await registerPage.register("user@example.com", "SecurePass123!");
```

#### `performRegistration(email: string, password: string, confirmPassword?: string): Promise<void>`
Kompletny flow rejestracji: przechodzi na stronę, przełącza zakładkę, wypełnia formularz i wysyła.

```typescript
await registerPage.performRegistration("user@example.com", "SecurePass123!");
```

#### `static generateRandomEmail(prefix?: string): string`
Generuje losowy email dla testów. Domyślny prefix: `"test"`.

```typescript
const email = RegisterPage.generateRandomEmail("e2e"); // e2e-1234567890-5678@example.com
```

#### `isRegisterFormVisible(): Promise<boolean>`
Sprawdza czy formularz rejestracji jest widoczny.

```typescript
const isVisible = await registerPage.isRegisterFormVisible();
```

#### `isSuccessMessageVisible(): Promise<boolean>`
Sprawdza czy widok sukcesu jest wyświetlony.

```typescript
const isSuccess = await registerPage.isSuccessMessageVisible();
```

#### `goToLoginFromSuccess(): Promise<void>`
Klika przycisk "Przejdź do logowania" w widoku sukcesu.

```typescript
await registerPage.goToLoginFromSuccess();
```

#### `getFieldError(fieldId: string): Promise<string | null>`
Pobiera komunikat błędu dla konkretnego pola.

```typescript
const error = await registerPage.getFieldError("register-email-input");
```

#### `isSubmitButtonDisabled(): Promise<boolean>`
Sprawdza czy przycisk submit jest wyłączony (podczas ładowania).

```typescript
const isDisabled = await registerPage.isSubmitButtonDisabled();
```

### Przykład użycia

```typescript
test("should register successfully", async ({ page }) => {
  const registerPage = new RegisterPage(page);
  const email = RegisterPage.generateRandomEmail();
  
  await registerPage.goto();
  await registerPage.register(email, "SecurePass123!");
  
  await expect(registerPage.successMessage).toBeVisible();
});
```

---

## 📄 DashboardPage

Klasa dla strony dashboardu z obsługą TopBar i zarządzania subskrypcjami.

### Konstruktor

```typescript
const dashboardPage = new DashboardPage(page);
```

### Elementy (Locators)

| Element | Test ID | Opis |
|---------|---------|------|
| `topBar` | `dashboard-topbar` | Nagłówek dashboardu |
| `logoutButton` | `logout-button` | Przycisk wylogowania |
| `appLogo` | N/A | Logo aplikacji (link do `/`) |
| `themeToggle` | N/A | Przełącznik motywu |
| `addSubscriptionButton` | N/A | Przycisk dodawania subskrypcji |
| `subscriptionsList` | `subscriptions-list` | Lista subskrypcji |
| `aiInsightsPanel` | `ai-insights-panel` | Panel AI insights |

### Metody

#### `goto(): Promise<void>`
Przechodzi do strony `/` i czeka na widoczność TopBar.

```typescript
await dashboardPage.goto();
```

#### `logout(): Promise<void>`
Wylogowuje użytkownika i czeka na przekierowanie na `/login`.

```typescript
await dashboardPage.logout();
```

#### `isUserAuthenticated(): Promise<boolean>`
Sprawdza czy użytkownik jest zalogowany (weryfikuje obecność TopBar i przycisku wylogowania).

```typescript
const isAuth = await dashboardPage.isUserAuthenticated();
expect(isAuth).toBe(true);
```

#### `isTopBarVisible(): Promise<boolean>`
Sprawdza czy TopBar jest widoczny.

```typescript
const isVisible = await dashboardPage.isTopBarVisible();
```

#### `isLogoutButtonVisible(): Promise<boolean>`
Sprawdza czy przycisk wylogowania jest widoczny.

```typescript
const isVisible = await dashboardPage.isLogoutButtonVisible();
```

#### `clickLogo(): Promise<void>`
Klika logo aplikacji (przekierowanie na stronę główną).

```typescript
await dashboardPage.clickLogo();
```

#### `addSubscription(data): Promise<void>`
Dodaje nową subskrypcję.

```typescript
await dashboardPage.addSubscription({
  name: "Netflix",
  price: "49.99",
  billingCycle: "monthly"
});
```

#### `getSubscriptionCount(): Promise<number>`
Pobiera liczbę subskrypcji.

```typescript
const count = await dashboardPage.getSubscriptionCount();
```

#### `waitForDashboardLoad(): Promise<void>`
Czeka na załadowanie dashboardu (weryfikuje obecność kluczowych elementów).

```typescript
await dashboardPage.waitForDashboardLoad();
```

### Przykład użycia

```typescript
test("should verify authenticated user", async ({ page }) => {
  const dashboardPage = new DashboardPage(page);
  
  await dashboardPage.goto();
  
  await expect(dashboardPage.topBar).toBeVisible();
  await expect(dashboardPage.logoutButton).toBeVisible();
  
  const isAuth = await dashboardPage.isUserAuthenticated();
  expect(isAuth).toBe(true);
});
```

---

## 🎯 Kompletny przykład testu z wykorzystaniem POM

```typescript
import { test, expect } from "@playwright/test";
import { RegisterPage, DashboardPage } from "../pages";

test("Full registration and authentication flow", async ({ page }) => {
  // Arrange
  const registerPage = new RegisterPage(page);
  const dashboardPage = new DashboardPage(page);
  const email = RegisterPage.generateRandomEmail("e2e");
  const password = "SecureTestPass123!";

  // Act - Registration
  await registerPage.goto();
  await registerPage.register(email, password);

  // Assert - Success message
  await expect(registerPage.successMessage).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  // Note: W rzeczywistej aplikacji użytkownik musi potwierdzić email
  // Ten krok może wymagać helpera do automatycznego potwierdzania

  // Act - Navigate to dashboard (po potwierdzeniu email)
  // await page.goto("/");

  // Assert - User is authenticated
  // await expect(dashboardPage.topBar).toBeVisible();
  // await expect(dashboardPage.logoutButton).toBeVisible();
  
  // const isAuthenticated = await dashboardPage.isUserAuthenticated();
  // expect(isAuthenticated).toBe(true);
});
```

---

## 📋 Best Practices

### 1. **Używaj data-test-id dla stabilnych selektorów**

Wszystkie kluczowe elementy używają `data-test-id` zamiast selektorów CSS lub tekstowych, co zapewnia większą stabilność testów.

### 2. **Enkapsuluj logikę interakcji**

Wszystkie interakcje z elementami są ukryte w metodach POM. Testy operują na wysokim poziomie abstrakcji.

```typescript
// ❌ Źle - bezpośrednia interakcja
await page.getByTestId("register-email-input").fill(email);
await page.getByTestId("register-password-input").fill(password);
await page.getByTestId("register-submit-button").click();

// ✅ Dobrze - użycie POM
await registerPage.register(email, password);
```

### 3. **Używaj statycznych metod pomocniczych**

Klasa `RegisterPage` oferuje statyczną metodę `generateRandomEmail()` do generowania losowych emaili.

```typescript
const email = RegisterPage.generateRandomEmail("test");
```

### 4. **Czekaj na kluczowe elementy**

Metody takie jak `goto()` automatycznie czekają na załadowanie kluczowych elementów.

```typescript
async goto() {
  await this.page.goto("/login");
  await this.authCard.waitFor({ state: "visible" });
}
```

### 5. **Weryfikuj stan elementów**

Używaj metod pomocniczych do weryfikacji stanu zamiast bezpośredniego sprawdzania widoczności.

```typescript
const isAuthenticated = await dashboardPage.isUserAuthenticated();
expect(isAuthenticated).toBe(true);
```

---

## 🔄 Importowanie klas POM

### Import indywidualnych klas

```typescript
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { DashboardPage } from "../pages/DashboardPage";
```

### Import z centralnego indeksu

```typescript
import { LoginPage, RegisterPage, DashboardPage } from "../pages";
```

---

## 🚀 Następne kroki

1. **Fixtures dla użytkowników testowych**: Stwórz fixture do automatycznego tworzenia i usuwania użytkowników testowych
2. **Helper do potwierdzania emaili**: Dodaj helper do automatycznego potwierdzania emaili w testach E2E
3. **Więcej Page Objects**: Rozszerz o inne strony (np. ustawienia, profil użytkownika)
4. **Component Objects**: Rozważ stworzenie Component Object Models dla wielokrotnie używanych komponentów (np. Modal, Form)

---

## 📚 Dokumentacja Playwright

- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Locators Best Practices](https://playwright.dev/docs/locators)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
