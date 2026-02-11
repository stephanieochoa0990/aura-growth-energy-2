import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { VideoPlayer } from '@/components/portal/VideoPlayer';
import { normalizeContent } from '@/lib/normalizeContent';
import DaySectionsView from '@/components/portal/DaySectionsView';
import { usePermissions } from '@/hooks/usePermissions';

type BlockType = 'text' | 'video';

interface LessonBlock {
  id: string;
  type: BlockType;
  content: string;
  url: string | null;
}

interface LessonSection {
  id: string;
  title: string;
  number: number;
  blocks: LessonBlock[];
}

interface CourseContentRow {
  id: string;
  day_number: number;
  title: string;
  description: string | null;
  content: any | null;
  video_url: string | null;
}

/**
 * Renders a single day for students. Uses day_sections if any exist for this day;
 * otherwise falls back to course_content (existing lesson model). Safe for existing content.
 */
export default function DayPage({ dayNumber }: { dayNumber: number }) {
  const { isAdmin } = usePermissions();
  const [mode, setMode] = useState<'loading' | 'sections' | 'legacy'>('loading');
  const [title, setTitle] = useState(`Day ${dayNumber}`);
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<LessonSection[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data: sectionRows, error: sectionError } = await supabase
          .from('day_sections')
          .select('id')
          .eq('day_number', dayNumber)
          .order('order_index', { ascending: true });

        // If table exists: use sections view when there are sections OR when admin (so they can add sections)
        if (!sectionError && (sectionRows?.length > 0 || isAdmin)) {
          if (!cancelled) setMode('sections');
          return;
        }

        const { data: row, error } = await supabase
          .from('course_content')
          .select('*')
          .eq('day_number', dayNumber)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (cancelled) return;

        const r = row as CourseContentRow | null;
        if (r) {
          setTitle(r.title || `Day ${dayNumber}`);
          setDescription(r.description || '');
          const normalized = normalizeContent(r.content, r.title || `Day ${dayNumber}`);
          setSections(normalized.sections);
        }
        setMode('legacy');
      } catch (err) {
        console.error('Error loading day:', err);
        if (!cancelled) setMode('legacy');
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [dayNumber, isAdmin]);

  if (mode === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f5f1]">
        <div className="flex items-center gap-2 text-charcoal/80">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading lesson…</span>
        </div>
      </div>
    );
  }

  if (mode === 'sections') {
    return (
      <div className="min-h-screen bg-[#f8f5f1] p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-charcoal/60">
              Day {dayNumber}
            </p>
            <h1 className="text-3xl md:text-4xl font-display gold-gradient-text">
              Day {dayNumber}
            </h1>
          </header>
          <DaySectionsView dayNumber={dayNumber} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f5f1] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-charcoal/60">
            Day {dayNumber}
          </p>
          <h1 className="text-3xl md:text-4xl font-display gold-gradient-text">
            {title}
          </h1>
          {description && (
            <p className="text-sm md:text-base text-charcoal/80 mt-2">
              {description}
            </p>
          )}
        </header>

        {sections.length === 0 && (
          <p className="text-sm text-charcoal/70">
            No content available for this day yet.
          </p>
        )}

        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.id} className="space-y-3">
              <h3 className="text-xl font-semibold">{section.title}</h3>
              <div className="space-y-4">
                {section.blocks.map((block) => (
                  <div key={block.id} className="bg-white/90 rounded-lg p-4 shadow-sm">
                    {block.type === 'text' && (
                      <p className="text-sm md:text-base leading-relaxed whitespace-pre-line">
                        {block.content}
                      </p>
                    )}
                    {block.type === 'video' && block.url && (
                      <VideoPlayer
                        videoId={block.id}
                        videoUrl={block.url}
                        title={`${section.title} video`}
                        dayNumber={dayNumber}
                        sectionNumber={section.number}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
