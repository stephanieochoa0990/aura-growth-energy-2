import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type LessonSection = {
  id: string;
  day_number: number;
  section_slug: string;
  title: string | null;
  content_markdown: string | null;
  sort_order: number;
};

const AdminDayEditor: React.FC = () => {
  const { dayNumber } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [day, setDay] = useState<number | null>(null);
  const [sections, setSections] = useState<LessonSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingSection, setAddingSection] = useState(false);

  useEffect(() => {
    const parsed = dayNumber ? parseInt(dayNumber, 10) : NaN;
    if (!parsed || parsed < 1 || parsed > 7) {
      toast({
        title: "Invalid day number",
        description: "Day must be between 1 and 7.",
        variant: "destructive",
      });
      navigate("/admin");
      return;
    }
    setDay(parsed);
    loadSections(parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayNumber]);

  const loadSections = async (day: number) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("lesson_sections")
        .select("*")
        .eq("day_number", day)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setSections((data || []) as LessonSection[]);
    } catch (err: any) {
      console.error("Error loading lesson sections:", err);
      toast({
        title: "Error",
        description: "Failed to load lesson content.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (
    id: string,
    field: keyof LessonSection,
    value: string
  ) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === id ? { ...section, [field]: value } : section
      )
    );
  };

  const handleAddSection = async () => {
    if (!day) return;
    setAddingSection(true);
    try {
      const maxOrder =
        sections.length > 0
          ? Math.max(...sections.map((s) => s.sort_order))
          : 0;

      const { data, error } = await supabase
        .from("lesson_sections")
        .insert({
          day_number: day,
          section_slug: `section_${maxOrder + 1}`,
          title: "New Section",
          content_markdown: "",
          sort_order: maxOrder + 1,
        })
        .select("*")
        .single();

      if (error) throw error;
      setSections((prev) => [...prev, data as LessonSection]);
    } catch (err: any) {
      console.error("Error adding section:", err);
      toast({
        title: "Error",
        description: "Could not add a new section.",
        variant: "destructive",
      });
    } finally {
      setAddingSection(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const section of sections) {
        const { error } = await supabase
          .from("lesson_sections")
          .update({
            section_slug: section.section_slug,
            title: section.title,
            content_markdown: section.content_markdown,
            sort_order: section.sort_order,
          })
          .eq("id", section.id);

        if (error) throw error;
      }

      toast({
        title: "Saved",
        description: "Lesson content has been updated.",
      });
    } catch (err: any) {
      console.error("Error saving lesson:", err);
      toast({
        title: "Error",
        description: "Could not save changes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm("Delete this section? This cannot be undone.")) return;

    try {
      const { error } = await supabase
        .from("lesson_sections")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSections((prev) => prev.filter((s) => s.id !== id));

      toast({
        title: "Deleted",
        description: "Section has been removed.",
      });
    } catch (err: any) {
      console.error("Error deleting section:", err);
      toast({
        title: "Error",
        description: "Could not delete section.",
        variant: "destructive",
      });
    }
  };

  const handlePreview = () => {
    if (!day) return;
    // You can change this to whatever student route will show that day
    navigate(`/day-${day}`);
  };

  if (loading || day === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f5f1]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#7a6041] tracking-wide">
            Loading lesson content…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f5f1] px-4 py-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-600/80">
              ADMIN · LESSON EDITOR
            </p>
            <h1 className="text-2xl md:text-3xl font-display gold-gradient-text mt-1">
              Day {day} · Script & Sections
            </h1>
            <p className="text-sm text-[#7a6041] mt-1">
              Edit the written content, structure, and flow for this day&apos;s
              journey.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="text-xs md:text-sm"
              onClick={handlePreview}
            >
              View as Student
            </Button>
            <Button
              className="bg-yellow-600 hover:bg-yellow-700 text-xs md:text-sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>

        <Card className="border-yellow-200/70 shadow-sm">
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-base md:text-lg text-[#24160b]">
              Sections for Day {day}
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddSection}
              disabled={addingSection}
            >
              {addingSection ? "Adding…" : "Add Section"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {sections.length === 0 && (
              <p className="text-sm text-[#7a6041]">
                No sections yet. Click &quot;Add Section&quot; to start building
                this lesson.
              </p>
            )}

            {sections.map((section) => (
              <div
                key={section.id}
                className="border border-yellow-200/80 rounded-lg p-4 bg-white/80 space-y-3"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-[#7a6041] mb-1">
                      Section Key / Slug
                    </label>
                    <Input
                      value={section.section_slug}
                      onChange={(e) =>
                        handleFieldChange(
                          section.id,
                          "section_slug",
                          e.target.value
                        )
                      }
                      placeholder="intro, activation, reflection, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#7a6041] mb-1">
                      Order
                    </label>
                    <Input
                      type="number"
                      className="w-20"
                      value={section.sort_order}
                      onChange={(e) =>
                        handleFieldChange(
                          section.id,
                          "sort_order",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="ml-auto border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteSection(section.id)}
                  >
                    ✕
                  </Button>
                </div>

                <div>
                  <label className="block text-xs text-[#7a6041] mb-1">
                    Section Title (optional)
                  </label>
                  <Input
                    value={section.title || ""}
                    onChange={(e) =>
                      handleFieldChange(section.id, "title", e.target.value)
                    }
                    placeholder="Example: Opening Transmission, Flame Activation, Integration Reflection"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#7a6041] mb-1">
                    Content (Markdown)
                  </label>
                  <Textarea
                    className="min-h-[160px] font-mono text-sm"
                    value={section.content_markdown || ""}
                    onChange={(e) =>
                      handleFieldChange(
                        section.id,
                        "content_markdown",
                        e.target.value
                      )
                    }
                    placeholder="Write your full script here in Markdown. You can use **bold**, _italics_, bullet lists, etc."
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate("/admin")}>
            ← Back to Admin Dashboard
          </Button>
          <Button
            className="bg-yellow-600 hover:bg-yellow-700"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDayEditor;
