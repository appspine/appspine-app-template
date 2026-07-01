// Mirrors @appspine/auth's UsersService (packages/auth/src/users/users.service.ts)
// response shape. Defined locally — the frontend doesn't depend on backend packages.
export interface RoleRef {
  id: string;
  name: string;
  displayName: string;
  permissionPolicy: string;
}

export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  createdAt: string;
  roles: RoleRef[];
}

// Mirrors @appspine/rbac's RolesService.mapRole() output.
export interface RoleOption {
  id: string;
  name: string;
  displayName: string;
  isSystem: boolean;
}
