-- RLS for notifications and messaging-related tables.

DO $$
BEGIN
  -- Notifications: per-user
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users manage own notifications'
    ) THEN
      CREATE POLICY "Users manage own notifications"
        ON public.notifications
        FOR ALL
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    END IF;
  END IF;

  -- Practice sessions: either initiator or partner
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_sessions') THEN
    ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'practice_sessions' AND policyname = 'Users view own practice_sessions'
    ) THEN
      CREATE POLICY "Users view own practice_sessions"
        ON public.practice_sessions
        FOR SELECT
        TO authenticated
        USING (initiator_id = auth.uid() OR partner_id = auth.uid());
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'practice_sessions' AND policyname = 'Users manage own practice_sessions'
    ) THEN
      CREATE POLICY "Users manage own practice_sessions"
        ON public.practice_sessions
        FOR INSERT, UPDATE, DELETE
        TO authenticated
        USING (initiator_id = auth.uid() OR partner_id = auth.uid())
        WITH CHECK (initiator_id = auth.uid() OR partner_id = auth.uid());
    END IF;
  END IF;

  -- User presence: per-user
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_presence') THEN
    ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'user_presence' AND policyname = 'Users manage own presence'
    ) THEN
      CREATE POLICY "Users manage own presence"
        ON public.user_presence
        FOR ALL
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    END IF;
  END IF;

  -- Conversations & participants: basic protection
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_participants') THEN
    ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'conversation_participants' AND policyname = 'Users manage own conversation_participants'
    ) THEN
      CREATE POLICY "Users manage own conversation_participants"
        ON public.conversation_participants
        FOR ALL
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
    ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'Users view own conversations'
    ) THEN
      CREATE POLICY "Users view own conversations"
        ON public.conversations
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = id AND cp.user_id = auth.uid()
          )
        );
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'Users view messages in own conversations'
    ) THEN
      CREATE POLICY "Users view messages in own conversations"
        ON public.messages
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
          )
        );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'Users send their own messages'
    ) THEN
      CREATE POLICY "Users send their own messages"
        ON public.messages
        FOR INSERT
        TO authenticated
        WITH CHECK (sender_id = auth.uid());
    END IF;
  END IF;
END $$;

