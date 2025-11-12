import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface UseSessionTrackingProps {
  userId: string;
  dayNumber: number;
  sectionType: string;
  enabled?: boolean;
}

export function useSessionTracking({ 
  userId, 
  dayNumber, 
  sectionType, 
  enabled = true 
}: UseSessionTrackingProps) {
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!enabled) return;

    // Start session
    startSession();

    // End session on unmount
    return () => {
      endSession();
    };
  }, [userId, dayNumber, sectionType, enabled]);

  async function startSession() {
    try {
      const { data, error } = await supabase
        .from('learning_sessions')
        .insert({
          user_id: userId,
          day_number: dayNumber,
          section_type: sectionType,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (data) {
        sessionIdRef.current = data.id;
        startTimeRef.current = Date.now();
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  }

  async function endSession() {
    if (!sessionIdRef.current) return;

    try {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      await supabase
        .from('learning_sessions')
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: duration
        })
        .eq('id', sessionIdRef.current);

      sessionIdRef.current = null;
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }

  return { sessionId: sessionIdRef.current };
}
