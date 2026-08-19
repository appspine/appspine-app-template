import { LoginButton, mapAuthErrorKey } from '@appspine/oidc-auth/frontend';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "@/i18n/server";
import { login } from "@/server/auth-actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const t = await getTranslations("auth");
  const { error } = await searchParams;
  const errorKey = mapAuthErrorKey(error);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>{t("signIn")}</CardTitle>
          <CardDescription>{t("signInDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginButton
            onSignIn={login}
            label={t("signInWithKeycloak")}
            pendingLabel={t("redirecting")}
            errorMessage={errorKey ? t(errorKey) : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
