/**
 * Generates docs/data-dictionary.md from Prisma DMMF.
 * Run: pnpm -C backend schema:docs
 *
 * The output is consumed by AI agents at design time to understand
 * the data model without reading source code.
 */
import { renderDataDictionary, MetaService } from '@appspine/metadata-schema';
import * as fs from 'fs';
import * as path from 'path';

const meta = new MetaService().buildMeta();
const markdown = renderDataDictionary(meta);

const outPath = path.resolve(__dirname, '../../docs/data-dictionary.md');
fs.writeFileSync(outPath, markdown, 'utf8');
console.log(`✔ Written to ${outPath}`);
