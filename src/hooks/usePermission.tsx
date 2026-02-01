import { useAuth } from './useAuth';
import { hasPermission, canAccessPanel, getPermissions, Permission, UserRole } from '@/lib/permissions';

export function usePermission() {
  const { user } = useAuth();

  const role = (user?.role as UserRole) || 'USER';

  return {
    hasPermission: (permission: Permission) => hasPermission(role, permission),
    canAccessPanel: (panel: 'admin' | 'moderator' | 'contributor') => canAccessPanel(role, panel),
    getPermissions: () => getPermissions(role),
    isAdmin: role === 'ADMIN',
    isModerator: role === 'MODERATOR' || role === 'ADMIN',
    isVerifiedContributor: role === 'VERIFIED_CONTRIBUTOR' || role === 'MODERATOR' || role === 'ADMIN',
    role,
  };
}
