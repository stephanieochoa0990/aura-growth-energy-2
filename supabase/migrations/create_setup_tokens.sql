-- Create setup_tokens table for secure admin initialization
CREATE TABLE IF NOT EXISTS public.setup_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.setup_tokens ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read unused tokens (they still need the token value)
CREATE POLICY "Anyone can read unused tokens"
  ON public.setup_tokens
  FOR SELECT
  USING (used = FALSE);

-- Only allow system to insert/update
CREATE POLICY "Only service role can modify tokens"
  ON public.setup_tokens
  FOR ALL
  USING (FALSE);

-- Create index
CREATE INDEX idx_setup_tokens_token ON public.setup_tokens(token) WHERE used = FALSE;

-- Insert a one-time setup token (change this token value for security!)
INSERT INTO public.setup_tokens (token) 
VALUES ('CHANGE_THIS_SETUP_TOKEN_12345')
ON CONFLICT (token) DO NOTHING;

COMMENT ON TABLE public.setup_tokens IS 'One-time setup tokens for admin initialization';
