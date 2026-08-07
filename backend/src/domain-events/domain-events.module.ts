import {
  DEFAULT_DISPATCHER_OPTIONS,
  DOMAIN_EVENT_DISPATCHER_OPTIONS,
  type DomainEventDispatcherOptions,
  DomainEventDispatcherService,
  DomainEventRegistry,
  DomainEventsService,
} from "@appspine/domain-events";
import { Module } from "@nestjs/common";

// This module wires @appspine/domain-events' core (registry + dispatcher) into the app but
// registers no handlers because there are no business events yet. See docs/domain-events.md for how
// to define your first event type, call DomainEventsService.record() inside a transaction, and
// register handlers centrally with registerDomainEventSubscribers().
@Module({
  providers: [
    {
      provide: DomainEventRegistry,
      useFactory: () => new DomainEventRegistry(),
    },
    {
      provide: DOMAIN_EVENT_DISPATCHER_OPTIONS,
      useFactory: (): DomainEventDispatcherOptions => ({
        intervalMs: readPositiveInt("DOMAIN_EVENTS_DISPATCH_INTERVAL_MS", DEFAULT_DISPATCHER_OPTIONS.intervalMs),
        batchSize: readPositiveInt("DOMAIN_EVENTS_BATCH_SIZE", DEFAULT_DISPATCHER_OPTIONS.batchSize),
        maxAttempts: readPositiveInt("DOMAIN_EVENTS_MAX_ATTEMPTS", DEFAULT_DISPATCHER_OPTIONS.maxAttempts),
        staleLockMs: readPositiveInt("DOMAIN_EVENTS_STALE_LOCK_MS", DEFAULT_DISPATCHER_OPTIONS.staleLockMs),
        bindingEnabled: (bindingId) => isIntegrationBindingEnabled(bindingId),
      }),
    },
    DomainEventDispatcherService,
    DomainEventsService,
  ],
  exports: [DomainEventRegistry, DomainEventsService],
})
export class DomainEventsModule {}

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isIntegrationBindingEnabled(bindingId: string): boolean {
  const disabled = new Set(
    (process.env.DOMAIN_EVENTS_DISABLED_BINDINGS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  return !disabled.has("*") && !disabled.has(bindingId);
}
