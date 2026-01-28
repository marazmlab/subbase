import type { SubscriptionDTO } from "@/types";

/**
 * System prompt defining AI behavior for subscription analysis
 *
 * Guidelines enforced:
 * - Focus on cost optimization
 * - Identify overlapping services
 * - Highlight unused subscriptions
 * - Suggest better billing cycles
 * - Keep insights concise (max 100 words each)
 * - Generate 2-4 insights per analysis
 */
export const SYSTEM_PROMPT = `Jesteś doradcą finansowym specjalizującym się w zarządzaniu subskrypcjami.
Twoim zadaniem jest analiza subskrypcji użytkownika i dostarczenie praktycznych spostrzeżeń.

Wytyczne:
- Skup się na możliwościach optymalizacji kosztów
- Identyfikuj nakładające się lub zduplikowane usługi
- Zwróć uwagę na potencjalnie niewykorzystywane subskrypcje
- Sugeruj lepsze cykle rozliczeniowe, gdy to właściwe
- Zachowaj zwięzłość spostrzeżeń (maksymalnie 100 słów każde)
- Wygeneruj 2-4 spostrzeżenia na analizę
- Wszystkie spostrzeżenia muszą mieć typ "observation"
- Używaj języka polskiego`;

/**
 * Builds user prompt with subscription data
 */
export function buildUserPrompt(subscriptions: SubscriptionDTO[]): string {
  const subscriptionsList = subscriptions
    .map((sub, idx) => {
      const parts = [
        `${idx + 1}. ${sub.name}`,
        `   - Koszt: ${sub.cost} ${sub.currency} / ${sub.billing_cycle === "monthly" ? "miesięcznie" : "rocznie"}`,
        `   - Status: ${sub.status}`,
        `   - Data rozpoczęcia: ${sub.start_date}`,
      ];

      if (sub.description) {
        parts.push(`   - Opis: ${sub.description}`);
      }

      return parts.join("\n");
    })
    .join("\n\n");

  const activeCount = subscriptions.filter((s) => s.status === "active").length;

  return `Przeanalizuj następujące subskrypcje i dostarcz spostrzeżenia:

${subscriptionsList}

Łączna liczba subskrypcji: ${subscriptions.length}
Aktywne subskrypcje: ${activeCount}`;
}
