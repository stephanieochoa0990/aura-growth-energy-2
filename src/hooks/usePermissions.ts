import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface RolePermissions {
  can_manage_users?: boolean;
  can_manage_roles?: boolean;
  can_edit_content?: boolean;
  can_delete_content?: boolean;
  can_publish_content?: boolean;
  can_view_analytics?: boolean;
  can_export_data?: boolean;
  can_manage_settings?: boolean;
  can_moderate_reviews?: boolean;
  can_manage_sessions?: boolean;
  can_send_notifications?: boolean;
  can_manage_certificates?: boolean;
  can_access_logs?: boolean;
  can_manage_billing?: boolean;
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<RolePermissions>({});
  const [role, setRole] = useState<string>('student');
  const [isAdminFlag, setIsAdminFlag] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Load profile with BOTH role and is_admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_admin')
        .eq('id', user.id)
        .single();

      if (profile) {
        setRole(profile.role || 'student');
        setIsAdminFlag(profile.is_admin === true);

        // Load permissions based on role
        const { data: roleData } = await supabase
          .from('roles')
          .select('permissions')
          .eq('name', profile.role)
          .maybeSingle();

        if (roleData?.permissions) {
          setPermissions(roleData.permissions);
        }
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // True if any admin flag OR admin role is present
  const isAdmin = () => {
    if (isAdminFlag) return true; // explicit admin override

    return [
      'admin',          // added your admin role
      'super_admin',
      'content_manager',
      'moderator',
      'support_staff'
    ].includes(role);
  };

  const hasPermission = (permission: keyof RolePermissions): boolean => {
    return permissions[permission] === true;
  };

  const hasAnyPermission = (perms: (keyof RolePermissions)[]): boolean => {
    return perms.some(p => permissions[p] === true);
  };

  const hasAllPermissions = (perms: (keyof RolePermissions)[]): boolean => {
    return perms.every(p => permissions[p] === true);
  };

  return {
    permissions,
    role,
    isAdmin: isAdmin(),
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refresh: loadPermissions
  };
};
