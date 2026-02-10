-- Unlimited sections per day: day_sections table
-- Create only if not exists (safe to run multiple times).

CREATE TABLE IF NOT EXISTS public.day_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number INT NOT NULL CHECK (day_number >= 1 AND day_number <= 7),
  order_index INT NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  section_type TEXT NOT NULL DEFAULT 'content',
  content TEXT,
  video_url TEXT,
  audio_url TEXT,
  pdf_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_day_sections_day_order
  ON public.day_sections (day_number, order_index);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS day_sections_updated_at ON public.day_sections;
CREATE TRIGGER day_sections_updated_at
  BEFORE UPDATE ON public.day_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.day_sections ENABLE ROW LEVEL SECURITY;

-- Students: SELECT only published sections (uses existing is_admin_user from ensure_profiles_admin_columns)
CREATE POLICY "Students read published day_sections"
  ON public.day_sections
  FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Admins: full access (same role check as rest of app: is_admin_user(auth.uid()))
CREATE POLICY "Admins full access day_sections"
  ON public.day_sections
  FOR ALL
  TO authenticated
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- Ordering: new section without order_index gets max(order_index) for that day + 1.
-- On delete, order_index is left as-is (gaps allowed); no re-normalization.
COMMENT ON TABLE public.day_sections IS 'Ordered sections per day (1-7). Students see only is_published=true; admins manage all.';
