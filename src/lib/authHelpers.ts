// Helper functions for authentication and admin checks

import { AdminUser } from './adminApi';

/**
 * Check if a user has admin privileges
 * Supports both isAdmin boolean and roles array
 */
export function isUserAdmin(user: AdminUser | null): boolean {
  if (!user) return false;
  
  // Check if user has isAdmin: true
  if (user.isAdmin === true) return true;
  
  // Check if user has admin role in roles array
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.includes('admin') || user.roles.includes('Admin');
  }
  
  return false;
}

/**
 * Get user's display name or email fallback
 */
export function getUserDisplayName(user: AdminUser | null): string {
  if (!user) return 'Unknown User';
  return user.name || user.email || 'Unknown User';
}

/**
 * Check if user has specific role
 */
export function userHasRole(user: AdminUser | null, role: string): boolean {
  if (!user || !user.roles) return false;
  return user.roles.includes(role);
}
