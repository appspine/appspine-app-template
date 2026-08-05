import { checkNotificationSchemaDrift } from "@appspine/notification";
import { Prisma } from "@prisma/client";

const issues = checkNotificationSchemaDrift(Prisma.dmmf.datamodel);
for (const issue of issues) console.error(`[notification-schema-drift] ${issue}`);
if (issues.length > 0) process.exit(1);
console.log("Notification schema drift check passed.");
