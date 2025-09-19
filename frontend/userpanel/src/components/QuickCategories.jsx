import React from "react";

const categories = [
  { key: "garbage", label: "Garbage" },
  { key: "street_light", label: "Street Light" },
  { key: "road_damage", label: "Road Damage" },
  { key: "water_leakage", label: "Water Leakage" },
  { key: "electricity", label: "Electricity" },
  { key: "public_safety", label: "Public Safety" },
  { key: "other", label: "Other" },
];

function QuickCategories() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 mb-4">
        Quick Report Categories
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <div
            key={cat.key}
            className="min-w-[120px] px-4 py-3 bg-white border rounded-xl shadow-sm text-center text-slate-700 hover:bg-blue-50 cursor-pointer"
          >
            {cat.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuickCategories;
