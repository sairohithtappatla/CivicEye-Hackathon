import React from "react";

function CommunityEngagement() {
  const testimonials = [
    {
      name: "Anita",
      feedback: "I reported a broken streetlight, it was fixed in 2 days!",
    },
    {
      name: "Ravi",
      feedback: "Road repairs in my area started quickly after reporting.",
    },
    {
      name: "Meena",
      feedback: "The app makes it so easy to raise civic issues. Love it!",
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 mb-4">
        Community Engagement
      </h2>
      <div className="space-y-3">
        {testimonials.map((t, i) => (
          <div
            key={i}
            className="p-4 bg-white border rounded-lg shadow-sm"
          >
            <p className="text-slate-700 italic">“{t.feedback}”</p>
            <p className="text-slate-500 text-sm mt-1">- {t.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CommunityEngagement;
