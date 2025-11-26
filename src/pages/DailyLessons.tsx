import { useNavigate } from "react-router-dom";

const days = [
  { slug: "/day-1", label: "Day 1 — The Forgotten Anatomy" },
  { slug: "/day-2", label: "Day 2 — Biofield Science & Sensing" },
  { slug: "/day-3", label: "Day 3 — Embodiment & Integration" },
  { slug: "/day-4", label: "Day 4 — Planetary & Elemental Resonance" },
  { slug: "/day-5", label: "Day 5 — Magneto-Electric Field" },
  { slug: "/day-6", label: "Day 6 — Autonomy & Command" },
  { slug: "/day-7", label: "Day 7 — Council & Integration" },
];

export default function DailyLessons() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ivory lotus-pattern p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-display mb-4 gold-gradient-text">
          Daily Lessons (Preview)
        </h1>
        <p className="mb-6 text-charcoal/80">
          Choose a day to open the student view of that lesson. This is just a
          navigation page – the actual content still lives in your Day 1–7
          pages.
        </p>

        <div className="space-y-3">
          {days.map((day) => (
            <button
              key={day.slug}
              onClick={() => navigate(day.slug)}
              className="w-full flex justify-between items-center px-4 py-3 rounded-lg border border-gold/30 bg-white/80 hover:bg-gold/10 transition"
            >
              <span className="text-left">{day.label}</span>
              <span className="text-sm text-gold font-medium">Open</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}