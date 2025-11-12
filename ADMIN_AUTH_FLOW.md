# Admin Authentication Flow Documentation

## Overview
The application uses Supabase Auth with a profiles table to manage user authentication and admin access. After login, the system checks the profiles table to verify admin privileges.

## Authentication Flow

### 1. User Login
When a user logs in through `/admin-login` or the student portal:

```typescript
// Sign in with Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});
```

### 2. Profile Verification
After successful authentication, the system queries the profiles table:

```typescript
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('is_admin, role')
  .eq('id', data.user.id)  // or .eq('auth_user_id', data.user.id) if your schema differs
  .single();
```

### 3. Admin Access Check
The system supports two methods for admin verification:

#### Legacy Method: is_admin Flag
```typescript
if (profile?.is_admin === true) {
  // ✅ Grant admin access
  navigate('/admin');
}
```

#### RBAC Method: Role-Based Access
```typescript
const adminRoles = ['super_admin', 'content_manager', 'moderator', 'support_staff'];
if (adminRoles.includes(profile?.role)) {
  // ✅ Grant admin access based on role
  navigate('/admin');
}
```

### 4. Access Control
- **Admin Users**: Redirected to `/admin` dashboard
- **Regular Users**: Redirected to `/student-welcome`
- **Failed Verification**: User is signed out and shown error message

## Database Schema

### Profiles Table Structure
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),  -- Matches Supabase Auth user ID
  email TEXT,
  full_name TEXT,
  is_admin BOOLEAN DEFAULT false,  -- Legacy admin flag
  role TEXT DEFAULT 'student',     -- RBAC role
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Note**: If your schema uses `auth_user_id` instead of `id`, update the query:
```typescript
.eq('auth_user_id', data.user.id)  // Use this if your column is named auth_user_id
```

## Granting Admin Access

### Method 1: Using is_admin Flag
```sql
-- Grant admin access to a user
UPDATE profiles 
SET is_admin = true 
WHERE email = 'admin@example.com';
```

### Method 2: Using RBAC Roles
```sql
-- Assign an admin role to a user
UPDATE profiles 
SET role = 'super_admin'  -- or 'content_manager', 'moderator', 'support_staff'
WHERE email = 'admin@example.com';
```

## Implementation Files

### Key Components
1. **`src/components/portal/AuthForm.tsx`**
   - Handles student portal login
   - Checks admin status after login
   - Redirects admins to `/admin`

2. **`src/pages/AdminLogin.tsx`**
   - Dedicated admin login page
   - Verifies admin privileges
   - Shows clear error messages for non-admins

3. **`src/pages/StudentWelcome.tsx`**
   - Checks if logged-in user is admin
   - Redirects admins to dashboard

## Error Handling

### Profile Not Found
If the profile doesn't exist or can't be fetched:
```typescript
if (profileError) {
  console.error('Profile fetch error:', profileError);
  // Treat as regular user or show error
  toast({
    title: "Unable to verify privileges",
    description: "Please contact support.",
    variant: "destructive"
  });
}
```

### Non-Admin Access Attempt
When a non-admin tries to access admin areas:
```typescript
if (!isAdminUser) {
  await supabase.auth.signOut();
  toast({
    title: "❌ Access Denied",
    description: "You do not have admin privileges.",
    variant: "destructive"
  });
  navigate('/');  // Redirect to home
}
```

## Security Best Practices

1. **Always verify on the backend**: Don't rely solely on frontend checks
2. **Use Row Level Security (RLS)**: Enable RLS on the profiles table
3. **Implement server-side validation**: Use Edge Functions for sensitive operations
4. **Regular audits**: Periodically review admin access list
5. **Session management**: Implement proper session timeout for admin users

## Troubleshooting

### User can't access admin panel
1. Verify the user exists in Supabase Auth
2. Check profiles table has matching record with user ID
3. Confirm `is_admin = true` or appropriate role is set
4. Check browser console for error messages

### Profile query fails
1. Verify column names match your schema (`id` vs `auth_user_id`)
2. Ensure RLS policies allow reading profiles
3. Check Supabase connection is properly configured

### Loading states
The app shows loading messages during verification:
- "Verifying credentials..." - During profile check
- "✅ Admin Access Granted" - Successful admin login
- "❌ Access Denied" - Failed admin verification

## Testing

### Manual Testing Steps
1. Create a test user in Supabase Auth
2. Insert profile record with `is_admin = false`
3. Try logging in - should redirect to student portal
4. Update profile to `is_admin = true`
5. Login again - should redirect to admin dashboard

### SQL Test Queries
```sql
-- Check user's admin status
SELECT id, email, is_admin, role 
FROM profiles 
WHERE email = 'test@example.com';

-- List all admin users
SELECT * FROM profiles 
WHERE is_admin = true 
   OR role IN ('super_admin', 'content_manager', 'moderator', 'support_staff');
```