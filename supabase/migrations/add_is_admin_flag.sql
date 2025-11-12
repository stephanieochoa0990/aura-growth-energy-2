-- Add is_admin column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- Update existing admin users (update this with actual admin emails)
-- Example: UPDATE public.profiles SET is_admin = true WHERE email = 'admin@example.com';

COMMENT ON COLUMN public.profiles.is_admin IS 'Boolean flag indicating if user has admin privileges';
