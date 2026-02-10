-- Enable and enforce RLS on core tables used by admin + students.
-- NOTE: This migration assumes these tables already exist.

-- COURSE CONTENT: students read, admins manage
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_content') THEN
    ALTER TABLE public.course_content ENABLE ROW LEVEL SECURITY;

    -- Anyone can read course content
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'course_content' AND policyname = 'Anyone can view course_content'
    ) THEN
      CREATE POLICY "Anyone can view course_content"
        ON public.course_content
        FOR SELECT
        USING (true);
    END IF;

    -- Admins can insert/update/delete course content
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'course_content' AND policyname = 'Admins manage course_content'
    ) THEN
      CREATE POLICY "Admins manage course_content"
        ON public.course_content
        FOR ALL
        TO authenticated
        USING (is_admin_user(auth.uid()))
        WITH CHECK (is_admin_user(auth.uid()));
    END IF;
  END IF;
END $$;


-- USER PROGRESS: user manages own; admins can view all
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_progress') THEN
    ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

    -- Users can manage their own progress
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'user_progress' AND policyname = 'Users manage own user_progress'
    ) THEN
      CREATE POLICY "Users manage own user_progress"
        ON public.user_progress
        FOR ALL
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    END IF;

    -- Admins can view all progress
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'user_progress' AND policyname = 'Admins view all user_progress'
    ) THEN
      CREATE POLICY "Admins view all user_progress"
        ON public.user_progress
        FOR SELECT
        TO authenticated
        USING (is_admin_user(auth.uid()));
    END IF;
  END IF;
END $$;


-- LIVE SESSIONS: students read; admins manage
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'live_sessions') THEN
    ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'live_sessions' AND policyname = 'Anyone can view live_sessions'
    ) THEN
      CREATE POLICY "Anyone can view live_sessions"
        ON public.live_sessions
        FOR SELECT
        USING (true);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'live_sessions' AND policyname = 'Admins manage live_sessions'
    ) THEN
      CREATE POLICY "Admins manage live_sessions"
        ON public.live_sessions
        FOR ALL
        TO authenticated
        USING (is_admin_user(auth.uid()))
        WITH CHECK (is_admin_user(auth.uid()));
    END IF;
  END IF;
END $$;


-- CLASS MATERIALS: students read; admins manage
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_materials') THEN
    ALTER TABLE public.class_materials ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'class_materials' AND policyname = 'Anyone can view class_materials'
    ) THEN
      CREATE POLICY "Anyone can view class_materials"
        ON public.class_materials
        FOR SELECT
        USING (true);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'class_materials' AND policyname = 'Admins manage class_materials'
    ) THEN
      CREATE POLICY "Admins manage class_materials"
        ON public.class_materials
        FOR ALL
        TO authenticated
        USING (is_admin_user(auth.uid()))
        WITH CHECK (is_admin_user(auth.uid()));
    END IF;
  END IF;
END $$;


-- ANNOUNCEMENTS: students read; admins manage
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements') THEN
    ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'announcements' AND policyname = 'Anyone can view announcements'
    ) THEN
      CREATE POLICY "Anyone can view announcements"
        ON public.announcements
        FOR SELECT
        USING (is_active = TRUE);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'announcements' AND policyname = 'Admins manage announcements'
    ) THEN
      CREATE POLICY "Admins manage announcements"
        ON public.announcements
        FOR ALL
        TO authenticated
        USING (is_admin_user(auth.uid()))
        WITH CHECK (is_admin_user(auth.uid()));
    END IF;
  END IF;
END $$;


-- REVIEWS: users manage own; admins moderate; everyone can read approved
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
    ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

    -- All users can see approved reviews
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'Anyone can view approved reviews'
    ) THEN
      CREATE POLICY "Anyone can view approved reviews"
        ON public.reviews
        FOR SELECT
        USING (status = 'approved');
    END IF;

    -- Users manage their own reviews (insert/update/delete)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'Users manage own reviews'
    ) THEN
      CREATE POLICY "Users manage own reviews"
        ON public.reviews
        FOR ALL
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    END IF;

    -- Admins can moderate any review
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'Admins moderate reviews'
    ) THEN
      CREATE POLICY "Admins moderate reviews"
        ON public.reviews
        FOR UPDATE
        TO authenticated
        USING (is_admin_user(auth.uid()))
        WITH CHECK (true);
    END IF;
  END IF;
END $$;


-- CERTIFICATES: users see their own; admins can view all
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates') THEN
    ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'certificates' AND policyname = 'Users view own certificates'
    ) THEN
      CREATE POLICY "Users view own certificates"
        ON public.certificates
        FOR SELECT
        TO authenticated
        USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'certificates' AND policyname = 'Admins view all certificates'
    ) THEN
      CREATE POLICY "Admins view all certificates"
        ON public.certificates
        FOR SELECT
        TO authenticated
        USING (is_admin_user(auth.uid()));
    END IF;
  END IF;
END $$;


-- COMPLETION STATUS: users see own; admins can view all
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'completion_status') THEN
    ALTER TABLE public.completion_status ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'completion_status' AND policyname = 'Users view own completion_status'
    ) THEN
      CREATE POLICY "Users view own completion_status"
        ON public.completion_status
        FOR SELECT
        TO authenticated
        USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'completion_status' AND policyname = 'Admins view all completion_status'
    ) THEN
      CREATE POLICY "Admins view all completion_status"
        ON public.completion_status
        FOR SELECT
        TO authenticated
        USING (is_admin_user(auth.uid()));
    END IF;
  END IF;
END $$;


-- EMAIL PREFERENCES: per-user
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_preferences') THEN
    ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'email_preferences' AND policyname = 'Users manage own email_preferences'
    ) THEN
      CREATE POLICY "Users manage own email_preferences"
        ON public.email_preferences
        FOR ALL
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    END IF;
  END IF;
END $$;


-- VIDEO PROGRESS + BOOKMARKS: per-user
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'video_progress') THEN
    ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'video_progress' AND policyname = 'Users manage own video_progress'
    ) THEN
      CREATE POLICY "Users manage own video_progress"
        ON public.video_progress
        FOR ALL
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'video_bookmarks') THEN
    ALTER TABLE public.video_bookmarks ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE scheanname = 'public' AND tablename = 'video_bookmarks' AND policyname = 'Users manage own video_bookmarks'
    ) THEN
      CREATE POLICY "Users manage own video_bookmarks"
        ON public.video_bookmarks
        FOR ALL
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    END IF;
  END IF;
END $$;


-- LEARNING SESSIONS: per-user
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learning_sessions') THEN
    ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'learning_sessions' AND policyname = 'Users manage own learning_sessions'
    ) THEN
      CREATE POLICY "Users manage own learning_sessions"
        ON public.learning_sessions
        FOR ALL
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    END IF;
  END IF;
END $$;

