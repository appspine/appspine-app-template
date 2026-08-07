# Domain Events 043 Migration Runbook

This runbook covers the additive 043 integration fields and
`integration_event_receipts` table. Each app owns and runs its own Prisma migration history;
there is no cross-repository migration command.

## Before the upgrade

1. Record the current application version and the latest applied migration:
   `pnpm -C backend exec prisma migrate status --schema prisma/schema`.
2. Take a verified database backup and confirm that the backup can be restored in the
   environment's normal recovery procedure.
3. Confirm that the release contains the generated Prisma client and the committed migration
   under `backend/prisma/migrations/`.
4. For a staged rollout, deploy the migration before enabling integration producers or receivers.

## Apply and verify

Run the additive migration from the app repository:

```text
pnpm -C backend prisma:deploy
pnpm -C backend prisma:generate
pnpm -C backend check:domain-events-schema-drift
```

The migration adds nullable integration metadata to `DomainEvent`, adds
`capability_digest` to `IntegrationEventReceipt`, and creates the receipt table and its unique
`(source_app, event_id)` key. Verify the migration record is present and that the table, columns,
and unique key exist before enabling the new receiver path.

## Partial failure and rollback

- If `prisma:deploy` fails, stop the release, keep the application on the previous version, and
  inspect the failed migration and database error. Do not mark the migration applied manually.
- Retry only after fixing the database condition; Prisma migrations are forward-only and the
  additive statements are safe to rerun through the normal migration mechanism.
- If application rollback is required after a successful migration, roll back the application
  binary while leaving the additive schema in place. The previous code ignores the nullable
  columns and does not use the new receipt table.
- Do not drop columns or the receipt table as an emergency rollback. A destructive cleanup is a
  separately reviewed migration after all supported application versions have moved forward.
- If data repair is required, restore to an isolated database, validate the recovery, and follow
  the app's approved backup/restore procedure; never delete receipts to force a replay.

## Operational kill switch

Set `DOMAIN_EVENTS_DISABLED_BINDINGS` to a comma-separated list of binding IDs, or `*` to pause
all integration bindings. The dispatcher observes this on its next delivery attempt and returns a
retryable 503 path for inbound Webhook v2 verification. Verify the pause through dispatcher logs,
delivery status, and the absence of new outbound requests before investigating further.
