# Admin Setup Guide

## Overview
This guide explains how to set up the first administrator account using the secure one-time setup token system.

## Setup Process

### 1. Generate a Setup Token
Run this SQL in your Supabase SQL Editor:

```sql
INSERT INTO public.setup_tokens (token) 
VALUES ('YOUR_SECURE_TOKEN_HERE_12345');
```

**Important:** Replace `YOUR_SECURE_TOKEN_HERE_12345` with a strong, random token. Use a password generator or run:
```bash
openssl rand -base64 32
```

### 2. User Registration
1. Have the first admin user register an account at your application's signup page
2. Verify their email address
3. Log in to the application

### 3. Admin Setup
1. Navigate to `/admin-setup` in your browser
2. Enter the setup token you generated in step 1
3. Click "Setup Admin Access"
4. You will be automatically redirected to the admin dashboard

### 4. Security
- Each token can only be used **once**
- After use, the token is marked as `used=true` and cannot be reused
- Only authenticated users can access the setup page
- Users who are already admins are automatically redirected to the dashboard

## Adding Additional Admins

After the first admin is set up, they can:
1. Generate new setup tokens via SQL
2. Share tokens securely with new admin users
3. Or use the admin dashboard to directly assign admin privileges (if that feature is implemented)

## Troubleshooting

### "Invalid or already used setup token"
- The token has already been used
- The token doesn't exist in the database
- Generate a new token and try again

### "Not authenticated"
- You must be logged in to use the setup page
- Go to `/admin-login` and sign in first

### Permission Errors
- Ensure the RLS policies are properly set up
- Run the migration: `update_setup_tokens_policies.sql`
