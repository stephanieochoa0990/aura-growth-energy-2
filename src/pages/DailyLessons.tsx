import { useNavigate } from "react-router-dom";

export default function DailyLessons() {
  const navigate = useNavigate();

  const days = [
    { day: 1, title: "The Forgotten Anatomy" },
    { day: 2, title: "Biofield Science & Sensing" },
    { day: 3, title: "Embodiment & Integration" },
    { day: 4, title: "Planetary & Elemental Resonance" },
    { day: 5, title: "Magneto-Electric Field" },
    { day: 6, title: "Autonomy & Command" },
    { day: 7, title: "Council & Integration" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">
        DAILY LESSONS (ADMIN)
      </h1>

      <p className="mb-6 text-center text-gray-600">
        <strong>Manage day</strong> opens the day with the &quot;Add Section&quot; button so you can add and edit sections.{" "}
        <strong>Legacy edit</strong> edits the single lesson (course_content) if you still use it.
      </p>

      <div className="space-y-4">
        {days.map((d) => (
          <div
            key={d.day}
            className="border p-4 rounded-lg flex flex-wrap justify-between items-center gap-3 bg-white shadow"
          >
            <div>
              <h2 className="text-xl font-semibold">Day {d.day} — {d.title}</h2>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => navigate(`/day-${d.day}`)}
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 font-medium"
              >
                Manage day / Add sections
              </button>
              <a
                href={`/admin/lessons?day=${d.day}`}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Legacy edit
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
