// Mirrors @appspine/rbac's RolesService.mapRole() output
// (packages/rbac/src/roles/roles.service.ts). Defined locally because the frontend
// doesn't depend on backend packages.
export interface RoleRow {
  id: string;
  name: string;
  displayName: string;
  isSystem: boolean;
  permissionPolicy: string;
  permissions: string[];
  userCount: number;
  apiKeyCount: number;
}
