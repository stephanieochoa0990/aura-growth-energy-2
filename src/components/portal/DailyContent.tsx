import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import DayContent from './DayContent';
import DaySectionsView from './DaySectionsView';
import { normalizeContent } from '@/lib/normalizeContent';

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
  const { isAdmin } = usePermissions();
  const [mode, setMode] = useState<'loading' | 'sections' | 'legacy'>('loading');
  const [title, setTitle] = useState(`Day ${currentDay}`);
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<LessonSection[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadContent = async () => {
      try {
        setMode('loading');

        const { data: sectionRows, error: sectionError } = await supabase
          .from('day_sections')
          .select('id')
          .eq('day_number', currentDay)
          .order('order_index', { ascending: true });

        // If table exists: use sections view when there are sections OR when admin (so they can add sections)
        if (!sectionError && (sectionRows?.length > 0 || isAdmin)) {
          if (!cancelled) setMode('sections');
          return;
        }

        const { data, error } = await supabase
          .from('course_content')
          .select('*')
          .eq('day_number', currentDay)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        const row = data as any;
        if (!cancelled) {
          if (!row) {
            setTitle(`Day ${currentDay}`);
            setDescription('No content available yet');
            setSections([]);
          } else {
            setTitle(row.title || `Day ${currentDay}`);
            setDescription(row.description || '');
            const normalized = normalizeContent(row.content, row.title || `Day ${currentDay}`);
            setSections(normalized.sections);
          }
          setMode('legacy');
        }
      } catch (error: any) {
        console.error('Error loading content:', error);
        if (!cancelled) {
          toast({
            title: 'Error',
            description: error.message || 'Could not load content.',
            variant: 'destructive'
          });
          setMode('legacy');
        }
      }
    };

    loadContent();
    return () => {
      cancelled = true;
    };
  }, [currentDay, isAdmin, toast]);

  if (mode === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (mode === 'sections') {
    return <DaySectionsView dayNumber={currentDay} />;
  }

  return (
    <DayContent
      dayNumber={currentDay}
      title={title}
      description={description}
      sections={sections}
    />
  );
}
