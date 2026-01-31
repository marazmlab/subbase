import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** Aktywna zakładka */
export type AuthTabValue = "login" | "register";

export interface AuthTabsProps {
  /** Aktualnie aktywna zakładka */
  activeTab: AuthTabValue;
  /** Callback zmiany zakładki */
  onTabChange: (tab: AuthTabValue) => void;
  /** Zawartość zakładki logowania */
  loginContent: React.ReactNode;
  /** Zawartość zakładki rejestracji */
  registerContent: React.ReactNode;
}

/**
 * Komponent przełącznika między formularzem logowania a rejestracji.
 * Oparty na komponencie Tabs z Shadcn/ui.
 */
export function AuthTabs({ activeTab, onTabChange, loginContent, registerContent }: AuthTabsProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onTabChange(value as AuthTabValue)}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login" data-testid="auth-tab-login">Logowanie</TabsTrigger>
        <TabsTrigger value="register" data-testid="auth-tab-register">Rejestracja</TabsTrigger>
      </TabsList>

      <TabsContent value="login" className="mt-4">
        {loginContent}
      </TabsContent>

      <TabsContent value="register" className="mt-4">
        {registerContent}
      </TabsContent>
    </Tabs>
  );
}
