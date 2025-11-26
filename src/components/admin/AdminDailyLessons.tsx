import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Save, Trash2, Upload, Video } from "lucide-react";

type BlockType = "text" | "video";

interface LessonBlock {
  id: string;
  day_number: number;
  block_type: BlockType;
  content: string | null;
  video_url: string | null;
  position: number;
}

const AdminDailyLessons: React.FC = () => {
  const [day, setDay] = useState<number>(1);
  const [blocks, setBlocks] = useState<LessonBlock[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const { toast } = useToast();

  // Load blocks when day changes
  useEffect(() => {
    loadBlocks(day);
  }, [day]);

  const loadBlocks = async (dayNumber: number) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("lesson_blocks")
        .select("*")
        .eq("day_number", dayNumber)
        .order("position", { ascending: true });

      if (error) throw error;
      setBlocks((data as LessonBlock[]) || []);
    } catch (err: any) {
      console.error("Error loading lesson blocks:", err);
      toast({
        title: "Error",
        description: "Could not load lesson content.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add a new text block
  const addTextBlock = () => {
    const nextPos =
      blocks.length > 0
        ? Math.max(...blocks.map((b) => b.position)) + 1
        : 1;

    const newBlock: LessonBlock = {
      id: `temp-${Date.now()}`,
      day_number: day,
      block_type: "text",
      content: "",
      video_url: null,
      position: nextPos,
    };

    setBlocks((prev) => [...prev, newBlock]);
  };

  // Add a new video block (empty, waiting for upload)
  const addVideoBlock = () => {
    const nextPos =
      blocks.length > 0
        ? Math.max(...blocks.map((b) => b.position)) + 1
        : 1;

    const newBlock: LessonBlock = {
      id: `temp-${Date.now()}`,
      day_number: day,
      block_type: "video",
      content: null,
      video_url: null,
      position: nextPos,
    };

    setBlocks((prev) => [...prev, newBlock]);
  };

  const updateBlockContent = (id: string, content: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content } : b))
    );
  };

  const updateBlockVideoUrl = (id: string, video_url: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, video_url } : b))
    );
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  // Upload video to Supabase storage
  const handleVideoUpload = async (blockId: string, file: File | null) => {
    if (!file) return;

    try {
      const ext = file.name.split(".").pop();
      const path = `day-${day}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("lesson-videos")
        .upload(path, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicData } = supabase.storage
        .from("lesson-videos")
        .getPublicUrl(path);

      if (!publicData?.publicUrl) {
        throw new Error("Could not get video URL.");
      }

      updateBlockVideoUrl(blockId, publicData.publicUrl);

      toast({
        title: "Video Uploaded",
        description: "Your video has been uploaded successfully.",
      });
    } catch (err: any) {
      console.error("Video upload error:", err);
      toast({
        title: "Upload Error",
        description: err.message || "Could not upload video.",
        variant: "destructive",
      });
    }
  };

  // Save all blocks for this day
  const handleSave = async () => {
    try {
      setSaving(true);

      // 1) delete existing blocks for this day
      const { error: deleteError } = await supabase
        .from("lesson_blocks")
        .delete()
        .eq("day_number", day);

      if (deleteError) throw deleteError;

      if (blocks.length === 0) {
        toast({
          title: "Saved",
          description: "Cleared all content for this day.",
        });
        return;
      }

      // 2) insert new blocks
      const payload = blocks.map((b, index) => ({
        day_number: day,
        block_type: b.block_type,
        content: b.content,
        video_url: b.video_url,
        position: index + 1,
      }));

      const { error: insertError } = await supabase
        .from("lesson_blocks")
        .insert(payload);

      if (insertError) throw insertError;

      toast({
        title: "Saved",
        description: "Lesson content has been updated.",
      });

      // reload to get clean row IDs
      await loadBlocks(day);
    } catch (err: any) {
      console.error("Save error:", err);
      toast({
        title: "Save Failed",
        description: err.message || "Could not save lesson content.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f5f1] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-display gold-gradient-text">
              Admin — Daily Lessons
            </h1>
            <p className="text-sm text-charcoal/70 mt-1">
              Choose a day, edit the content blocks, and upload videos. Changes
              will appear in the student view.
            </p>
          </div>

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

        {/* Day selector */}
        <Card className="lotus-card">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">Select Lesson Day</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            <Select
              value={String(day)}
              onValueChange={(val) => setDay(Number(val))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Day 1</SelectItem>
                <SelectItem value="2">Day 2</SelectItem>
                <SelectItem value="3">Day 3</SelectItem>
                <SelectItem value="4">Day 4</SelectItem>
                <SelectItem value="5">Day 5</SelectItem>
                <SelectItem value="6">Day 6</SelectItem>
                <SelectItem value="7">Day 7</SelectItem>
              </SelectContent>
            </Select>

            {loading && (
              <div className="flex items-center gap-2 text-sm text-charcoal/70">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading content…
              </div>
            )}
          </CardContent>
        </Card>

        {/* Blocks editor */}
        <Card className="lotus-card">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">Content Blocks</CardTitle>
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
                    {block.block_type === "text" ? "Text" : "Video"}
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

                {block.block_type === "text" && (
                  <Textarea
                    value={block.content || ""}
                    onChange={(e) =>
                      updateBlockContent(block.id, e.target.value)
                    }
                    placeholder="Write the lesson text, reflection prompt, or guidance here…"
                    className="min-h-[100px]"
                  />
                )}

                {block.block_type === "video" && (
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

                    {block.video_url ? (
                      <video
                        src={block.video_url}
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

export default AdminDailyLessons;
