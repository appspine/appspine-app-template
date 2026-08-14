import {
  DOMAIN_EVENT_DISPATCHER_OPTIONS,
  DomainEventDispatcherService,
  DomainEventRegistry,
  DomainEventsService,
} from "@appspine/domain-events";
import { MODULE_METADATA } from "@nestjs/common/constants";
import { describe, expect, it } from "vitest";

import { DomainEventsModule } from "./domain-events.module";

type FactoryProvider = {
  provide: unknown;
  useFactory: () => unknown;
};

function isFactoryProvider(provider: unknown, token: unknown): provider is FactoryProvider {
  return typeof provider === "object" && provider !== null && "provide" in provider && provider.provide === token;
}

describe("DomainEventsModule", () => {
  it("wires an empty registry, dispatcher options, and the public domain-event services", () => {
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, DomainEventsModule) as unknown[];
    const exports = Reflect.getMetadata(MODULE_METADATA.EXPORTS, DomainEventsModule) as unknown[];

    const registryProvider = providers.find((provider) => isFactoryProvider(provider, DomainEventRegistry));
    const optionsProvider = providers.find((provider) => isFactoryProvider(provider, DOMAIN_EVENT_DISPATCHER_OPTIONS));

    expect(registryProvider).toBeDefined();
    expect(registryProvider?.useFactory()).toBeInstanceOf(DomainEventRegistry);
    expect((registryProvider?.useFactory() as DomainEventRegistry).describe()).toEqual({
      subscribers: [],
      dataDrivenPrefixes: [],
      hasHandlerKeyContributors: false,
    });
    expect(optionsProvider).toBeDefined();
    expect(providers).toContain(DomainEventDispatcherService);
    expect(providers).toContain(DomainEventsService);
    expect(exports).toEqual(expect.arrayContaining([DomainEventRegistry, DomainEventsService]));
  });
});
