# Authentication Flow & Admin Access Control Guide

## Overview
This guide explains how the authentication flow works in the application, specifically how admin access is determined after Supabase Auth login.

## Authentication Flow

### 1. User Login (AuthForm.tsx & AdminLogin.tsx)

After a user successfully authenticates with Supabase Auth:

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});
```

### 2. Profile Query for Admin Status

Immediately after login, query the `profiles` table to check admin privileges:

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('is_admin, role')
  .eq('id', data.user.id)
  .single();
```

### 3. Admin Check (Dual System)

The app supports both legacy `is_admin` flag and new RBAC system:

```typescript
const isAdminUser = profile?.is_admin === true || 
  ['super_admin', 'content_manager', 'moderator', 'support_staff'].includes(profile?.role);
```

### 4. Conditional Redirect

Based on admin status, redirect to appropriate dashboard:

```typescript
if (isAdminUser) {
  navigate('/admin');  // Admin dashboard
} else {
  navigate('/student-welcome');  // Student portal
}
```

## Implementation Locations

### AuthForm.tsx (Student Login)
- **Location**: `src/components/portal/AuthForm.tsx`
- **Lines**: 58-84
- **Behavior**: Checks admin status and redirects accordingly

### AdminLogin.tsx (Admin Login)
- **Location**: `src/pages/AdminLogin.tsx`
- **Lines**: 26-43 (session check), 59-84 (login handler)
- **Behavior**: Only allows admin users, signs out non-admins

### StudentWelcome.tsx (Protected Route)
- **Location**: `src/pages/StudentWelcome.tsx`
- **Lines**: 35-49
- **Behavior**: Redirects admins to admin dashboard

## Loading States

All auth flows include loading states to prevent UI flicker:

```typescript
const [loading, setLoading] = useState(false);

// During auth
setLoading(true);
// ... auth logic
setLoading(false);

// In UI
{loading ? 'Processing...' : 'Sign In'}
```

## Role-Based Access Control (RBAC)

### Admin Roles
- `super_admin` - Full system access
- `content_manager` - Content editing and publishing
- `moderator` - Review moderation and community management
- `support_staff` - User support and basic admin functions

### Permission Checking
Use the `usePermissions` hook for granular permission checks:

```typescript
import { usePermissions } from '@/hooks/usePermissions';

const { hasPermission, role, isAdmin } = usePermissions();

if (hasPermission('can_edit_content')) {
  // Show content editing UI
}
```

## Database Schema

### profiles table
```sql
- id (uuid, primary key, references auth.users)
- email (text)
- full_name (text)
- is_admin (boolean, default: false)
- role (text, default: 'student')
```

### roles table
```sql
- id (uuid, primary key)
- name (text, unique)
- permissions (jsonb)
```

## Security Best Practices

1. **Always query profiles table** after auth
2. **Never trust client-side role checks** for sensitive operations
3. **Use Row Level Security (RLS)** on Supabase tables
4. **Verify permissions server-side** for edge functions
5. **Sign out non-admin users** attempting admin access

## Common Patterns

### Protecting Admin Routes
```typescript
useEffect(() => {
  checkAdminAccess();
}, []);

const checkAdminAccess = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    navigate('/admin-login');
    return;
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, role')
    .eq('id', user.id)
    .single();
    
  if (!isAdminUser(profile)) {
    await supabase.auth.signOut();
    navigate('/admin-login');
  }
};
```

### Conditional UI Rendering
```typescript
const { isAdmin, hasPermission } = usePermissions();

return (
  <>
    {isAdmin() && <AdminPanel />}
    {hasPermission('can_edit_content') && <EditButton />}
  </>
);
```

## Troubleshooting

### User can't access admin dashboard
1. Check `profiles.is_admin` is `true` OR `profiles.role` is admin role
2. Verify RLS policies allow reading admin status
3. Check browser console for query errors

### Infinite redirect loop
1. Ensure admin check doesn't redirect admins to student portal
2. Verify session persistence is working
3. Check for conflicting navigation logic

### Permission denied errors
1. Verify RLS policies on tables
2. Check edge function authentication
3. Ensure role permissions are properly set in `roles` table
