"use server";

import { getPreference, setValueToCookie as setValueToCookieUnchecked } from "@appspine/frontend-shell/server";

import type { PreferenceKey } from "@/lib/preferences/preferences-config";
import { PREFERENCE_DEFAULTS } from "@/lib/preferences/preferences-config";

export { getPreference };

const KNOWN_PREFERENCE_KEYS = new Set<string>(Object.keys(PREFERENCE_DEFAULTS));

// The package function accepts an arbitrary caller-controlled cookie key/value with no allowlist
// and no httpOnly/secure/sameSite flags. This app only ever writes known preference keys, so
// reject anything else here rather than trusting every future call site to pass a safe key.
export async function setValueToCookie(key: PreferenceKey, value: string) {
  if (!KNOWN_PREFERENCE_KEYS.has(key)) {
    throw new Error(`setValueToCookie: unknown preference key "${key}"`);
  }
  await setValueToCookieUnchecked(key, value);
}
