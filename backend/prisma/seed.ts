import { SYSTEM_ADMIN_ROLE, SYSTEM_USER_ROLE } from "@appspine/auth";
import { Permission, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const bcrypt = require("bcrypt") as {
  hash(value: string, rounds: number): Promise<string>;
};

// FORK REQUIREMENT: the USER role starts with ZERO permissions. Until you add your
// app's module grants here (e.g. [Permission.MY_MODULE_READ, ...]), every freshly
// registered user gets 403 on all PermissionGuard-protected endpoints — the app is
// unusable for non-admins. Fill this in together with your first Permission enum
// values (README "Forking this template" checklist).
const USER_DEFAULT_PERMISSIONS: Permission[] = [];

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: SYSTEM_ADMIN_ROLE },
    update: { displayName: "Administrator", isSystem: true },
    create: { name: SYSTEM_ADMIN_ROLE, displayName: "Administrator", isSystem: true, permissionPolicy: "DENY_ALL" },
  });

  const userRole = await prisma.role.upsert({
    where: { name: SYSTEM_USER_ROLE },
    update: { displayName: "User", isSystem: true },
    create: { name: SYSTEM_USER_ROLE, displayName: "User", isSystem: true, permissionPolicy: "DENY_ALL" },
  });

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId: userRole.id } }),
    prisma.rolePermission.createMany({
      data: USER_DEFAULT_PERMISSIONS.map((p) => ({ roleId: userRole.id, permission: p })),
    }),
  ]);
  console.log("System roles ready (ADMIN, USER)");

  const email = process.env.SEED_USER_EMAIL;
  const name = process.env.SEED_USER_NAME;
  const password = process.env.SEED_USER_PASSWORD;

  if (!email) {
    console.log("SEED_USER_EMAIL not set — skipping user seed.");
    return;
  }

  const passwordHash = password ? await bcrypt.hash(password, 12) : null;

  const user = await prisma.user.upsert({
    where: { email },
    update: passwordHash ? { name, password: passwordHash } : { name },
    create: { email, name, password: passwordHash },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
    update: {},
    create: { userId: user.id, roleId: adminRole.id },
  });

  console.log(`Seed user ready: ${email} (ADMIN)`);
  if (passwordHash) {
    console.log(`Seed user password ready for ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
