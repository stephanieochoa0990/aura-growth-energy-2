import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import DayContent from './DayContent';
import { useDayContent } from '@/hooks/useDayContent';

interface DailyContentProps {
  currentDay: number;
  userId: string;
}

export default function DailyContent({ currentDay, userId }: DailyContentProps) {
  const { title, description, sections, loading } = useDayContent(currentDay);
  const { toast } = useToast();
  const { sendEmail } = useEmailNotifications();

  // Handle day completion
  const handleDayComplete = async (sectionId: string) => {
    toast({
      title: "Section Complete",
      description: `You've completed a section!`,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Use the unified DayContent component for all days
  return (
    <DayContent
      dayNumber={currentDay}
      title={title}
      description={description}
      sections={sections}
    />
  );
}

