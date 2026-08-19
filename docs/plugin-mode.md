# Plugin mode

This App can compose its Appspine capabilities two ways. Both are supported for the whole
transition window, and switching between them is one environment variable and a restart.

```bash
APPSPINE_PLUGIN_MODE=1   # compose through the plugin host
# anything else (default) keeps the hand-wired imports
```

## Why both

Rolling back has to be cheap, or nobody will roll forward. With a dual mode, reverting from plugin
mode needs no migration, no data change and no second deployment — the previous wiring is still
there and still tested. That is worth more than the tidiness of deleting it.

The default is legacy on purpose: upgrading the packages and changing how they are composed are two
separate, separately reversible steps.

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

## What is still hand-wired in plugin mode

`RbacModule`, `ApiKeysModule`, `MetaModule` and `McpModule`. They have no plugin manifest yet and
migrate in Phase 4. `backend/src/app.module.ts` lists them explicitly rather than hiding the
difference, so the App always shows which capabilities the host owns today.

## Testing

`backend/src/app.module.spec.ts` compiles the module in both modes. It runs without a database:
`compile()` builds the dependency graph without starting anything, which is exactly what catches a
missing provider, a duplicate route or an unsatisfied capability. Behaviour against a real database
stays the E2E suite's job.
