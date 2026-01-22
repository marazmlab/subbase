import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Zapobieganie hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled aria-label="Przełącznik motywu">
        <Sun className="size-5" />
      </Button>
    );
  }

  // Używamy resolvedTheme zamiast theme, aby obsłużyć "system"
  const isDark = resolvedTheme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label={isDark ? "Przełącz na jasny motyw" : "Przełącz na ciemny motyw"}
    >
      {isDark ? (
        <Sun className="size-5 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon className="size-5 transition-transform duration-200 hover:-rotate-12" />
      )}
    </Button>
  );
}
