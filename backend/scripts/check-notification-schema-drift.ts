import { checkNotificationSchemaDrift, parseNotificationSchemaMetadata } from "@appspine/notification";
import { Prisma } from "@prisma/client";

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const schemaDir = join(__dirname, "../prisma/schema");
const migrationDir = join(schemaDir, "migrations");
const migrationNames = readdirSync(migrationDir)
  .filter((name) => name.includes("shared_notification"))
  .sort();
const metadata = parseNotificationSchemaMetadata(
  readFileSync(join(schemaDir, "notification.prisma"), "utf8"),
  migrationNames.map((name) => readFileSync(join(migrationDir, name, "migration.sql"), "utf8")).join("\n"),
);
const issues = checkNotificationSchemaDrift(Prisma.dmmf.datamodel, metadata);
for (const issue of issues) console.error(`[notification-schema-drift] ${issue}`);
if (issues.length > 0) process.exit(1);
console.log("Notification schema drift check passed.");
