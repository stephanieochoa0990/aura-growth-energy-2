import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Video } from "lucide-react";

type BlockType = "text" | "video";

interface LessonBlock {
  id: string;            // local ID for React
  type: BlockType;
  content?: string | null;
  url?: string | null;   // video URL if type === "video"
}

interface CourseContentRow {
  id: string;
  day_number: number;
  title: string;
  description: string | null;
  content_body: any | null;
  video_url: string | null;
}

const dayTitles: Record<number, string> = {
  1: "The Forgotten Anatomy",
  2: "Biofield Science & Sensing",
  3: "Embodiment & Integration",
  4: "Planetary & Elemental Resonance",
  5: "Magneto-Electric Field",
  6: "Autonomy & Command",
  7: "Council & Integration",
};

const AdminLessonEditor: React.FC = () => {
  const { dayNumber } = useParams<{ dayNumber: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const dayNum = Number(dayNumber?.replace("day-", "").replace("-", "")) || Number(dayNumber) || 1;

  const [rowId, setRowId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState<string>("");
  const [blocks, setBlocks] = useState<LessonBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLesson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayNum]);

  const loadLesson = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("course_content")
        .select("id, day_number, title, description, content_body, video_url")
        .eq("day_number", dayNum)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const row = (data as CourseContentRow[] | null)?.[0] || null;

      if (!row) {
        // no row yet – initialise empty
        setRowId(null);
        setTitle(dayTitles[dayNum] || `Day ${dayNum}`);
        setDescription("");
        setBlocks([]);
        setLoading(false);
        return;
      }

      setRowId(row.id);
      setTitle(row.title || dayTitles[dayNum] || `Day ${dayNum}`);
      setDescription(row.description || "");

      let initialBlocks: LessonBlock[] = [];

      if (Array.isArray(row.content_body)) {
        initialBlocks = row.content_body.map((b: any, index: number) => ({
          id: `row-${index}-${Date.now()}`,
          type: b.type === "video" ? "video" : "text",
          content: b.content ?? "",
          url: b.url ?? null,
        }));
      }

      setBlocks(initialBlocks);
    } catch (err: any) {
      console.error("Error loading lesson:", err);
      toast({
        title: "Error",
        description: "Could not load lesson content.",
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
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  const addVideoBlock = () => {
    const newBlock: LessonBlock = {
      id: `temp-${Date.now()}`,
      type: "video",
      url: null,
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

  // Upload video to Supabase Storage and attach URL to block
  const handleVideoUpload = async (blockId: string, file: File | null) => {
    if (!file) return;

    try {
      const ext = file.name.split(".").pop();
      const path = `day-${dayNum}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("lesson-videos")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("lesson-videos")
        .getPublicUrl(path);

      const publicUrl = (publicData as any)?.publicUrl;
      if (!publicUrl) throw new Error("Could not get video URL.");

      updateBlockUrl(blockId, publicUrl);

      toast({
        title: "Video uploaded",
        description: "Your video has been uploaded successfully.",
      });
    } catch (err: any) {
      console.error("Video upload error:", err);
      toast({
        title: "Upload error",
        description: err.message || "Could not upload video.",
        variant: "destructive",
      });
    }
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

      // Prepare blocks for jsonb
      const payloadBlocks = blocks.map((b) => ({
        type: b.type,
        content: b.content ?? null,
        url: b.url ?? null,
      }));

      if (rowId) {
        // update existing row
        const { error } = await supabase
          .from("course_content")
          .update({
            title,
            description,
            content_body: payloadBlocks,
            content: null, // we are not using this field
            video_url:
              payloadBlocks.find((b) => b.type === "video" && b.url)?.url ||
              null,
            lesson_type: "lesson",
          })
          .eq("id", rowId);

        if (error) throw error;
      } else {
        // insert new row
        const { error } = await supabase.from("course_content").insert({
          day_number: dayNum,
          title,
          description,
          content_body: payloadBlocks,
          content: null,
          video_url:
            payloadBlocks.find((b) => b.type === "video" && b.url)?.url ||
            null,
          lesson_type: "lesson",
        });

        if (error) throw error;
      }

      toast({
        title: "Saved",
        description: "Lesson content has been updated.",
      });

      await loadLesson();
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

  const headingTitle =
    dayTitles[dayNum] || `Day ${dayNum} Lesson`;

  return (
    <div className="min-h-screen bg-[#f8f5f1] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-display gold-gradient-text">
              Edit Day {dayNum} Lesson
            </h1>
            <p className="text-sm text-charcoal/70 mt-1">
              {headingTitle}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/class/daily")}
            >
              Back to Daily Lessons
            </Button>

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
                "Save Lesson"
              )}
            </Button>
          </div>
        </div>

        {/* Basic fields */}
        <Card className="lotus-card">
          <CardHeader>
            <CardTitle className="text-base">
              Lesson Basics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Lesson Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Lesson title…"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Short Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description for the lesson…"
                className="min-h-[60px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Blocks editor */}
        <Card className="lotus-card">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">
              Content Blocks
            </CardTitle>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTextBlock}
              >
                <Plus className="h-4 w-4 mr-1" />
                Text Block
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVideoBlock}
              >
                <Video className="h-4 w-4 mr-1" />
                Video Block
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {blocks.length === 0 && (
              <p className="text-sm text-charcoal/60">
                No content yet for this day. Add a text or video block to begin.
              </p>
            )}

            {blocks.map((block, index) => (
              <div
                key={block.id}
                className="border border-gold/30 rounded-lg p-4 bg-white/80 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-charcoal/60">
                    Block {index + 1} —{" "}
                    {block.type === "text" ? "Text" : "Video"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBlock(block.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {block.type === "text" && (
                  <Textarea
                    value={block.content || ""}
                    onChange={(e) =>
                      updateBlockContent(block.id, e.target.value)
                    }
                    placeholder="Write the lesson text, reflection prompts, or guidance here…"
                    className="min-h-[100px]"
                  />
                )}

                {block.type === "video" && (
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <label className="text-sm text-charcoal/80">
                        Upload a video for this section:
                      </label>
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={(e) =>
                          handleVideoUpload(
                            block.id,
                            e.target.files?.[0] || null
                          )
                        }
                      />
                    </div>

                    {block.url ? (
                      <video
                        src={block.url}
                        controls
                        className="w-full rounded-lg border border-gold/30 mt-2"
                      />
                    ) : (
                      <p className="text-xs text-charcoal/60">
                        No video uploaded yet. Choose a file to upload.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLessonEditor;