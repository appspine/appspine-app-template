import { collectEnumTranslationGaps, MetaService } from "@appspine/metadata-schema";

import * as fs from "node:fs";
import * as path from "node:path";

function readEnumDictionary(locale: string): Record<string, unknown> {
  const filePath = path.resolve(__dirname, `../../frontend/messages/${locale}.json`);
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as { enums?: Record<string, unknown> };
  return parsed.enums ?? {};
}

const meta = new MetaService().buildMeta();
const gaps = collectEnumTranslationGaps(meta, {
  en: readEnumDictionary("en"),
  "zh-TW": readEnumDictionary("zh-TW"),
});

const missing = gaps.filter((gap) => gap.kind === "missing");
const orphaned = gaps.filter((gap) => gap.kind === "orphaned");

for (const gap of missing) {
  console.error(`[enums] missing '${gap.locale}' key: ${gap.key}`);
}

for (const gap of orphaned) {
  console.warn(`[enums] orphaned '${gap.locale}' key: ${gap.key}`);
}

if (missing.length > 0) {
  process.exit(1);
}
