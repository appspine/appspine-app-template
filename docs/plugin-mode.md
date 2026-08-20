# Plugin mode

This App composes Appspine capabilities through the plugin host. The v2 dual-mode transition has
ended: `APPSPINE_PLUGIN_MODE` no longer selects hand-wired capability modules, including when it is
set to `0`.

## The files

| File | Owner | What it holds |
| --- | --- | --- |
| `backend/appspine.plugins.json` | `appspine` CLI | which plugins run, under which instance ids |
| `backend/src/appspine.config.ts` | you | the values those plugins read |
| `backend/appspine.plugin-lock.json` | `appspine build` | the resolved graph, committed and reviewed as a diff |
| `backend/.appspine/generated/` | `appspine build` | composition, catalog, Prisma schema, permission plan — regenerated, never edited |
| environment | your operator | issuers, credentials, endpoints |
| `pnpm-lock.yaml` | pnpm | package versions and integrity |

Nothing in the first two files is a credential. `backend/src/appspine.config.ts` forwards three
non-secret OIDC values out of the environment because the App is what knows its own deployment; a
real secret is read by the plugin itself and never passes through here.

## Working with it

```bash
pnpm -C backend appspine:build     # regenerate everything derived
pnpm -C backend appspine:check     # assert it is all current (what CI runs)
pnpm -C backend appspine:doctor    # what is enabled, what is missing, what is stale
```

`appspine build` is a prerequisite of `pnpm -C backend build`: `src/appspine.config.ts` imports the
generated composition. `.appspine/generated/` is gitignored — it is output. The plugin lockfile is
not: it is how a reviewer sees that a package upgrade changed the capability graph.

## What remains app-owned

Platform foundation and business modules remain explicit in `backend/src/app.module.ts`. Standard
capabilities come from `createAppspineModule(appspineConfig)` and the committed plugin inventory.

## Testing

`backend/src/app.module.spec.ts` compiles the plugin-only module, including with the retired
`APPSPINE_PLUGIN_MODE=0` setting present. It runs without a database: `compile()` builds the
dependency graph without starting anything, which is exactly what catches a missing provider, a
duplicate route or an unsatisfied capability. Behaviour against a real database stays the E2E
suite's job.
