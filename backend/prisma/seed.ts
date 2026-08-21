import { SYSTEM_ADMIN_ROLE, SYSTEM_USER_ROLE } from "@appspine/identity-core";
import { Permission, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

  if (!email) {
    console.log("SEED_USER_EMAIL not set — skipping user seed.");
    return;
  }

  // AUTH_MODE=oidc only (dev_docs/framework/035): identity comes from the IdP, not a
  // local password. This upsert exists so the seeded email already has ADMIN assigned
  // before that person's first OIDC login, instead of relying on JIT provisioning's
  // default USER role.
  const user = await prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, name },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
    update: {},
    create: { userId: user.id, roleId: adminRole.id },
  });

  console.log(`Seed user ready: ${email} (ADMIN)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
