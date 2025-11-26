import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Block = {
  id: string;
  block_type: "text" | "video";
  content: string | null;
  video_url: string | null;
  position: number;
};

export default function Day3() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("lesson_blocks")
        .select("*")
        .eq("day_number", 3)
        .order("position", { ascending: true });

      if (!error) {
        setBlocks(data || []);
      }

      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return <p className="p-6">Loading…</p>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        DAY 3: EMBODIMENT & INTEGRATION
      </h1>

      {blocks.length === 0 && (
        <p className="text-gray-600">
          No content available for this day yet.
        </p>
      )}

      <div className="space-y-6">
        {blocks.map((block) => (
          <div key={block.id}>
            {block.block_type === "text" && (
              <p className="whitespace-pre-wrap text-lg leading-relaxed">
                {block.content}
              </p>
            )}

            {block.block_type === "video" && block.video_url && (
              <video
                src={block.video_url}
                controls
                className="w-full rounded-lg shadow"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}