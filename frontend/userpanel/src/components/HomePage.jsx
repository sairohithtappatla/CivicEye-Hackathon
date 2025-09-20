import React from "react";
import { Plus } from "lucide-react";

const quickCategories = [
  {
    key: "garbage",
    label: "Garbage",
    icon: "🗑️",
    reportValue: "garbage",
    description: "Waste management issues",
  },
  {
    key: "streetlight",
    label: "Street Light",
    icon: "💡",
    reportValue: "streetlight",
    description: "Lighting problems",
  },
  {
    key: "pothole",
    label: "Road Damage",
    icon: "🛣️",
    reportValue: "pothole",
    description: "Road infrastructure",
  },
  {
    key: "water",
    label: "Water Supply",
    icon: "💧",
    reportValue: "water",
    description: "Water related issues",
  },
  {
    key: "traffic",
    label: "Traffic",
    icon: "🚦",
    reportValue: "traffic",
    description: "Traffic signals",
  },
  {
    key: "drainage",
    label: "Drainage",
    icon: "🌊",
    reportValue: "drainage",
    description: "Drainage problems",
  },
  {
    key: "construction",
    label: "Construction",
    icon: "🏗️",
    reportValue: "construction",
    description: "Construction work",
  },
  {
    key: "parks",
    label: "Parks",
    icon: "🌳",
    reportValue: "parks",
    description: "Park maintenance",
  },
  {
    key: "electricity",
    label: "Power",
    icon: "⚡",
    reportValue: "electricity",
    description: "Power issues",
  },
  {
    key: "safety",
    label: "Safety",
    icon: "🛡️",
    reportValue: "safety",
    description: "Safety concerns",
  },
];

function HomePage({ onCategorySelect, onReportClick }) {
  const handleTouchStart = (e) => {
    // Prevent any interference with native scrolling
    e.stopPropagation();
  };

  const handleTouchMove = (e) => {
    // Allow horizontal scrolling, prevent vertical
    e.stopPropagation();
  };

  return (
    <div className="civic-page">
      {/* Header */}
      <div className="civic-header-home">
        <div className="civic-header-content">
          <div className="civic-header-icon">🏛️</div>
          <div className="civic-header-text">
            <h1 className="civic-header-title">CivicEye</h1>
            <p className="civic-header-subtitle">Report. Resolve. Rise.</p>
          </div>
        </div>

        <button onClick={onReportClick} className="civic-report-button">
          <Plus size={16} />
          Report Issue
        </button>
      </div>

      {/* Scrollable Quick Categories */}
      <div className="civic-section">
        <div className="civic-section-header">
          <h2 className="civic-section-title">Quick Report Categories</h2>
          <p className="civic-section-subtitle">
            Tap a category to report quickly
          </p>
        </div>

        <div className="civic-categories-scroll-container">
          <p className="civic-scroll-help">← Swipe to see more categories →</p>
          <div
            className="civic-categories-scroll-track"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            {quickCategories.map((category) => (
              <div
                key={category.key}
                className="civic-category-scroll-card"
                onClick={() => onCategorySelect(category)}
              >
                <div className="civic-category-scroll-icon">
                  {category.icon}
                </div>
                <div className="civic-category-scroll-content">
                  <span className="civic-category-scroll-label">
                    {category.label}
                  </span>
                  <span className="civic-category-scroll-desc">
                    {category.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="civic-scroll-indicator">
            <span className="civic-scroll-hint">Swipe for more →</span>
          </div>
        </div>
      </div>

      {/* City Progress */}
      <div className="civic-section">
        <div className="civic-section-header">
          <h2 className="civic-section-title">City Progress</h2>
        </div>
        <div className="civic-stats-grid">
          <div className="civic-stat-card">
            <div className="civic-stat-icon">🔍</div>
            <div className="civic-stat-number">127</div>
            <div className="civic-stat-label">Total Reports</div>
          </div>
          <div className="civic-stat-card">
            <div className="civic-stat-icon">⏰</div>
            <div className="civic-stat-number">23</div>
            <div className="civic-stat-label">Pending</div>
          </div>
          <div className="civic-stat-card">
            <div className="civic-stat-icon">✅</div>
            <div className="civic-stat-number">104</div>
            <div className="civic-stat-label">Resolved</div>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="civic-section">
        <div className="civic-section-header">
          <h2 className="civic-section-title">Recent Reports</h2>
        </div>
        <div className="civic-empty-state">
          <div className="civic-empty-icon">📋</div>
          <p className="civic-empty-text">Loading recent reports...</p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
