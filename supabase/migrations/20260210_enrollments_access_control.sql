-- Enrollment and course access foundation.
-- Keep the existing course identifier for compatibility.

CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL DEFAULT 'aura-empowerment',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'trialing', 'granted', 'past_due', 'cancelled', 'expired', 'refunded')),
  access_expires_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'manual',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_course
  ON public.enrollments (user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_course_status
  ON public.enrollments (course_id, status);

CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
      AND (
        is_admin = true
        OR role IN ('admin', 'super_admin', 'content_manager', 'moderator', 'support_staff')
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enrollments_updated_at ON public.enrollments;
CREATE TRIGGER enrollments_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.has_course_access(
  target_user_id UUID,
  target_course_id TEXT DEFAULT 'aura-empowerment'
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_admin_user(target_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.enrollments e
      WHERE e.user_id = target_user_id
        AND e.course_id = target_course_id
        AND e.status IN ('active', 'trialing', 'granted')
        AND (e.access_expires_at IS NULL OR e.access_expires_at > now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

GRANT EXECUTE ON FUNCTION public.has_course_access(UUID, TEXT) TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own enrollments" ON public.enrollments;
CREATE POLICY "Users view own enrollments"
  ON public.enrollments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage enrollments" ON public.enrollments;
CREATE POLICY "Admins manage enrollments"
  ON public.enrollments
  FOR ALL
  TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

-- Tighten previously public course reads around the current course id.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'course_content') THEN
    ALTER TABLE public.course_content ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Anyone can view course_content" ON public.course_content;
    DROP POLICY IF EXISTS "Enrolled users view course_content" ON public.course_content;

    CREATE POLICY "Enrolled users view course_content"
      ON public.course_content
      FOR SELECT
      TO authenticated
      USING (public.has_course_access(auth.uid(), 'aura-empowerment'));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'class_materials') THEN
    ALTER TABLE public.class_materials ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Anyone can view class_materials" ON public.class_materials;
    DROP POLICY IF EXISTS "Enrolled users view class_materials" ON public.class_materials;

    CREATE POLICY "Enrolled users view class_materials"
      ON public.class_materials
      FOR SELECT
      TO authenticated
      USING (public.has_course_access(auth.uid(), 'aura-empowerment'));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'live_sessions') THEN
    ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Anyone can view live_sessions" ON public.live_sessions;
    DROP POLICY IF EXISTS "Enrolled users view live_sessions" ON public.live_sessions;

    CREATE POLICY "Enrolled users view live_sessions"
      ON public.live_sessions
      FOR SELECT
      TO authenticated
      USING (public.has_course_access(auth.uid(), 'aura-empowerment'));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'day_sections') THEN
    DROP POLICY IF EXISTS "Students read published day_sections" ON public.day_sections;
    DROP POLICY IF EXISTS "Enrolled users read published day_sections" ON public.day_sections;

    CREATE POLICY "Enrolled users read published day_sections"
      ON public.day_sections
      FOR SELECT
      TO authenticated
      USING (
        is_published = true
        AND public.has_course_access(auth.uid(), 'aura-empowerment')
      );
  END IF;
END $$;

-- Progress, bookmarks, certificates, and completion status are not content bodies,
-- but they expose paid-course state and should only be available while course access is active.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_progress') THEN
    ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users manage own user_progress" ON public.user_progress;
    DROP POLICY IF EXISTS "Admins view all user_progress" ON public.user_progress;
    DROP POLICY IF EXISTS "Users manage own user_progress with course access" ON public.user_progress;
    DROP POLICY IF EXISTS "Admins manage user_progress" ON public.user_progress;

    CREATE POLICY "Users manage own user_progress with course access"
      ON public.user_progress
      FOR ALL
      TO authenticated
      USING (
        user_id = auth.uid()
        AND public.has_course_access(auth.uid(), 'aura-empowerment')
      )
      WITH CHECK (
        user_id = auth.uid()
        AND public.has_course_access(auth.uid(), 'aura-empowerment')
      );

    CREATE POLICY "Admins manage user_progress"
      ON public.user_progress
      FOR ALL
      TO authenticated
      USING (public.is_admin_user(auth.uid()))
      WITH CHECK (public.is_admin_user(auth.uid()));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'video_progress') THEN
    ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users manage own video_progress" ON public.video_progress;
    DROP POLICY IF EXISTS "Users manage own video_progress with course access" ON public.video_progress;
    DROP POLICY IF EXISTS "Admins view all video_progress" ON public.video_progress;

    CREATE POLICY "Users manage own video_progress with course access"
      ON public.video_progress
      FOR ALL
      TO authenticated
      USING (
        user_id = auth.uid()
        AND public.has_course_access(auth.uid(), 'aura-empowerment')
      )
      WITH CHECK (
        user_id = auth.uid()
        AND public.has_course_access(auth.uid(), 'aura-empowerment')
      );

    CREATE POLICY "Admins view all video_progress"
      ON public.video_progress
      FOR SELECT
      TO authenticated
      USING (public.is_admin_user(auth.uid()));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'video_bookmarks') THEN
    ALTER TABLE public.video_bookmarks ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users manage own video_bookmarks" ON public.video_bookmarks;
    DROP POLICY IF EXISTS "Users manage own video_bookmarks with course access" ON public.video_bookmarks;
    DROP POLICY IF EXISTS "Admins view all video_bookmarks" ON public.video_bookmarks;

    CREATE POLICY "Users manage own video_bookmarks with course access"
      ON public.video_bookmarks
      FOR ALL
      TO authenticated
      USING (
        user_id = auth.uid()
        AND public.has_course_access(auth.uid(), 'aura-empowerment')
      )
      WITH CHECK (
        user_id = auth.uid()
        AND public.has_course_access(auth.uid(), 'aura-empowerment')
      );

    CREATE POLICY "Admins view all video_bookmarks"
      ON public.video_bookmarks
      FOR SELECT
      TO authenticated
      USING (public.is_admin_user(auth.uid()));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'completion_status') THEN
    ALTER TABLE public.completion_status ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users view own completion_status" ON public.completion_status;
    DROP POLICY IF EXISTS "Admins view all completion_status" ON public.completion_status;
    DROP POLICY IF EXISTS "Users view own completion_status with course access" ON public.completion_status;

    CREATE POLICY "Users view own completion_status with course access"
      ON public.completion_status
      FOR SELECT
      TO authenticated
      USING (
        user_id = auth.uid()
        AND public.has_course_access(auth.uid(), 'aura-empowerment')
      );

    CREATE POLICY "Admins view all completion_status"
      ON public.completion_status
      FOR SELECT
      TO authenticated
      USING (public.is_admin_user(auth.uid()));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'certificates') THEN
    ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users view own certificates" ON public.certificates;
    DROP POLICY IF EXISTS "Admins view all certificates" ON public.certificates;
    DROP POLICY IF EXISTS "Users view own certificates with course access" ON public.certificates;

    CREATE POLICY "Users view own certificates with course access"
      ON public.certificates
      FOR SELECT
      TO authenticated
      USING (
        user_id = auth.uid()
        AND public.has_course_access(auth.uid(), 'aura-empowerment')
      );

    CREATE POLICY "Admins view all certificates"
      ON public.certificates
      FOR SELECT
      TO authenticated
      USING (public.is_admin_user(auth.uid()));
  END IF;
END $$;

COMMENT ON TABLE public.enrollments IS 'Per-user course access records. Current course_id remains aura-empowerment for compatibility.';
