-- Private media delivery for paid course content.
-- Existing course_id remains aura-empowerment.

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('course-media', 'course-media', false, 1073741824),
  ('certificate-pdfs', 'certificate-pdfs', false, 52428800)
ON CONFLICT (id) DO UPDATE
SET public = false;

DROP POLICY IF EXISTS "Enrolled users read course media" ON storage.objects;
CREATE POLICY "Enrolled users read course media"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'course-media'
    AND (storage.foldername(name))[1] = 'aura-empowerment'
    AND public.has_course_access(auth.uid(), 'aura-empowerment')
  );

DROP POLICY IF EXISTS "Admins manage course media" ON storage.objects;
CREATE POLICY "Admins manage course media"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'course-media'
    AND public.is_admin_user(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'course-media'
    AND public.is_admin_user(auth.uid())
  );

DROP POLICY IF EXISTS "Users read own certificate PDFs" ON storage.objects;
CREATE POLICY "Users read own certificate PDFs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'certificate-pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.has_course_access(auth.uid(), 'aura-empowerment')
  );

DROP POLICY IF EXISTS "Admins manage certificate PDFs" ON storage.objects;
CREATE POLICY "Admins manage certificate PDFs"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'certificate-pdfs'
    AND public.is_admin_user(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'certificate-pdfs'
    AND public.is_admin_user(auth.uid())
  );

COMMENT ON POLICY "Enrolled users read course media" ON storage.objects
  IS 'Allows signed URL creation for private course-media objects under aura-empowerment/ only for enrolled users and admins.';

