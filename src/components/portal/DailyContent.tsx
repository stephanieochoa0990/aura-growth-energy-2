import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import DayContent from './DayContent';

type BlockType = 'text' | 'video';

interface LessonBlock {
  id: string;
  type: BlockType;
  content?: string | null;
  url?: string | null;
}

interface LessonSection {
  id: string;
  title: string;
  number: number;
  blocks: LessonBlock[];
}

export default function DailyContent({ currentDay, userId: _userId }: { currentDay: number; userId: string }) {
  const { toast } = useToast();
  const [title, setTitle] = useState(`Day ${currentDay}`);
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<LessonSection[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizeContent = (body: any, fallbackTitle: string): LessonSection[] => {
    if (Array.isArray(body) && body.length > 0 && body[0]?.blocks) {
      return body.map((section: any, idx: number) => ({
        id: section.id || `section-${idx}`,
        title: section.title || fallbackTitle || `Section ${idx + 1}`,
        number: section.number ?? idx + 1,
        blocks: Array.isArray(section.blocks)
          ? section.blocks.map((b: any, bIdx: number) => ({
              id: b.id || `block-${idx}-${bIdx}`,
              type: b.type === 'video' ? 'video' : 'text',
              content: b.content ?? '',
              url: b.url ?? null,
            }))
          : [],
      }));
    }

    if (Array.isArray(body) && body.length > 0) {
      return [
        {
          id: 'section-1',
          title: fallbackTitle || 'Lesson',
          number: 1,
          blocks: body.map((b: any, bIdx: number) => ({
            id: b.id || `block-${bIdx}`,
            type: b.type === 'video' ? 'video' : 'text',
            content: b.content ?? b.text ?? '',
            url: b.url ?? null,
          })),
        },
      ];
    }

    return [];
  };

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('course_content')
          .select('id, day_number, title, description, content, video_url')
          .eq('day_number', currentDay)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        const row = data as any;

        if (!row) {
          setTitle(`Day ${currentDay}`);
          setDescription('No content available yet');
          setSections([]);
          setLoading(false);
          return;
        }

        setTitle(row.title || `Day ${currentDay}`);
        setDescription(row.description || '');
        const normalized = normalizeContent(row.content, row.title || `Day ${currentDay}`);
        setSections(normalized);
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
    />
  );
}
