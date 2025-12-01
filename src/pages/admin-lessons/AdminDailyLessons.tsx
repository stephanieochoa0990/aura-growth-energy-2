import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Save, Trash2, Video } from "lucide-react";

type BlockType = "text" | "video";

interface LessonBlock {
  id: string;
  type: BlockType;
  content?: string | null;
  url?: string | null;
}

interface CourseContentRow {
  id: string;
  day_number: number;
  title: string;
  description: string | null;
  content_body: any[] | null;
  video_url: string | null;
}

const dayOptions = [
  { value: 1, label: "Day 1" },
  { value: 2, label: "Day 2" },
  { value: 3, label: "Day 3" },
  { value: 4, label: "Day 4" },
  { value: 5, label: "Day 5" },
  { value: 6, label: "Day 6" },
  { value: 7, label: "Day 7" },
];

const AdminDailyLessons: React.FC = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [rowId, setRowId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [blocks, setBlocks] = useState<LessonBlock[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    const param = Number(searchParams.get("day") || 1);
    const validDay = Number.isNaN(param) || param < 1 || param > 7 ? 1 : param;
    setDayNumber(validDay);
  }, [searchParams]);

  useEffect(() => {
    setSearchParams({ day: String(dayNumber) });
    loadLesson(dayNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayNumber]);

  const loadLesson = async (day: number) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("course_content")
        .select("id, day_number, title, description, content_body, video_url")
        .eq("day_number", day)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      const row = data as CourseContentRow | null;

      if (!row) {
        setRowId(null);
        setTitle(`Day ${day}`);
        setDescription("");
        setBlocks([]);
        return;
      }

      setRowId(row.id);
      setTitle(row.title || `Day ${day}`);
      setDescription(row.description || "");

      if (Array.isArray(row.content_body)) {
        const mappedBlocks = row.content_body.map((b: any, index: number) => ({
          id: `block-${index}-${Date.now()}`,
          type: b.type === "video" ? "video" : "text",
          content: b.content ?? b.text ?? "",
          url: b.url ?? null,
        }));
        setBlocks(mappedBlocks);
      } else {
        setBlocks([]);
      }
    } catch (err: any) {
      console.error("Error loading lesson:", err);
      toast({
        title: "Error",
        description: err.message || "Could not load lesson content.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTextBlock = () => {
    const newBlock: LessonBlock = {
      id: `temp-${Date.now()}`,
      type: "text",
      content: "",
      url: null,
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  const addVideoBlock = () => {
    const newBlock: LessonBlock = {
      id: `temp-${Date.now()}`,
      type: "video",
      content: "",
      url: "",
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  const updateBlockContent = (id: string, content: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content } : b))
    );
  };

  const updateBlockUrl = (id: string, url: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, url } : b))
    );
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Missing title",
        description: "Please add a lesson title before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const payloadBlocks = blocks.map((b) => ({
        type: b.type,
        content: b.content ?? "",
        url: b.url ?? null,
      }));

      const videoUrl =
        payloadBlocks.find((b) => b.type === "video" && b.url)?.url || null;

      const payload = {
        title,
        description,
        content_body: payloadBlocks,
        video_url: videoUrl,
      };

      if (rowId) {
        const { error } = await supabase
          .from("course_content")
          .update(payload)
          .eq("id", rowId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("course_content")
          .insert({ day_number: dayNumber, ...payload })
          .select("id")
          .single();

        if (error) throw error;
        setRowId((data as any)?.id ?? null);
      }

      toast({
        title: "Saved",
        description: "Lesson content has been updated.",
      });

      await loadLesson(dayNumber);
    } catch (err: any) {
      console.error("Save error:", err);
      toast({
        title: "Save failed",
        description: err.message || "Could not save lesson content.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

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
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-600/80">
              Admin • Lessons
            </p>
            <h1 className="text-3xl font-display gold-gradient-text">
              Daily Lessons
            </h1>
            <p className="text-sm text-charcoal/70 mt-1">
              Single source of truth stored in course_content.
            </p>
          </div>

          <div className="flex gap-3">
            <select
              value={dayNumber}
              onChange={(e) => setDayNumber(Number(e.target.value))}
              className="border rounded px-3 py-2"
            >
              {dayOptions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gold text-black hover:bg-gold-dark"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        <Card className="lotus-card">
          <CardHeader>
            <CardTitle>Lesson Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Lesson title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Short description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Content Blocks</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={addTextBlock} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Text
            </Button>
            <Button variant="outline" onClick={addVideoBlock} size="sm">
              <Video className="h-4 w-4 mr-1" /> Video
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {blocks.length === 0 && (
            <p className="text-sm text-charcoal/70">No blocks yet.</p>
          )}

          {blocks.map((block, idx) => (
            <Card key={block.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  Block {idx + 1} • {block.type === "video" ? "Video" : "Text"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeBlock(block.id)}
                  aria-label="Remove block"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {block.type === "text" && (
                  <Textarea
                    placeholder="Text content"
                    value={block.content ?? ""}
                    onChange={(e) =>
                      updateBlockContent(block.id, e.target.value)
                    }
                    rows={5}
                  />
                )}

                {block.type === "video" && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Video URL (YouTube, Vimeo, etc.)"
                      value={block.url ?? ""}
                      onChange={(e) => updateBlockUrl(block.id, e.target.value)}
                    />
                    <Textarea
                      placeholder="Optional description"
                      value={block.content ?? ""}
                      onChange={(e) =>
                        updateBlockContent(block.id, e.target.value)
                      }
                      rows={3}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDailyLessons;
