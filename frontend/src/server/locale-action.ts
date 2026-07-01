"use server";

import type { Locale } from "@appspine/frontend-shell";

import { setValueToCookie } from "./server-actions";

export async function setLocaleAction(next: Locale): Promise<void> {
  await setValueToCookie("locale", next);
}
