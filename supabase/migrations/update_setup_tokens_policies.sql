-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read unused tokens" ON public.setup_tokens;
DROP POLICY IF EXISTS "Only service role can modify tokens" ON public.setup_tokens;
DROP POLICY IF EXISTS "Authenticated users can update tokens" ON public.setup_tokens;

-- Allow authenticated users to read unused tokens
CREATE POLICY "Authenticated users can read unused tokens"
  ON public.setup_tokens
  FOR SELECT
  TO authenticated
  USING (used = FALSE);

-- Allow authenticated users to mark tokens as used (one-time only)
CREATE POLICY "Authenticated users can mark tokens as used"
  ON public.setup_tokens
  FOR UPDATE
  TO authenticated
  USING (used = FALSE)
  WITH CHECK (used = TRUE);

-- Allow authenticated users to update their own profile to admin if they have valid token
-- This is handled by the application logic, but we need to allow profile updates
DROP POLICY IF EXISTS "Users can update own profile to admin with token" ON public.profiles;

CREATE POLICY "Users can update own profile to admin with token"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
