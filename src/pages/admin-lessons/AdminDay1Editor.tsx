import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function AdminDay1Editor() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [rowId, setRowId] = useState(null);

  // Load existing lesson
  useEffect(() => {
    loadLesson();
  }, []);

  const loadLesson = async () => {
    const { data, error } = await supabase
      .from("course_content")
      .select("*")
      .eq("day_number", 1)
      .single();

    if (error) {
      console.error(error);
      toast({ title: "Error loading lesson" });
    } else if (data) {
      setRowId(data.id);
      setTitle(data.title || "");
      setDescription(data.description || "");
      setBody(data.content_body?.text || "");
    }

    setLoading(false);
  };

  const saveLesson = async () => {
    const payload = {
      day_number: 1,
      title,
      description,
      content_body: { text: body },
      content_type: "lesson",
      is_published: true
    };

    let response;
    if (rowId) {
      response = await supabase
        .from("course_content")
        .update(payload)
        .eq("id", rowId);
    } else {
      response = await supabase.from("course_content").insert(payload).select();
    }

    if (response.error) {
      toast({ title: "Error saving lesson", description: response.error.message });
    } else {
      toast({ title: "Saved!", description: "Lesson updated." });
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Edit Day 1 Lesson</h1>

      <div className="space-y-3">
        <input
          className="w-full border p-2 rounded"
          placeholder="Lesson Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="Short Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <textarea
          className="w-full h-40 border p-2 rounded"
          placeholder="Lesson Text Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        <button
          className="px-4 py-2 bg-yellow-600 text-white rounded"
          onClick={saveLesson}
        >
          Save Lesson
        </button>
      </div>
    </div>
  );
}