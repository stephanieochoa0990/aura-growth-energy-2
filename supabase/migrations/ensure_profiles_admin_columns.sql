-- Ensure profiles table has proper admin columns
-- This migration adds is_admin and role columns if they don't exist

-- Add is_admin column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN is_admin BOOLEAN DEFAULT false;
        
        COMMENT ON COLUMN profiles.is_admin IS 'Legacy admin flag - true if user has admin access';
    END IF;
END $$;

-- Add role column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN role TEXT DEFAULT 'student';
        
        COMMENT ON COLUMN profiles.role IS 'User role for RBAC: super_admin, content_manager, moderator, support_staff, or student';
    END IF;
END $$;

-- Create index on is_admin for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin 
ON profiles(is_admin) 
WHERE is_admin = true;

-- Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON profiles(role);

-- Create a composite index for admin checks
CREATE INDEX IF NOT EXISTS idx_profiles_admin_check 
ON profiles(id, is_admin, role);

-- Update RLS policies to ensure profiles can be read by authenticated users
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND (is_admin = true OR role IN ('super_admin', 'content_manager', 'moderator', 'support_staff'))
    )
);

-- Grant necessary permissions
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE (is_admin, role) ON profiles TO authenticated;

-- Helper function to check if a user is admin
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND (
            is_admin = true 
            OR role IN ('super_admin', 'content_manager', 'moderator', 'support_staff')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example: Grant admin access to specific users (update emails as needed)
-- UPDATE profiles SET is_admin = true WHERE email = 'admin@example.com';
-- UPDATE profiles SET role = 'super_admin' WHERE email = 'superadmin@example.com';

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('is_admin', 'role')
ORDER BY ordinal_position;