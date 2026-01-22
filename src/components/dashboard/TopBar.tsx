import { useState, useCallback } from "react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/db/supabase.browser";

export function TopBar() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);

    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch {
      setIsLoggingOut(false);
    }
  }, []);

  return (
    <header
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      aria-label="Nagłówek aplikacji"
    >
      <div className="mx-auto flex h-14 max-w-[var(--container-max-width)] items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-primary">Subbase</span>
        </a>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
          aria-label="Wyloguj się"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">{isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}</span>
        </Button>
      </div>
    </header>
  );
}
