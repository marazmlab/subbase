import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "@/components/ui/theme-provider";

/**
 * Custom render function that wraps components with necessary providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  theme?: "light" | "dark" | "system";
}

export function renderWithProviders(ui: ReactElement, options?: CustomRenderOptions) {
  const { theme = "light", ...renderOptions } = options || {};

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider defaultTheme={theme} storageKey="test-theme">
        {children}
      </ThemeProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { renderWithProviders as render };
