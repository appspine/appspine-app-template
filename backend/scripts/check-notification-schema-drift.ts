import { checkNotificationSchemaDrift, parseNotificationSchemaMetadata } from "@appspine/notification";
import { Prisma } from "@prisma/client";

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const NOTIFICATION_TABLE = "notifications";

const schemaDir = join(__dirname, "../prisma/schema");
const migrationDir = join(schemaDir, "migrations");
// Select migrations by content (does this SQL touch the notification table?), not by a
// hand-maintained filename convention — a later migration renamed/squashed/added without the
// "shared_notification" substring must still be picked up, and must still fail the gate loudly.
const tablePattern = new RegExp(`"${NOTIFICATION_TABLE}"`, "i");
const migrationText = readdirSync(migrationDir)
  .filter((name) => statSync(join(migrationDir, name)).isDirectory())
  .sort()
  .map((name) => readFileSync(join(migrationDir, name, "migration.sql"), "utf8"))
  .filter((text) => tablePattern.test(text))
  .join("\n");
// @appspine/notification@0.2.0 scopes @@index/@updatedAt parsing to the Notification model block
// (via this third argument) instead of the whole schema file. notification.prisma only ever
// contains the Notification model, so this is defense-in-depth here rather than a live gap — but
// passing it keeps this script identical in shape to approve's and project's copies.
const metadata = parseNotificationSchemaMetadata(
  readFileSync(join(schemaDir, "notification.prisma"), "utf8"),
  migrationText,
  NOTIFICATION_TABLE,
);
const issues = checkNotificationSchemaDrift(Prisma.dmmf.datamodel, metadata);
for (const issue of issues) console.error(`[notification-schema-drift] ${issue}`);
if (issues.length > 0) process.exit(1);
console.log("Notification schema drift check passed.");
