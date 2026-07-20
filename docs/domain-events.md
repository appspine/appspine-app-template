# Domain Events

`@appspine/domain-events` gives this app a transaction-bound outbox: business writes and the
"something happened" fact they produce commit together, and a background dispatcher delivers
that fact to whatever handlers care about it — with retry, dead-letter, and stale-lock recovery
built in. It's already wired into this template (`backend/src/domain-events/domain-events.module.ts`,
imported into `AppModule`), but the handler registry starts **empty** — there are no business
events yet. This doc is the walkthrough for adding your first one.

## Is this the right tool for the job?

Reach for domain events when a write needs to trigger a **derived**, best-effort side effect —
a webhook, a cross-system notification, a future workflow signal — where the side effect (a)
should not run inside the same request/transaction (too slow, or the caller shouldn't block on
it), and (b) must not be silently lost if it fails once (needs retry/dead-letter, not a fire-and-forget
`.catch(console.error)`).

**Don't** reach for it when:

- The effect must be strictly synchronous and consistent with the write (e.g. a version-lock
  compare-and-increment, or another write that must succeed or fail atomically with the first).
  Keep that in the same transaction, not behind an event.
- You just need a simple audit trail entry. `@appspine/audit-log` already does that directly and
  more simply — don't route audit writes through domain events unless you specifically need the
  outbox's retry semantics for them (as `apps/approve` does, see below).
- There's only one caller and one callee that already call each other directly. Forcing an event
  between two things that were going to call each other synchronously anyway just adds latency
  and a layer of indirection with nothing to show for it.

## Recording your first event

1. **Define the event type as an `as const` object**, not a free-form string — a typo in a
   string literal makes a subscription silently never match, which is a miserable thing to debug:

   ```ts
   // backend/src/domain-events/events.ts
   export const InvoiceEvents = {
     Approved: "invoice.approved",
   } as const;
   ```

2. **Call `DomainEventsService.record()` inside the same transaction as the business write** —
   this is the one non-negotiable rule. If the write and the record aren't in the same `tx`, you
   lose the "never silently drop an event" guarantee the whole mechanism exists for:

   ```ts
   import { DomainEventsService, DomainEventOperation } from "@appspine/domain-events";

   @Injectable()
   export class InvoicesService {
     constructor(
       private readonly prisma: PrismaService,
       private readonly domainEvents: DomainEventsService,
     ) {}

     async approve(id: string, actorUserId: string) {
       return this.prisma.$transaction(async (tx) => {
         const before = await tx.invoice.findUniqueOrThrow({ where: { id } });
         const invoice = await tx.invoice.update({ where: { id }, data: { status: "APPROVED" } });

         await this.domainEvents.record(tx, {
           aggregateType: "Invoice",
           aggregateId: id,
           eventType: InvoiceEvents.Approved,
           operation: DomainEventOperation.UPDATE,
           actorUserId,
           before: { status: before.status },
           after: { status: invoice.status },
           changedFields: ["status"],
         });

         return invoice;
       });
     }
   }
   ```

   `before`/`after` should be stable, JSON-serializable snapshots (convert `Date` to ISO strings).
   `changedFields` can be passed explicitly or omitted — omitting it makes `record()` diff
   `before`/`after` for you via `diffChangedFields()`.

