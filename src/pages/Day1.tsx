import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import DayContent from '@/components/portal/DayContent';
import { useDayContent } from '@/hooks/useDayContent';

export default function Day1() {
  const location = useLocation();
  const continueVideoIdRef = useRef<string | null>(null);
  const timestampRef = useRef<number | null>(null);
  const { title, description, sections, loading } = useDayContent(1);

  useEffect(() => {
    if (location.state?.continueVideoId) {
      continueVideoIdRef.current = location.state.continueVideoId;
      timestampRef.current = location.state.timestamp || 0;
    }
  }, [location]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <DayContent
      dayNumber={1}
      title={title}
      description={description}
      sections={sections}
      continueVideoId={continueVideoIdRef.current}
      continueTimestamp={timestampRef.current}
    />
  );
}
