# Token Verification & Role Claims Guide

## Current Authentication Flow

### 1. Token Generation
```typescript
// Frontend gets session with access_token
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token; // JWT token
```

### 2. Token Transmission
```typescript
// Token sent to edge function as Bearer token
await supabase.functions.invoke('add-student', {
  body: { /* data */ },
  headers: {
    Authorization: `Bearer ${session.access_token}`
  }
});
```

### 3. Token Verification (Edge Function)
```typescript
// Edge function verifies token
const authHeader = req.headers.get('authorization');
const token = authHeader.replace('Bearer ', '');

const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
```

## Token Expiry Check

### Frontend: Check Token Expiry
```typescript
const { data: { session } } = await supabase.auth.getSession();

if (session) {
  const expiresAt = session.expires_at; // Unix timestamp
  const now = Math.floor(Date.now() / 1000);
  
  if (expiresAt && expiresAt < now) {
    console.log('Token expired, refreshing...');
    const { data } = await supabase.auth.refreshSession();
    // Use data.session.access_token
  }
}
```

### Automatic Token Refresh
```typescript
// Supabase client auto-refreshes tokens
// But you can manually refresh:
const { data, error } = await supabase.auth.refreshSession();
if (data.session) {
  console.log('New token:', data.session.access_token);
}
```

## JWT Claims Structure

### Decode JWT to View Claims
```javascript
// In browser console or Node.js
function decodeJWT(token) {
  const parts = token.split('.');
  const payload = JSON.parse(atob(parts[1]));
  return payload;
}

// Example usage
const session = await supabase.auth.getSession();
const claims = decodeJWT(session.data.session.access_token);
console.log(claims);
```

### Standard Supabase JWT Claims
```json
{
  "aud": "authenticated",
  "exp": 1699999999,
  "iat": 1699996399,
  "iss": "https://your-project.supabase.co/auth/v1",
  "sub": "user-uuid-here",
  "email": "admin@example.com",
  "role": "authenticated",
  "app_metadata": {},
  "user_metadata": {}
}
```

## Admin Role Verification

### Current System: Database-Based
**IMPORTANT**: Admin status is NOT in JWT claims by default.
It's stored in the `profiles` table.

```typescript
// Edge function checks admin status from database
const { data: profile } = await supabaseAdmin
  .from('profiles')
  .select('is_admin, role')
  .eq('id', user.id)
  .single();

if (!profile?.is_admin) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 403
  });
}
```

### Adding Custom Claims (Optional Advanced Setup)
To add admin role to JWT claims, use Supabase Auth Hooks:

```sql
-- Create auth hook function
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  claims jsonb;
  user_role text;
  is_admin_user boolean;
BEGIN
  -- Get user's role from profiles
  SELECT role, is_admin INTO user_role, is_admin_user
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';
  
  -- Add custom claims
  claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  claims := jsonb_set(claims, '{is_admin}', to_jsonb(is_admin_user));
  
  event := jsonb_set(event, '{claims}', claims);
  
  RETURN event;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Debugging Token Issues

### 1. Check Token Exists
```typescript
const { data: { session } } = await supabase.auth.getSession();
console.log('Has token:', !!session?.access_token);
console.log('Token preview:', session?.access_token?.substring(0, 50));
```

### 2. Verify Token Expiry
```typescript
if (session) {
  const expiresAt = new Date(session.expires_at * 1000);
  const now = new Date();
  console.log('Token expires:', expiresAt);
  console.log('Current time:', now);
  console.log('Is expired:', expiresAt < now);
}
```

### 3. Check Admin Status
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('is_admin, role')
  .eq('id', session.user.id)
  .single();

console.log('Is admin:', profile?.is_admin);
console.log('Role:', profile?.role);
```

### 4. Test Edge Function Auth
```typescript
// Add logging to edge function
console.log('Auth header:', req.headers.get('authorization'));
console.log('Token length:', token?.length);
console.log('User from token:', user?.id, user?.email);
```

## Common Issues & Solutions

### Issue: 401 Unauthorized
**Causes:**
- Token expired
- Invalid token format
- Edge function not receiving token
- Service role key not set

**Solutions:**
```typescript
// 1. Refresh token
await supabase.auth.refreshSession();

// 2. Verify header format
headers: { Authorization: `Bearer ${token}` } // Must have "Bearer "

// 3. Check edge function receives it
console.log('Headers:', Object.fromEntries(req.headers));
```

### Issue: 403 Forbidden
**Causes:**
- User is not admin
- Profile not found
- RLS blocking query

**Solutions:**
```sql
-- 1. Verify admin status
SELECT id, email, is_admin, role FROM profiles WHERE email = 'admin@example.com';

-- 2. Grant admin access
UPDATE profiles SET is_admin = true WHERE email = 'admin@example.com';

-- 3. Check RLS policies allow reading profiles
```

### Issue: Token Refresh Loop
**Cause:** Token expires during operation

**Solution:**
```typescript
// Use auth helper with auto-refresh
import { getAuthenticatedSession } from '@/lib/auth-helpers';

const { session, error } = await getAuthenticatedSession();
// This automatically refreshes if needed
```

## Testing Checklist

- [ ] Token is present in session
- [ ] Token is not expired (check `expires_at`)
- [ ] Token is sent with "Bearer " prefix
- [ ] Edge function receives Authorization header
- [ ] Edge function can decode token with `getUser()`
- [ ] User ID from token matches database
- [ ] Profile exists for user ID
- [ ] `is_admin` flag is `true` in profiles table
- [ ] Service role key is set in edge function secrets
- [ ] RLS policies allow admin to read profiles

## Manual Token Verification

```bash
# In Supabase SQL Editor
SELECT 
  auth.users.id,
  auth.users.email,
  profiles.is_admin,
  profiles.role
FROM auth.users
LEFT JOIN profiles ON auth.users.id = profiles.id
WHERE auth.users.email = 'admin@example.com';
```

## Next Steps

1. **Verify admin user exists** in both `auth.users` and `profiles`
2. **Check `is_admin = true`** in profiles table
3. **Test token** by decoding JWT in browser console
4. **Verify expiry** is in the future
5. **Check edge function logs** for auth errors
6. **Ensure service role key** is set in Supabase dashboard
