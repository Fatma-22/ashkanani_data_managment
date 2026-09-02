import { User, UserRole, AdminPermissions } from '../types';

export interface UserWithPermissions extends User {
  adminPermissions?: AdminPermissions;
}

/**
 * Check if user has admin permission
 */
export const hasAdminPermission = (
  user: User | null | undefined,
  permission: keyof AdminPermissions
): boolean => {
  if (!user) return false;

  // Owner always has all permissions
  if (user.role === UserRole.OWNER) {
    return true;
  }

  // Check admin permissions
  if (user.role === UserRole.ADMIN) {
    const adminUser = user as any;
    if (adminUser.permissions && typeof adminUser.permissions === 'object') {
      return adminUser.permissions[permission] === true;
    }
  }

  // Agent can do everything related to players they manage
  if (user.role === UserRole.AGENT) {
    return ['canAddPlayers', 'canEditPlayers'].includes(permission);
  }

  return false;
};

/**
 * Check multiple permissions (all must be true)
 */
export const hasAllPermissions = (
  user: User | null | undefined,
  permissions: (keyof AdminPermissions)[]
): boolean => {
  return permissions.every(p => hasAdminPermission(user, p));
};

/**
 * Check any permission (at least one must be true)
 */
export const hasAnyPermission = (
  user: User | null | undefined,
  permissions: (keyof AdminPermissions)[]
): boolean => {
  return permissions.some(p => hasAdminPermission(user, p));
};

/**
 * Check if user can add players
 */
export const canAddPlayers = (user: User | null | undefined): boolean => {
  return hasAdminPermission(user, 'canAddPlayers');
};

/**
 * Check if user can edit players
 */
export const canEditPlayers = (user: User | null | undefined): boolean => {
  return hasAdminPermission(user, 'canEditPlayers');
};

/**
 * Check if user can delete players
 */
export const canDeletePlayers = (user: User | null | undefined): boolean => {
  return hasAdminPermission(user, 'canDeletePlayers');
};

/**
 * Check if user can add agents
 */
export const canAddAgents = (user: User | null | undefined): boolean => {
  return hasAdminPermission(user, 'canAddAgents');
};

/**
 * Check if user can edit agents
 */
export const canEditAgents = (user: User | null | undefined): boolean => {
  return hasAdminPermission(user, 'canEditAgents');
};

/**
 * Check if user can delete agents
 */
export const canDeleteAgents = (user: User | null | undefined): boolean => {
  return hasAdminPermission(user, 'canDeleteAgents');
};

/**
 * Check if user can view reports
 */
export const canViewReports = (user: User | null | undefined): boolean => {
  return hasAdminPermission(user, 'canViewReports');
};

/**
 * Check if user can view/manage financials
 */
export const canViewFinancials = (user: User | null | undefined): boolean => {
  return hasAdminPermission(user, 'canViewFinancials');
};

/**
 * Check if user can manage sponsors
 */
export const canManageSponsors = (user: User | null | undefined): boolean => {
  return hasAdminPermission(user, 'canManageSponsors');
};

/**
 * Check if user can add deals
 */
export const canAddDeals = (user: User | null | undefined): boolean => {
  return hasAdminPermission(user, 'canAddDeals');
};

/**
 * Check if user can edit deals
 */
export const canEditDeals = (user: User | null | undefined): boolean => {
  return hasAdminPermission(user, 'canEditDeals');
};

/**
 * Check if user can delete deals
 */
export const canDeleteDeals = (user: User | null | undefined): boolean => {
  return hasAdminPermission(user, 'canDeleteDeals');
};


/**
 * Check if user can manage news
 */
export const canManageNews = (user: User | null | undefined): boolean => {
  return hasAdminPermission(user, 'canManageNews');
};

/**
 * Check if user can manage landing page
 */
export const canManageLanding = (user: User | null | undefined): boolean => {
  return hasAdminPermission(user, 'canManageLanding');
};

/**
 * Check if user can manage CV requests
 */
export const canManageCVRequests = (user: User | null | undefined): boolean => {
  return hasAdminPermission(user, 'canManageCVRequests');
};

/**
 * Check if user can manage meetings
 */
export const canManageMeetings = (user: User | null | undefined): boolean => {
  return hasAdminPermission(user, 'canManageMeetings');
};

/**
 * Check if user can manage members
 */
export const canManageMembers = (user: User | null | undefined): boolean => {
  return hasAdminPermission(user, 'canManageMembers');
};


/**
 * Check if user can manage nutrition
 */
export const canManageNutrition = (user: User | null | undefined): boolean => {
  return hasAdminPermission(user, 'canManageNutrition');
};


/**
 * Get admin permissions from user object
 */
export const getAdminPermissions = (user: User | null | undefined): AdminPermissions | null => {
  if (!user || user.role !== UserRole.ADMIN) {
    return null;
  }

  const adminUser = user as any;
  return adminUser.permissions || null;
};
