import React from "react";
import { useNavigate } from "react-router-dom";

function HeroSection() {
  const navigate = useNavigate();

  return (
    <div className="civic-section">
      <div className="civic-hero-card">
        <div className="civic-hero-content">
          <h2 className="civic-hero-title">
            🏛️ Serve Bharat — Together We Rise
          </h2>
          <p className="civic-hero-subtitle">
            Quick civic updates, one tap away 🚀
          </p>
          <button
            onClick={() => navigate("/report")}
            className="civic-hero-button"
          >
            📤 Report an Issue Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default HeroSection;
