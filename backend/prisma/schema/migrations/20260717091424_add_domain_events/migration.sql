-- CreateEnum
CREATE TYPE "DomainEventOperation" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "DomainEventDeliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'DEAD_LETTER', 'IGNORED');

-- CreateTable
CREATE TABLE "domain_events" (
    "id" TEXT NOT NULL,
    "seq" BIGSERIAL NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "operation" "DomainEventOperation" NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "actor_user_id" TEXT,
    "correlation_id" TEXT,
    "workflow_id" TEXT,
    "before" JSONB,
    "after" JSONB,
    "changed_fields" TEXT[],
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domain_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_event_deliveries" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "handler_key" TEXT NOT NULL,
    "status" "DomainEventDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3),
    "locked_at" TIMESTAMP(3),
    "locked_by" TEXT,
    "last_error" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domain_event_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "domain_events_seq_key" ON "domain_events"("seq");

-- CreateIndex
CREATE INDEX "domain_events_aggregate_type_aggregate_id_idx" ON "domain_events"("aggregate_type", "aggregate_id");

-- CreateIndex
CREATE INDEX "domain_events_event_type_idx" ON "domain_events"("event_type");

-- CreateIndex
CREATE INDEX "domain_events_workflow_id_idx" ON "domain_events"("workflow_id");

-- CreateIndex
CREATE INDEX "domain_event_deliveries_status_next_attempt_at_idx" ON "domain_event_deliveries"("status", "next_attempt_at");

-- CreateIndex
CREATE UNIQUE INDEX "domain_event_deliveries_event_id_handler_key_key" ON "domain_event_deliveries"("event_id", "handler_key");

-- AddForeignKey
ALTER TABLE "domain_event_deliveries" ADD CONSTRAINT "domain_event_deliveries_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "domain_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
