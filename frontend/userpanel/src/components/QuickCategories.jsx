import React from "react";
import { useNavigate } from "react-router-dom";

function QuickCategories() {
  const navigate = useNavigate();

  const categories = [
    {
      id: "garbage",
      name: "Garbage",
      icon: "🗑️",
      description: "Waste management issues",
      color: "#10b981",
    },
    {
      id: "streetlight",
      name: "Street Light",
      icon: "💡",
      description: "Lighting problems",
      color: "#f59e0b",
    },
    {
      id: "pothole",
      name: "Road Damage",
      icon: "🕳️",
      description: "Road infrastructure",
      color: "#ef4444",
    },
    {
      id: "water",
      name: "Water Issues",
      icon: "💧",
      description: "Water supply problems",
      color: "#3b82f6",
    },
    {
      id: "electricity",
      name: "Electricity",
      icon: "⚡",
      description: "Power supply issues",
      color: "#f59e0b",
    },
    {
      id: "traffic",
      name: "Traffic",
      icon: "🚦",
      description: "Traffic management",
      color: "#8b5cf6",
    },
  ];

  const handleCategorySelect = (categoryId) => {
    navigate(`/report?category=${categoryId}`);
  };

  return (
    <div className="civic-section">
      <div className="civic-section-header">
        <h2 className="civic-section-title">Quick Report Categories</h2>
        <p className="civic-section-subtitle">
          Select an issue type to get started
        </p>
      </div>

      <div className="civic-categories-grid">
        {categories.map((category) => (
          <div
            key={category.id}
            className="civic-category-card"
            onClick={() => handleCategorySelect(category.id)}
          >
            <div className="civic-category-icon">{category.icon}</div>
            <h3 className="civic-category-name">{category.name}</h3>
            <p className="civic-category-desc">{category.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuickCategories;