3. **Register a handler with `@DomainEventSubscriber`.** A handler is
   `{ key: string; handle(input): Promise<void> }`, decorated so the registry can discover it
   automatically. `key` must be globally unique (not just unique per event type — deliveries
   store only the key, not the event type, so `resolve()` needs it to be unambiguous) and must
   not contain `:` — the registry rejects such keys at registration, because `:` is reserved for
   data-driven delivery keys like `webhook.post:<subscriptionId>` resolved via `registerPrefix()`
   (see "Code-registered vs. data-driven" below):

   import {
     DomainEventSubscriber,
     type DomainEventHandler,
     type DomainEventRecord,
     postDomainEventWebhook,
   } from "@appspine/domain-events";
   // backend/src/domain-events/handlers/invoice-webhook.handler.ts
   import { DomainEventSubscriber, type DomainEventHandler, type DomainEventRecord } from "@appspine/domain-events";
   import { InvoiceEvents } from "../events";

   @Injectable()
   @DomainEventSubscriber({
     key: "invoice-webhook",
     eventType: InvoiceEvents.Approved,
     description: "Posts an outbound webhook when an invoice is approved.",
   })
   export class InvoiceWebhookHandler implements DomainEventHandler {
     readonly key = "invoice-webhook";
     async handle({ event }: { event: DomainEventRecord }) {
       await postDomainEventWebhook({
         event,
         url: process.env.INVOICE_WEBHOOK_URL!,
         secret: process.env.INVOICE_WEBHOOK_SECRET!,
       });
     }
     }
   }
   ```

   `description` is required (empty strings throw at boot) — it's what shows up in the admin
   catalog view (`/dashboard/domain-events/catalog`), so write it for the person reading that
   screen later, not for yourself right now.

   Then, in `backend/src/domain-events/domain-events.module.ts`, register it inside the
   `DomainEventRegistry` factory with `registerDomainEventSubscribers()` — this is the only file
   allowed to call it (or `registry.on(...)`/`registerPrefix()`/`registerHandlerKeyContributor()`
   directly; see "Enforcement" below):

   ```ts
   import { registerDomainEventSubscribers } from "@appspine/domain-events";

   useFactory: (handler: InvoiceWebhookHandler) => {
     const registry = new DomainEventRegistry();
     registerDomainEventSubscribers([handler], registry);
     return registry;
   },
   inject: [InvoiceWebhookHandler],
   ```

   (Remember to add `InvoiceWebhookHandler` to the module's own `providers` array too.)

That's it — the dispatcher (already running, per `AppModule`'s import of `DomainEventsModule`)
picks up the resulting `DomainEventDelivery` row on its next tick and calls your handler.

## File layout convention

Every app's domain-events code follows the same layout (dev_docs/002-app-dev-conventions.md,
"Domain Events 使用慣例") so any agent or engineer can find things without hunting:

| Content | Location | Rule |
| --- | --- | --- |
| Event constants | `backend/src/domain-events/events.ts` | `as const` object, one per aggregate |
| Handler class | `backend/src/domain-events/handlers/<name>.handler.ts` | One file per class, named `<Name>DomainEventHandler`, decorated with `@DomainEventSubscriber` |
| Wiring | `backend/src/domain-events/domain-events.module.ts` | The only file allowed to call `registerDomainEventSubscribers()`/`registry.on()`/`registerPrefix()`/`registerHandlerKeyContributor()` |
| `record()` calls | Inside the relevant business service | Must share the business write's transaction (unchanged rule) |

Adding a subscriber is a 3-step, mechanical change: add a constant to `events.ts` (if it's a new
event) → add a decorated handler file under `handlers/` → add the handler to the module's
`providers` and to the `registerDomainEventSubscribers()` call. Nothing else needs to change.

## Code-registered vs. data-driven handlers

Almost every handler should be **code-registered** (the `@DomainEventSubscriber` pattern above) —
"notify X when Y happens" is a developer decision, reviewed in `git log`, type-checked by `tsc`.
The one legitimate exception is **admin-configured routing** (e.g. `apps/approve`'s
webhook-subscription table, where an admin — not a developer — decides which URLs get which
events at runtime). That case is resolved through `registerPrefix()`/`registerHandlerKeyContributor()`
instead of a fixed key, and its handler is deliberately left **undecorated** — mark it with a
`// @domain-events-undecorated: <reason>` comment at the top of the file so the enforcement script
(next section) doesn't flag it as "forgot the decorator." See
`dev_docs/future_plans/Z20-domain-events-outbox.md` §8 in the `appspine` workspace repo for the
full reasoning.

## Enforcement

Two layers catch a convention violation before it ships:

