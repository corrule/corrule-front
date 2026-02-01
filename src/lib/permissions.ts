// Permission utilities for role-based access control
export type UserRole = 'USER' | 'VERIFIED_CONTRIBUTOR' | 'MODERATOR' | 'ADMIN';
export type Permission = 
  | 'rule:create' 
  | 'rule:read' 
  | 'rule:update:own' 
  | 'rule:update:any' 
  | 'rule:delete:own' 
  | 'rule:delete:any' 
  | 'rule:publish' 
  | 'rule:approve' 
  | 'rule:reject' 
  | 'user:moderate' 
  | '*';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  USER: ['rule:create', 'rule:read', 'rule:update:own', 'rule:delete:own'],
  VERIFIED_CONTRIBUTOR: [
    'rule:create',
    'rule:read',
    'rule:update:own',
    'rule:delete:own',
    'rule:publish',
  ],
  MODERATOR: [
    'rule:create',
    'rule:read',
    'rule:update:any',
    'rule:delete:any',
    'rule:approve',
    'rule:reject',
    'user:moderate',
  ],
  ADMIN: ['*'],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes('*') || permissions.includes(permission);
}

/**
 * Check if a role can access a specific panel/feature
 */
export function canAccessPanel(role: UserRole, panel: 'admin' | 'moderator' | 'contributor'): boolean {
  const panelRoles: Record<string, UserRole[]> = {
    admin: ['ADMIN'],
    moderator: ['MODERATOR', 'ADMIN'],
    contributor: ['VERIFIED_CONTRIBUTOR', 'MODERATOR', 'ADMIN'],
  };

  return panelRoles[panel]?.includes(role) || false;
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Get readable role label
 */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    USER: 'User',
    VERIFIED_CONTRIBUTOR: 'Verified Contributor',
    MODERATOR: 'Moderator',
    ADMIN: 'Administrator',
  };
  return labels[role] || role;
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    USER: 'bg-slate-100 text-slate-800',
    VERIFIED_CONTRIBUTOR: 'bg-blue-100 text-blue-800',
    MODERATOR: 'bg-amber-100 text-amber-800',
    ADMIN: 'bg-red-100 text-red-800',
  };
  return colors[role] || 'bg-slate-100 text-slate-800';
}
