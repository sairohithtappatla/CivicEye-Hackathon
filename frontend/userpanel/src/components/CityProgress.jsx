import React from "react";

function CityProgress() {
  // In future, fetch these values from backend for logged-in user
  const stats = [
    { label: "Total Reports", value: 24, color: "bg-blue-600" },
    { label: "Pending", value: 5, color: "bg-yellow-500" },
    { label: "Resolved", value: 19, color: "bg-green-600" },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 mb-4">
        City Progress
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-4 bg-white border rounded-xl shadow-sm text-center"
          >
            <div
              className={`text-2xl font-bold text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 ${stat.color}`}
            >
              {stat.value}
            </div>
            <p className="text-slate-700">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CityProgress;
