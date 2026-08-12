#!/usr/bin/env node
// NOTE: This code/template corresponds verbatim with check-generated-integration-contracts.mjs in appspine-packages / app-template / forks. Changes here must be synchronized across repositories.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = process.cwd();
const refsRoot = resolve(root, 'knowledge', 'contracts');
const runtimeRoot = resolve(root, 'backend', 'src', 'generated', 'integration-contracts');
const refs = walk(refsRoot)
  .filter((file) => file.endsWith(join('_generated', 'contract-ref.json')))
  .map((file) => JSON.parse(readFileSync(file, 'utf8')));
const expectedDirectories = new Set();

for (const ref of refs) {
  const safeId = ref.contract_id.replace(/[^a-zA-Z0-9_-]/gu, '_');
  expectedDirectories.add(safeId);
  const directory = join(runtimeRoot, safeId);
  const schemaPath = walk(join(refsRoot, ref.contract_id, '_generated'))
    .filter((file) => file.endsWith('.schema.json'))
    .sort()[0];
  if (!schemaPath) throw new Error(`missing canonical schema for ${ref.contract_id}@${ref.version}`);
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  const expected = {
    'manifest.ts': `export const integrationContractManifest = ${JSON.stringify({
      contractId: ref.contract_id,
      version: ref.version,
      kind: ref.kind,
      digest: ref.digest,
      capabilityRef: ref.capability_ref,
    }, null, 2)} as const;\n`,
    'types.ts': `export type IntegrationContractPayload = ${typescriptType(schema)};\n`,
    'validators.ts': `import { validateJsonSchema, type SchemaValidationIssue } from '@appspine/integration-contracts';\n\nconst integrationContractSchema = ${JSON.stringify(schema, null, 2)} as const;\n\nexport function validateIntegrationContractPayload(value: unknown): SchemaValidationIssue[] {\n  return validateJsonSchema(value, integrationContractSchema as never, { mode: 'strict' });\n}\n`,
  };
  for (const [name, content] of Object.entries(expected)) {
    const target = join(directory, name);
    if (!existsSync(target)) throw new Error(`missing generated runtime ${target}`);
    if (readFileSync(target, 'utf8') !== content)
      throw new Error(`stale generated runtime ${ref.contract_id}@${ref.version}: ${name}`);
  }
}

if (existsSync(runtimeRoot)) {
  for (const entry of readdirSync(runtimeRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && !expectedDirectories.has(entry.name))
      throw new Error(`stale generated runtime directory: ${entry.name}`);
  }
}
console.log(`checked ${refs.length} deterministic generated integration contract runtime artifact(s)`);

function typescriptType(schema) {
  if (!schema || typeof schema !== 'object') return 'unknown';
  if (schema.enum) return schema.enum.map((value) => JSON.stringify(value)).join(' | ');
  if (schema.const !== undefined) return JSON.stringify(schema.const);
  if (Array.isArray(schema.type)) return schema.type.map((type) => typescriptType({ ...schema, type })).join(' | ');
  if (schema.type === 'object') {
    const properties = Object.entries(schema.properties ?? {}).map(([key, child]) =>
      `${JSON.stringify(key)}${(schema.required ?? []).includes(key) ? '' : '?'}: ${typescriptType(child)};`,
    );
    return `{ ${properties.join(' ')}${schema.additionalProperties === false ? '' : ' [key: string]: unknown;'} }`;
  }
  if (schema.type === 'array') return `Array<${typescriptType(schema.items ?? {})}>`;
  if (schema.type === 'integer' || schema.type === 'number') return 'number';
  if (schema.type === 'boolean' || schema.type === 'string' || schema.type === 'null') return schema.type;
  if (schema.anyOf || schema.oneOf) return (schema.anyOf ?? schema.oneOf).map(typescriptType).join(' | ');
  if (schema.allOf) return schema.allOf.map(typescriptType).join(' & ');
  return 'unknown';
}

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
