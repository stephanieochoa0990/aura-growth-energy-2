import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function AdminLessonEditor() {
  const { dayNumber } = useParams();        // ← get day from URL
  const day = Number(dayNumber);            // convert to number
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rowId, setRowId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    loadLesson();
  }, [day]);

  const loadLesson = async () => {
    const { data, error } = await supabase
      .from("course_content")
      .select("*")
      .eq("day_number", day)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error(error);
      toast({ title: "Error loading lesson" });
      setLoading(false);
      return;
    }

    if (data) {
      setRowId(data.id);
      setTitle(data.title ?? "");
      setDescription(data.description ?? "");
      setBody(data.content_body?.text ?? "");
    } else {
      // no existing lesson — start fresh
      setRowId(null);
      setTitle("");
      setDescription("");
      setBody("");
    }

    setLoading(false);
  };

  const saveLesson = async () => {
    const payload = {
      day_number: day,
      title,
      description,
      content_body: { text: body },
      content_type: "lesson",
      is_published: true,
    };

    let response;
    if (rowId) {
      // UPDATE
      response = await supabase
        .from("course_content")
        .update(payload)
        .eq("id", rowId)
        .select();
    } else {
      // INSERT NEW
      response = await supabase
        .from("course_content")
        .insert(payload)
        .select();
    }

    if (response.error) {
      toast({ title: "Error", description: response.error.message });
    } else {
      toast({ title: "Saved!", description: "Lesson updated." });
      if (!rowId && response.data?.length) {
        setRowId(response.data[0].id);
      }
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">
        Edit Day {day} Lesson
      </h1>

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
          placeholder="Lesson Body"
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