# Admin Authentication Implementation Guide

## Overview
This application uses Supabase authentication with role-based access control. After login, the system queries the `profiles` table to determine if a user is an admin and redirects accordingly.

## Database Schema

### Profiles Table Structure
```sql
profiles (
  id UUID PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  first_name TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Authentication Flow

### 1. User Login (AuthForm.tsx)
```javascript
// After successful authentication
const { data: profile } = await supabase
  .from('profiles')
  .select('is_admin')
  .eq('auth_user_id', data.user.id)
  .single();

if (profile?.is_admin) {
  navigate('/admin');
} else {
  navigate('/student-welcome');
}
```

### 2. Admin Login (AdminLogin.tsx)
```javascript
// Checks admin status and denies access if not admin
if (profile?.is_admin) {
  navigate('/admin');
} else {
  await supabase.auth.signOut();
  // Show access denied message
}
```

### 3. Student Welcome (StudentWelcome.tsx)
```javascript
// Redirects admins who accidentally land here
if (profile?.is_admin) {
  navigate('/admin');
  return;
}
```

## Setting Up Admin Users

### Option 1: Direct Database Update
```sql
UPDATE profiles 
SET is_admin = true 
WHERE email = 'admin@example.com';
```

### Option 2: Supabase Dashboard
1. Go to Table Editor
2. Select `profiles` table
3. Find the user by email
4. Set `is_admin` to `true`

## Key Features

✅ Queries `auth_user_id` column to match authenticated user
✅ Simple boolean check: `is_admin` true/false
✅ Automatic redirect based on admin status
✅ Admin-only areas protected with access denial
✅ Clear error messages for unauthorized access

## Routes

- `/` - Main landing page (AuthForm)
- `/admin` - Admin dashboard (requires is_admin = true)
- `/student-welcome` - Student portal entry (for non-admin users)
- `/admin-login` - Dedicated admin login page

## Testing

1. Create a test user account
2. Update their profile: `is_admin = true`
3. Login - should redirect to `/admin`
4. Create another user without admin flag
5. Login - should redirect to `/student-welcome`
