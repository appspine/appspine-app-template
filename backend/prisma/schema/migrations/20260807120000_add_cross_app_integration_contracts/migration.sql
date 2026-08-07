ALTER TABLE "domain_events"
    ADD COLUMN "integration_capability_id" TEXT,
    ADD COLUMN "integration_capability_version" TEXT,
    ADD COLUMN "integration_capability_digest" TEXT,
    ADD COLUMN "integration_binding_id" TEXT,
    ADD COLUMN "integration_binding_version" TEXT,
    ADD COLUMN "integration_envelope_version" TEXT,
    ADD COLUMN "integration_source_app" TEXT,
    ADD COLUMN "integration_payload" JSONB,
    ADD COLUMN "integration_payload_digest" TEXT;

CREATE TABLE "integration_event_receipts" (
    "id" TEXT NOT NULL,
    "source_app" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "capability_id" TEXT NOT NULL,
    "capability_version" TEXT NOT NULL,
    "capability_digest" TEXT NOT NULL,
    "binding_id" TEXT NOT NULL,
    "binding_version" TEXT NOT NULL,
    "payload_digest" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "integration_event_receipts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "integration_event_receipts_source_app_event_id_key"
    ON "integration_event_receipts"("source_app", "event_id");
CREATE INDEX "integration_event_receipts_binding_id_created_at_idx"
    ON "integration_event_receipts"("binding_id", "created_at");
