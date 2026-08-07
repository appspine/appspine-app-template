#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = process.cwd();
const refsRoot = resolve(root, 'knowledge', 'contracts');
const runtimeRoot = resolve(root, 'backend', 'src', 'generated', 'integration-contracts');
const refs = walk(refsRoot).filter((file) => file.endsWith(join('_generated', 'contract-ref.json')));
for (const refPath of refs) {
  const ref = JSON.parse(readFileSync(refPath, 'utf8'));
  const safeId = ref.contract_id.replace(/[^a-zA-Z0-9_-]/gu, '_');
  const directory = join(runtimeRoot, safeId);
  const manifest = join(directory, 'manifest.ts');
  const validators = join(directory, 'validators.ts');
  if (!existsSync(manifest) || !existsSync(validators)) throw new Error(`missing generated runtime for ${ref.contract_id}@${ref.version}`);
  if (!readFileSync(manifest, 'utf8').includes(ref.digest)) throw new Error(`manifest digest mismatch for ${ref.contract_id}@${ref.version}`);
  if (/knowledge[\\/]/u.test(readFileSync(validators, 'utf8'))) throw new Error(`runtime validator reads knowledge/ for ${ref.contract_id}@${ref.version}`);
}
console.log(`checked ${refs.length} generated integration contract runtime artifact(s)`);

function walk(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}