1. **Boot-time, fail-loud** (built into the package): `registerDomainEventSubscribers()` throws
   if a handler is missing `@DomainEventSubscriber`, if the decorator's `key` doesn't match the
   handler's own `readonly key`, or if `description` is empty. The app won't start with a
   half-wired handler.
2. **`check:domain-events-subscribers`** (`backend/scripts/check-domain-events-subscribers.ts`,
   wired into `.husky/pre-commit`): a grep-level static check that (a) no file other than
   `domain-events.module.ts` calls `registry.on(...)` directly, and (b) every
   `handlers/*.handler.ts` file has either `@DomainEventSubscriber` or the
   `@domain-events-undecorated:` exemption marker described above.

## Admin catalog

`DomainEventsAdminModule.forRoot(DomainEventsModule)` is already mounted in `AppModule`, exposing
`GET /domain-events/catalog` (plus the full list/detail/retry/ignore API — see the package's own
docs for the complete surface). With an empty handler registry it simply reports "no
subscriptions yet," which is a legitimate, useful starting state — you don't need to wait until
you have a handler to confirm the endpoint works. This template does **not** include the
frontend catalog/list/detail pages by default (there's nothing meaningful to browse with zero
handlers); once you add your first subscriber, copy the pattern from a real app's
`frontend/src/app/(main)/dashboard/(admin)/domain-events/` directory (e.g. `apps/wiki` or
`apps/calendar`) along with its sidebar/breadcrumb/i18n entries.

## Handler idempotency

The dispatcher is **at-least-once**, not exactly-once: a stale lock reclaim or a retry after a
transient failure can call the same handler for the same delivery more than once. Handlers must
be safe to re-run — key any external side effect (a webhook POST, a row you upsert) off the
event's `id`, the same way `apps/approve`'s `audit-record` handler upserts on `sourceEventId`.

For simple outbound POST webhooks, call `postDomainEventWebhook()` from `@appspine/domain-events`
instead of copying redaction, HMAC signing, timeout, and response-draining helpers into the app.

## Schema: documented pattern, not an injected fragment

`@appspine/domain-events` does not ship a `.prisma` file — each app owns its own migration
history (see `backend/prisma/schema/domain-events.prisma`, already added to this template). If
you ever need to touch that schema, re-run:

```bash
pnpm -C backend prisma:generate
pnpm -C backend schema:docs
pnpm -C backend check:domain-events-schema-drift
```

The drift-check compares your actual generated `Prisma.dmmf.datamodel` against the pattern the
package's dispatcher depends on (its claim query hardcodes physical table/column names in raw
SQL) — it's wired into `.husky/pre-commit` alongside `check:schema-docs`/`check:enum-i18n`, so a
schema edit that breaks the contract fails loudly at commit time instead of at runtime.

## Testing

`@appspine/domain-events/testing` exports mock builders (`createMockDomainEventTx`,
`createMockDeliveryRow`, `createMockDispatcherPrisma`) so you can exercise `record()` and the
dispatcher's `tick()` without a real database. The published package ships compiled output only —
for usage examples see its test suite in the `appspine` workspace repo
(`packages/domain-events/src/*.spec.ts`).

## Reference implementations

- `apps/approve` (github.com/appspine/approve) — the original, full-featured adoption: seven
  event types, an `audit-record` handler, a `webhook.post` handler with admin-managed
  subscriptions (CRUD API + UI, encrypted secrets), and an admin UI for inspecting
  events/deliveries and retrying/ignoring dead letters.
- `apps/wiki` (github.com/appspine/wiki) — a minimal vertical slice: one event
  (`WikiPage.visibility_changed`), one code-registered `webhook.post` handler backed by a single
  env-configured URL/secret, no admin UI or subscription model. Closer to what a first adoption
  in a new app is likely to look like.
- `apps/calendar`, `apps/chat`, `apps/drive`, and `apps/project` — additional minimal vertical
  slices that record one meaningful status/lifecycle transition per app and deliver it through
  the same env-configured `webhook.post` handler pattern.

All of these are real, running code — reading their `backend/src/domain-events/` directories is
often faster than re-deriving the pattern from this doc alone.
