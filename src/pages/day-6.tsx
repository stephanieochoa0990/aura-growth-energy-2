import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

type BlockType = "text" | "video";

interface LessonBlock {
  type: BlockType;
  content?: string | null;
  url?: string | null;
}

interface CourseContentRow {
  id: string;
  day_number: number;
  title: string;
  description: string | null;
  content_body: any | null;
  video_url: string | null;
}

const DAY_NUMBER = 6;

export default function Day6() {
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Day 6: ");
  const [description, setDescription] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<LessonBlock[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("course_content")
          .select("id, day_number, title, description, content_body, video_url")
          .eq("day_number", DAY_NUMBER)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        const row = data as CourseContentRow | null;

        if (!row) {
          setBlocks([]);
          setVideoUrl(null);
          setLoading(false);
          return;
        }

        setTitle(row.title || title);
        setDescription(row.description || "");
        setVideoUrl(row.video_url || null);

        if (Array.isArray(row.content_body)) {
          setBlocks(
            row.content_body.map((b: any) => ({
              type: b.type === "video" ? "video" : "text",
              content: b.content ?? "",
              url: b.url ?? null,
            }))
          );
        } else {
          setBlocks([]);
        }
      } catch (err) {
        console.error("Error loading day 6:", err);
        setBlocks([]);
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

        {blocks.length === 0 && (
          <p className="text-sm text-charcoal/70">
            No content available for this day yet.
          </p>
        )}

        {videoUrl && (
          <div className="bg-white/90 rounded-lg p-4 shadow-sm">
            <video
              src={videoUrl}
              controls
              className="w-full rounded-md border border-gold/30"
            />
          </div>
        )}

        <div className="space-y-6">
          {blocks.map((block, index) => (
            <div key={index} className="bg-white/90 rounded-lg p-4 shadow-sm">
              {block.type === "text" && (
                <p className="text-sm md:text-base leading-relaxed whitespace-pre-line">
                  {block.content}
                </p>
              )}

              {block.type === "video" && block.url && (
                <video
                  src={block.url}
                  controls
                  className="w-full rounded-md border border-gold/30"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
