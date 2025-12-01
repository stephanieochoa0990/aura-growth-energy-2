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
        Choose PREVIEW to see what students see.  
        Choose EDIT to update lesson content.
      </p>

      <div className="space-y-4">
        {days.map((d) => (
          <div
            key={d.day}
            className="border p-4 rounded-lg flex justify-between items-center bg-white shadow"
          >
            <div>
              <h2 className="text-xl font-semibold">Day {d.day} — {d.title}</h2>
            </div>

            <div className="flex gap-3">
              {/* Student preview */}
              <button
                onClick={() => navigate(`/day-${d.day}`)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Preview
              </button>

              {/* Admin edit */}
              <button
                onClick={() => navigate(`/admin/lessons?day=${d.day}`)}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
