/**
 * Fails loudly if backend/prisma/schema/domain-events.prisma has drifted from the
 * DomainEvent/DomainEventDelivery pattern @appspine/domain-events documents and depends on
 * (its dispatcher hardcodes the physical table/column names in raw SQL).
 * Run: pnpm -C backend check:domain-events-schema-drift
 */
import { checkDomainEventSchemaDrift } from "@appspine/domain-events";
import { Prisma } from "@prisma/client";

const issues = checkDomainEventSchemaDrift(Prisma.dmmf.datamodel);

for (const issue of issues) {
  console.error(`[domain-events-schema-drift] ${issue}`);
}

if (issues.length > 0) {
  process.exit(1);
}
