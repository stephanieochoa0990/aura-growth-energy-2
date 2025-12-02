import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import VideoBlock from "@/components/lesson/VideoBlock";

type BlockType = "text" | "video";

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

const DAY_NUMBER = 2;

const normalizeContent = (body: any, fallbackTitle: string): LessonSection[] => {
  if (!body) return [];
  const sectionsArray = Array.isArray(body) ? body : [body];

  return sectionsArray.map((section: any, idx: number) => ({
    id: section?.id || `section-${idx}`,
    title: section?.title || fallbackTitle || `Section ${idx + 1}`,
    number: typeof section?.number === "number" ? section.number : idx + 1,
    blocks: Array.isArray(section?.blocks)
      ? section.blocks.map((b: any, bIdx: number) => ({
          id: b?.id || `block-${idx}-${bIdx}`,
          type: b?.type === "video" ? "video" : "text",
          content: typeof b?.content === "string" ? b.content : "",
          url: b?.url ?? null,
        }))
      : [],
  }));
};

export default function Day2() {
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Day 2: ");
  const [description, setDescription] = useState<string>("");
  const [sections, setSections] = useState<LessonSection[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("course_content")
          .select("*")
          .eq("day_number", DAY_NUMBER)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        const row = data as CourseContentRow | null;
        console.log("DAY 2 PREVIEW RAW ROW:", row);

        if (!row) {
          setSections([]);
          setLoading(false);
          return;
        }

        setTitle(row.title || title);
        setDescription(row.description || "");
        const normalized = normalizeContent(row.content, row.title || title);
        setSections(normalized);
      } catch (err) {
        console.error("Error loading day 2:", err);
        setSections([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f5f1]">
        <div className="flex items-center gap-2 text-charcoal/80">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading lesson…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f5f1] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-charcoal/60">
            Day {DAY_NUMBER}
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
                    {block.type === "text" && (
                      <p className="text-sm md:text-base leading-relaxed whitespace-pre-line">
                        {block.content}
                      </p>
                    )}

                    {block.type === "video" && block.url && (
                      <VideoBlock url={block.url} title={`${section.title} video`} />
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
