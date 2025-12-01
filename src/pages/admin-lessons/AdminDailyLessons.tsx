import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Save, Trash2, Video, ArrowUp, ArrowDown, ArrowLeft } from "lucide-react";

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

const createId = () => (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random()}`);

const normalizeContentBody = (body: any): LessonSection[] => {
  if (Array.isArray(body) && body.length > 0 && body[0]?.blocks) {
    // Already nested structure; keep fields, only fill minimal defaults when missing
    return body.map((section: any, idx: number) => ({
      id: section.id || createId(),
      title: section.title ?? `Section ${idx + 1}`,
      number: section.number ?? idx + 1,
      blocks: Array.isArray(section.blocks)
        ? section.blocks.map((b: any) => ({
            id: b.id || createId(),
            type: b.type === "video" ? "video" : "text",
            content: b.content ?? "",
            url: b.url ?? null,
          }))
        : [],
    }));
  }

  if (Array.isArray(body) && body.length > 0) {
    // Legacy flat blocks -> wrap in a single section
    return [
      {
        id: createId(),
        title: "Section 1",
        number: 1,
        blocks: body.map((b: any) => ({
          id: b.id || createId(),
          type: b.type === "video" ? "video" : "text",
          content: b.content ?? b.text ?? "",
          url: b.url ?? null,
        })),
      },
    ];
  }

  return [];
};

const AdminDailyLessons: React.FC = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [rowId, setRowId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [sections, setSections] = useState<LessonSection[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [lastLoadedRow, setLastLoadedRow] = useState<CourseContentRow | null>(null);

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

  const loadLesson = async (day: number, idOverride?: string | null) => {
    try {
      setLoading(true);

      const baseQuery = supabase
        .from("course_content")
        .select("id, day_number, title, description, content_body, video_url");

      const { data, error } = idOverride
        ? await baseQuery.eq("id", idOverride).single()
        : await baseQuery.eq("day_number", day).limit(1).maybeSingle();

      if (error) throw error;

      const row = data as CourseContentRow | null;
      console.log("DEBUG_LOAD_ROW", row);

      if (!row) {
        setRowId(null);
        setTitle(`Day ${day}`);
        setDescription("");
        setSections([]);
        return;
      }

      setRowId(row.id);
      setTitle(row.title || `Day ${day}`);
      setDescription(row.description || "");
      setLastLoadedRow(row);

      const normalized = normalizeContentBody(row.content_body);
      setSections(normalized);
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

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        id: createId(),
        title: `Section ${prev.length + 1}`,
        number: prev.length + 1,
        blocks: [],
      },
    ]);
  };

  const updateSectionTitle = (id: string, newTitle: string) => {
    setSections((prev) =>
      prev.map((section) => (section.id === id ? { ...section, title: newTitle } : section))
    );
  };

  const removeSection = (id: string) => {
    setSections((prev) =>
      prev
        .filter((section) => section.id !== id)
        .map((section, idx) => ({ ...section, number: idx + 1 }))
    );
  };

  const moveSection = (id: string, direction: "up" | "down") => {
    setSections((prev) => {
      const index = prev.findIndex((s) => s.id === id);
      if (index === -1) return prev;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const newSections = [...prev];
      const [removed] = newSections.splice(index, 1);
      newSections.splice(targetIndex, 0, removed);
      return newSections.map((s, idx) => ({ ...s, number: idx + 1 }));
    });
  };

  const addBlock = (sectionId: string, type: BlockType) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              blocks: [
                ...section.blocks,
                {
                  id: createId(),
                  type,
                  content: "",
                  url: type === "video" ? "" : null,
                },
              ],
            }
          : section
      )
    );
  };

  const updateBlockContent = (sectionId: string, blockId: string, content: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              blocks: section.blocks.map((b) =>
                b.id === blockId ? { ...b, content } : b
              ),
            }
          : section
      )
    );
  };

  const updateBlockUrl = (sectionId: string, blockId: string, url: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              blocks: section.blocks.map((b) =>
                b.id === blockId ? { ...b, url } : b
              ),
            }
          : section
      )
    );
  };

  const removeBlock = (sectionId: string, blockId: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, blocks: section.blocks.filter((b) => b.id !== blockId) }
          : section
      )
    );
  };

  const moveBlock = (sectionId: string, blockId: string, direction: "up" | "down") => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        const idx = section.blocks.findIndex((b) => b.id === blockId);
        if (idx === -1) return section;
        const target = direction === "up" ? idx - 1 : idx + 1;
        if (target < 0 || target >= section.blocks.length) return section;
        const newBlocks = [...section.blocks];
        const [removed] = newBlocks.splice(idx, 1);
        newBlocks.splice(target, 0, removed);
        return { ...section, blocks: newBlocks };
      })
    );
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

      const payloadSections = sections.map((section, idx) => ({
        id: section.id,
        title: section.title,
        number: idx + 1,
        blocks: (section.blocks || []).map((b) => ({
          id: b.id,
          type: b.type,
          content: b.content ?? "",
          url: b.url ?? null,
        })),
      }));

      const allBlocks = payloadSections.flatMap((s) => s.blocks);
      const videoUrl =
        allBlocks.find((b) => b.type === "video" && b.url)?.url || null;

      const payload = {
        title,
        description,
        content_body: payloadSections,
        video_url: videoUrl,
        updated_at: new Date().toISOString(),
      };
      console.log("DEBUG_SAVE_SECTIONS", sections);
      console.log("DEBUG_SAVE_PAYLOAD", payload);

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
        const newId = (data as any)?.id ?? null;
        setRowId(newId);
        await loadLesson(dayNumber, newId);
        return;
      }

      toast({
        title: "Saved",
        description: "Lesson content has been updated.",
      });

      await loadLesson(dayNumber, rowId);
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
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => navigate("/class/daily")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Lessons
            </Button>
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
          <h2 className="text-xl font-semibold">Sections</h2>
          <Button variant="outline" onClick={addSection} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Section
          </Button>
        </div>

        <div className="space-y-4">
          {sections.length === 0 && (
            <p className="text-sm text-charcoal/70">No sections yet.</p>
          )}

          {sections.map((section, sectionIndex) => (
            <Card key={section.id}>
              <CardHeader className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Section {section.number}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => moveSection(section.id, "up")}
                      disabled={sectionIndex === 0}
                      aria-label="Move section up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => moveSection(section.id, "down")}
                      disabled={sectionIndex === sections.length - 1}
                      aria-label="Move section down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSection(section.id)}
                      aria-label="Remove section"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Input
                  placeholder="Section title"
                  value={section.title}
                  onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addBlock(section.id, "text")}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Text
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addBlock(section.id, "video")}
                  >
                    <Video className="h-4 w-4 mr-1" /> Video
                  </Button>
                </div>

                <div className="space-y-3">
                  {section.blocks.length === 0 && (
                    <p className="text-sm text-charcoal/70">No blocks in this section.</p>
                  )}

                  {section.blocks.map((block, blockIndex) => (
                    <Card key={block.id} className="border border-dashed">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm">
                          Block {blockIndex + 1} • {block.type === "video" ? "Video" : "Text"}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => moveBlock(section.id, block.id, "up")}
                            disabled={blockIndex === 0}
                            aria-label="Move block up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => moveBlock(section.id, block.id, "down")}
                            disabled={blockIndex === section.blocks.length - 1}
                            aria-label="Move block down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBlock(section.id, block.id)}
                            aria-label="Remove block"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {block.type === "text" && (
                          <Textarea
                            placeholder="Text content"
                            value={block.content}
                            onChange={(e) =>
                              updateBlockContent(section.id, block.id, e.target.value)
                            }
                            rows={5}
                          />
                        )}

                        {block.type === "video" && (
                          <div className="space-y-2">
                            <Input
                              placeholder="Video URL (YouTube, Vimeo, etc.)"
                              value={block.url ?? ""}
                              onChange={(e) =>
                                updateBlockUrl(section.id, block.id, e.target.value)
                              }
                            />
                            <Textarea
                              placeholder="Optional description"
                              value={block.content}
                              onChange={(e) =>
                                updateBlockContent(section.id, block.id, e.target.value)
                              }
                              rows={3}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
};

export default AdminDailyLessons;
