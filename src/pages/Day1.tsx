import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Day1() {
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<any>(null);

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
    } else {
      setLesson(data);
    }
    setLoading(false);
  };

  if (loading) return <p>Loading...</p>;
  if (!lesson) return <p>No lesson found.</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">{lesson.title}</h1>
      <p className="text-gray-700 mb-6">{lesson.description}</p>

      <div className="prose whitespace-pre-wrap">
        {lesson.content_body?.text}
      </div>
    </div>
  );
}