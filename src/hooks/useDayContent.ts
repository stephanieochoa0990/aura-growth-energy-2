import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ContentSection {
  id: string;
  title: string;
  content: string;
  duration?: string;
  mediaUrl?: string;
  mediaType?: 'youtube' | 'audio' | 'video';
  mediaCaption?: string;
  journalPrompt?: string;
  dayNumber?: number;
  sectionNumber?: number;
}

interface DayContentData {
  title: string;
  description: string;
  sections: ContentSection[];
  loading: boolean;
  error: string | null;
}

export function useDayContent(dayNumber: number): DayContentData {
  const [data, setData] = useState<DayContentData>({
    title: `Day ${dayNumber}`,
    description: 'Loading...',
    sections: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    fetchDayContent();
  }, [dayNumber]);

  const fetchDayContent = async () => {
    try {
      const { data: content, error } = await supabase
        .from('course_content')
        .select('*')
        .eq('day_number', dayNumber)
        .eq('is_published', true)
        .order('order_index');

      if (error) throw error;

      if (content && content.length > 0) {
        const sections: ContentSection[] = content.map((item: any, index: number) => ({
          id: item.id || `section-${index + 1}`,
          title: item.title || `Section ${index + 1}`,
          content: item.content_body?.text || item.description || '',
          duration: item.video_duration ? `${item.video_duration} minutes` : undefined,
          mediaUrl: item.video_url || undefined,
          mediaType: item.video_url?.includes('youtube') ? 'youtube' : 'video',
          mediaCaption: item.title,
          journalPrompt: item.content_body?.journalPrompt || undefined,
          dayNumber: dayNumber,
          sectionNumber: index + 1
        }));

        setData({
          title: content[0]?.title || `Day ${dayNumber}`,
          description: content[0]?.description || '',
          sections,
          loading: false,
          error: null
        });
      } else {
        setData({
          title: `Day ${dayNumber}`,
          description: 'No content available yet',
          sections: [],
          loading: false,
          error: null
        });
      }
    } catch (error: any) {
      console.error('Error fetching day content:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  return data;
}
