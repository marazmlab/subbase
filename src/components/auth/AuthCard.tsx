import { useCallback, useState } from "react";

import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthTopBar } from "@/components/auth/AuthTopBar";
import { AuthTabs, type AuthTabValue } from "@/components/auth/AuthTabs";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LoginFormValues, RegisterFormValues } from "@/lib/schemas/auth.schema";

/**
 * Główny kontener widoku autentykacji.
 * Opakowuje formularze w kartę i zarządza stanem przełączania między zakładkami.
 * Zachowuje wpisane dane przy przełączaniu między zakładkami.
 */
export function AuthCard() {
  const [activeTab, setActiveTab] = useState<AuthTabValue>("login");

  // Zachowujemy wartości formularzy przy przełączaniu zakładek
  const [loginFormValues, setLoginFormValues] = useState<LoginFormValues>({
    email: "",
    password: "",
  });

  const [registerFormValues, setRegisterFormValues] = useState<RegisterFormValues>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleTabChange = useCallback((tab: AuthTabValue) => {
    setActiveTab(tab);
  }, []);

  const handleLoginValuesChange = useCallback((values: LoginFormValues) => {
    setLoginFormValues(values);
  }, []);

  const handleRegisterValuesChange = useCallback((values: RegisterFormValues) => {
    setRegisterFormValues(values);
  }, []);

  const handleAuthSuccess = useCallback(() => {
    window.location.href = "/";
  }, []);

  return (
    <ThemeProvider>
      <AuthTopBar />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Subbase</CardTitle>
          <CardDescription>
            {activeTab === "login" ? "Zaloguj się do swojego konta" : "Utwórz nowe konto"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AuthTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            loginContent={
              <LoginForm
                initialValues={loginFormValues}
                onValuesChange={handleLoginValuesChange}
                onSuccess={handleAuthSuccess}
              />
            }
            registerContent={
              <RegisterForm
                initialValues={registerFormValues}
                onValuesChange={handleRegisterValuesChange}
                onSuccess={handleAuthSuccess}
              />
            }
          />
        </CardContent>
      </Card>
    </ThemeProvider>
  );
}
