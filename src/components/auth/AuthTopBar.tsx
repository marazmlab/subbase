import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AuthTopBar() {
  return (
    <header className="fixed right-4 top-4 z-50">
      <ThemeToggle />
    </header>
  );
}
