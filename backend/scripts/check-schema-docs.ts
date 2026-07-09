/**
 * Fails loudly if any Prisma enum is missing a `///` doc comment.
 * Run: pnpm -C backend check:schema-docs
 *
 * Enum documentation is the data source for the Metadata Schema API and
 * docs/data-dictionary.md (see dev_docs/002-app-dev-conventions.md) — an
 * undocumented enum silently produces a blank description in both, so this
 * is checked at commit time rather than left to code review.
 */
import { MetaService } from "@appspine/metadata-schema";

const meta = new MetaService().buildMeta();
const missing = meta.enums.filter((e) => !e.documentation?.trim());

for (const e of missing) {
  console.error(`[schema-docs] enum ${e.name} is missing a /// doc comment`);
}

if (missing.length > 0) {
  process.exit(1);
}
