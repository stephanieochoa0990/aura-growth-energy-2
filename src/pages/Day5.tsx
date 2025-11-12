import React from 'react';
import DayContent from '@/components/portal/DayContent';
import { useDayContent } from '@/hooks/useDayContent';

export default function Day5() {
  const { title, description, sections, loading } = useDayContent(5);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <DayContent
      dayNumber={5}
      title={title}
      description={description}
      sections={sections}
    />
  );
}
