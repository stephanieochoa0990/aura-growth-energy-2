import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import DayContent from './DayContent';

interface DailyContentProps {
  currentDay: number;
  userId: string;
}

export default function DailyContent({ currentDay, userId: _userId }: DailyContentProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(`Day ${currentDay}`);
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('course_content')
          .select('id, day_number, title, description, content_body, video_url')
          .eq('day_number', currentDay)
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        const row = data as any;

        if (!row) {
          setTitle(`Day ${currentDay}`);
          setDescription('No content available yet');
          setSections([]);
          setVideoUrl(undefined);
          setLoading(false);
          return;
        }

        setTitle(row.title || `Day ${currentDay}`);
        setDescription(row.description || '');
        setVideoUrl(row.video_url || undefined);

        if (Array.isArray(row.content_body)) {
          const mappedSections = row.content_body.map((block: any, index: number) => ({
            id: block.id || `${row.id}-section-${index + 1}`,
            title: block.title || row.title || `Section ${index + 1}`,
            content: block.content ?? block.text ?? '',
            mediaUrl: block.url || row.video_url || undefined,
            mediaType: block.url || row.video_url ? 'video' : undefined,
            journalPrompt: block.journalPrompt || undefined,
            dayNumber: row.day_number,
            sectionNumber: index + 1
          }));
          setSections(mappedSections);
        } else {
          setSections([]);
        }
      } catch (error: any) {
        console.error('Error loading content:', error);
        toast({
          title: 'Error',
          description: error.message || 'Could not load content.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [currentDay, toast]);

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
      videoUrl={videoUrl}
    />
  );
}
