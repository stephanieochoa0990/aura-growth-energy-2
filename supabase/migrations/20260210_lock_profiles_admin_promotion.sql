-- Lock down admin promotion and profiles updates.

-- Enable RLS on profiles and tighten update rules.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove old policy that allowed arbitrary self-updates for admin promotion.
DROP POLICY IF EXISTS "Users can update own profile to admin with token" ON public.profiles;

-- Ensure basic SELECT policies exist (safe if they already do).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (
        is_admin_user(auth.uid())
      );
  END IF;
END $$;

-- Allow users to insert their own profile (sign-up flow).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON public.profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- Allow admins to update any profile (including is_admin/role).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins can update profiles'
  ) THEN
    CREATE POLICY "Admins can update profiles"
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (is_admin_user(auth.uid()))
      WITH CHECK (true);
  END IF;
END $$;

