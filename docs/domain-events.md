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

3. **Register a handler.** A handler is just `{ key: string; handle(input): Promise<void> }`.
   `key` must be globally unique (not just unique per event type — deliveries store only the
   key, not the event type, so `resolve()` needs it to be unambiguous):

   ```ts
   @Injectable()
   export class InvoiceWebhookHandler implements DomainEventHandler {
     readonly key = "invoice-webhook";
     async handle({ event }: { event: DomainEventRecord }) {
       // POST it somewhere, write it somewhere else, etc. Must be safe to run more than once —
       // see "Handler idempotency" below.
     }
   }
   ```

   Then, in `backend/src/domain-events/domain-events.module.ts`, register it against the event
   type inside the `DomainEventRegistry` factory:

   ```ts
   useFactory: (handler: InvoiceWebhookHandler) => {
     const registry = new DomainEventRegistry();
     registry.on(InvoiceEvents.Approved, handler);
     return registry;
   },
   inject: [InvoiceWebhookHandler],
   ```

   (Remember to add `InvoiceWebhookHandler` to the module's own `providers` array too.)

That's it — the dispatcher (already running, per `AppModule`'s import of `DomainEventsModule`)
picks up the resulting `DomainEventDelivery` row on its next tick and calls your handler.

## Handler idempotency

The dispatcher is **at-least-once**, not exactly-once: a stale lock reclaim or a retry after a
transient failure can call the same handler for the same delivery more than once. Handlers must
be safe to re-run — key any external side effect (a webhook POST, a row you upsert) off the
event's `id`, the same way `apps/approve`'s `audit-record` handler upserts on `sourceEventId`.

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
dispatcher's `tick()` without a real database. See the package's own test suite for usage
examples.

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

Both are real, running code — reading their `backend/src/domain-events/` directories is often
faster than re-deriving the pattern from this doc alone.
