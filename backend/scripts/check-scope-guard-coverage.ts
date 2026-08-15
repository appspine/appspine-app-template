// Guards against the ScopeGuard fail-open gap: for an API-key caller, ScopeGuard allows the
// request through when no @Scopes() decorator is reachable for the route at all (neither on the
// handler nor the controller class). A class-level @Scopes() closes that for methods that forget
// their own, but a controller that uses ScopeGuard without *any* @Scopes() anywhere is still wide
// open. Fails the build if that shape shows up.
import * as fs from "node:fs";
import * as path from "node:path";

const BACKEND_SRC = path.resolve(__dirname, "../src");

function listControllerFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listControllerFiles(full));
    else if (entry.name.endsWith(".controller.ts")) out.push(full);
  }
  return out;
}

const HTTP_METHOD_DECORATOR = /@(Get|Post|Put|Patch|Delete)\(/;

let failures = 0;

for (const file of listControllerFiles(BACKEND_SRC)) {
  const content = fs.readFileSync(file, "utf8");
  const relPath = path.relative(BACKEND_SRC, file);

  const usesScopeGuard = /@UseGuards\([^)]*\bScopeGuard\b[^)]*\)/.test(content);
  if (!usesScopeGuard) continue;

  const hasClassLevelScopes = /@Controller\([^)]*\)[\s\S]*?\n@Scopes\(/.test(content);

  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (!HTTP_METHOD_DECORATOR.test(lines[i])) continue;

    // Walk backwards from the route decorator through any stacked decorators (e.g. @Get, @Scopes,
    // @UseGuards can appear in any order) until we hit a non-decorator line.
    let hasMethodScopes = false;
    for (let j = i; j >= 0 && /^\s*@/.test(lines[j]); j--) {
      if (/^\s*@Scopes\(/.test(lines[j])) {
        hasMethodScopes = true;
        break;
      }
    }

    if (!hasMethodScopes && !hasClassLevelScopes) {
      console.error(
        `[scope-guard] ${relPath}:${i + 1}: route guarded by ScopeGuard has no reachable @Scopes() ` +
          `(neither on this handler nor the controller class) — an API-key caller with any scope ` +
          `bypasses the check entirely.`,
      );
      failures++;
    }
  }
}

if (failures > 0) {
  console.error(`\n[scope-guard] ${failures} route(s) missing @Scopes() coverage.`);
  process.exit(1);
}

console.log("[scope-guard] all ScopeGuard-protected routes have reachable @Scopes() coverage.");
