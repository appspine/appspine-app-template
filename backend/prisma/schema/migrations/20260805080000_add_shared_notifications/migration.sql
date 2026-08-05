CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipient_user_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "source_app" TEXT NOT NULL,
    "source_event_id" TEXT,
    "source_entity_type" TEXT,
    "source_entity_id" TEXT,
    "target_path" TEXT,
    "read_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notifications_recipient_user_id_idempotency_key_key" ON "notifications"("recipient_user_id", "idempotency_key");
CREATE INDEX "notifications_recipient_user_id_read_at_archived_at_created_at_idx" ON "notifications"("recipient_user_id", "read_at", "archived_at", "created_at");
CREATE INDEX "notifications_source_app_source_entity_type_source_entity_id_idx" ON "notifications"("source_app", "source_entity_type", "source_entity_id");
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
