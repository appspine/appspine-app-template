import { defaultLocale, locales } from "@/i18n/config";
import { getPreference } from "@/server/server-actions";

import { allMessages, type Messages } from "./messages";

export async function getTranslations<K extends keyof Messages>(namespace: K) {
  const locale = await getPreference("locale", locales, defaultLocale);
  const nsMessages = allMessages[locale][namespace];

  return (key: keyof Messages[K] & string): string => {
    const val = nsMessages[key];
    return (typeof val === "string" ? val : undefined) ?? key;
  };
}
