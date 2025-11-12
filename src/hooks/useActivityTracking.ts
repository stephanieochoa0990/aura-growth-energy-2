import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface ActivityDetails {
  [key: string]: any;
}

export function useActivityTracking() {
  const { toast } = useToast();
  const startTimeRef = useRef<number>(Date.now());
  const lastActivityRef = useRef<string>('');
  const [isTracking, setIsTracking] = useState(false);

  const logActivity = async (
    activityType: string,
    dayNumber?: number,
    details?: ActivityDetails,
    durationSeconds?: number
  ) => {
    try {
      // Get session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found, skipping activity log');
        return;
      }

      // Get IP and user agent
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => null);

      const userAgent = navigator.userAgent;

      const { data, error } = await supabase.functions.invoke('log-activity', {
        body: {
          activityType,
          dayNumber,
          details,
          durationSeconds,
          ipAddress,
          userAgent
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      
      // Reset start time for next activity
      startTimeRef.current = Date.now();
      lastActivityRef.current = activityType;
      
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };


  const startTracking = (activityType: string, dayNumber?: number) => {
    startTimeRef.current = Date.now();
    lastActivityRef.current = activityType;
    setIsTracking(true);
    
    // Log the start of the activity
    logActivity(activityType, dayNumber, { action: 'start' });
  };

  const stopTracking = (details?: ActivityDetails) => {
    if (!isTracking) return;
    
    const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const activityType = lastActivityRef.current;
    
    if (activityType) {
      logActivity(
        activityType,
        undefined,
        { ...details, action: 'end' },
        durationSeconds
      );
    }
    
    setIsTracking(false);
  };

  // Track page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isTracking) {
        stopTracking({ reason: 'page_hidden' });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTracking]);

  // Track when component unmounts
  useEffect(() => {
    return () => {
      if (isTracking) {
        stopTracking({ reason: 'component_unmount' });
      }
    };
  }, [isTracking]);

  return {
    logActivity,
    startTracking,
    stopTracking,
    isTracking
  };
}