# Role-Based Access Control (RBAC) Implementation Guide

## Overview
The admin system has been upgraded from a simple `is_admin` flag to a comprehensive role-based access control (RBAC) system with granular permissions.

## Available Roles

### 1. Super Administrator (`super_admin`)
**Full system access with all permissions**
- Manage users and roles
- Edit, delete, and publish content
- View analytics and export data
- Manage system settings
- Moderate reviews
- Manage live sessions
- Send notifications
- Manage certificates
- Access system logs
- Manage billing

### 2. Content Manager (`content_manager`)
**Can create, edit, and publish content**
- Edit and delete content
- Publish content
- Manage live sessions
- View analytics
- Manage certificates

### 3. Moderator (`moderator`)
**Can moderate user content and community**
- Moderate reviews
- View analytics
- Send notifications
- Access logs

### 4. Support Staff (`support_staff`)
**Can assist users and view information**
- View analytics
- Send notifications
- Access logs

### 5. Student (`student`)
**Regular student access**
- No admin permissions

## Using the Permission System

### In React Components
```typescript
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const { hasPermission, role, isAdmin } = usePermissions();

  if (hasPermission('can_edit_content')) {
    // Show content editing UI
  }

  if (hasPermission('can_manage_users')) {
    // Show user management UI
  }

  return (
    <div>
      {hasPermission('can_moderate_reviews') && (
        <ReviewModerationPanel />
      )}
    </div>
  );
}
```

### Available Permission Checks
- `can_manage_users`
- `can_manage_roles`
- `can_edit_content`
- `can_delete_content`
- `can_publish_content`
- `can_view_analytics`
- `can_export_data`
- `can_manage_settings`
- `can_moderate_reviews`
- `can_manage_sessions`
- `can_send_notifications`
- `can_manage_certificates`
- `can_access_logs`
- `can_manage_billing`

## Assigning Roles

### Via Admin Dashboard
1. Navigate to Admin Dashboard
2. Go to "User Roles" tab
3. Select user and assign role
4. Click "Save"

### Via Edge Function
```typescript
const { data } = await supabase.functions.invoke('assign-role', {
  body: {
    targetUserId: 'user-uuid',
    roleName: 'content_manager',
    adminUserId: 'admin-uuid'
  }
});
```

## Database Structure

### Roles Table
- `id`: UUID
- `name`: Unique role identifier
- `display_name`: Human-readable name
- `description`: Role description
- `permissions`: JSONB object with permission flags
- `is_system_role`: Boolean (prevents deletion)

### Profiles Table
- Added `role` column (TEXT, default: 'student')
- Maintains `is_admin` for backward compatibility

## Migration from is_admin Flag

The system maintains backward compatibility:
- Users with `is_admin = true` are treated as having admin access
- New role system takes precedence when `role` is set
- Admin check: `is_admin = true OR role IN ('super_admin', 'content_manager', 'moderator', 'support_staff')`

## Security

### Row Level Security (RLS)
- Roles table: Anyone can read, only super_admins can modify
- Profiles table: Users can view/update own profile, admins can view all

### Edge Function Security
- `check-permission`: Verifies user permissions
- `assign-role`: Requires `can_manage_roles` permission

## Admin Dashboard Integration

The AdminDashboard now uses permission-based tab visibility:
- Each tab checks for specific permissions
- Users only see tabs they have access to
- Content is dynamically filtered based on role

## Best Practices

1. **Always check permissions** before showing admin UI
2. **Use the usePermissions hook** for consistent permission checking
3. **Assign minimum required permissions** for each role
4. **Regularly audit user roles** in the User Roles tab
5. **Test with different roles** to ensure proper access control

## Troubleshooting

### User can't access admin dashboard
- Check if user has any admin role assigned
- Verify `role` column in profiles table
- Check if `is_admin` flag is set (legacy)

### Permission not working
- Verify permission name matches exactly
- Check role's permissions JSONB in roles table
- Ensure usePermissions hook is properly loaded

### Role assignment fails
- Verify admin has `can_manage_roles` permission
- Check if target role exists in roles table
- Verify edge function is deployed correctly
