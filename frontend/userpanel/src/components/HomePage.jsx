import React, { useState, useEffect } from "react";
import { Plus, MapPin, TrendingUp, Clock } from "lucide-react";
import { userAPI, analyticsAPI } from "../services/api";

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
  const [userSuggestions, setUserSuggestions] = useState(null);
  const [communityStats, setCommunityStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState({ lat: null, lng: null });

  useEffect(() => {
    getCurrentLocation();
    fetchCommunityData();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          fetchUserSuggestions(lat, lng);
        },
        (error) => {
          console.warn("Location error:", error);
          // Use default Bengaluru coordinates
          setUserLocation({ lat: 12.9716, lng: 77.5946 });
          fetchUserSuggestions(12.9716, 77.5946);
        }
      );
    } else {
      setUserLocation({ lat: 12.9716, lng: 77.5946 });
      fetchUserSuggestions(12.9716, 77.5946);
    }
  };

  const fetchUserSuggestions = async (latitude, longitude) => {
    try {
      const email = "rajesh.kumar@civiceye.com"; // In real app, get from auth context
      const response = await userAPI.getSuggestions(email, latitude, longitude);

      if (response.success) {
        setUserSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const fetchCommunityData = async () => {
    try {
      const response = await analyticsAPI.getCommunityAnalytics();

      if (response.success) {
        setCommunityStats(response.analytics);
      }
    } catch (error) {
      console.error("Error fetching community data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="civic-page">
      {/* Enhanced Header with Location */}
      <div className="civic-page-header">
        <div className="civic-header-content">
          <div className="civic-greeting-section">
            <div className="civic-greeting-main">
              <h1 className="civic-greeting-title">🏛️ CivicEye</h1>
              <p className="civic-greeting-subtitle">
                Building better communities together
              </p>
            </div>
            <div className="civic-location-badge">
              <MapPin size={14} />
              <span>HSR Layout, Bengaluru</span>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Suggestions Section */}
      {userSuggestions?.quickActions && (
        <div className="civic-section">
          <div className="civic-section-header">
            <h2 className="civic-section-title">Smart Suggestions</h2>
            <p className="civic-section-subtitle">
              Based on your location and activity
            </p>
          </div>
          <div className="civic-suggestions-grid">
            {userSuggestions.quickActions
              .slice(0, 4)
              .map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onCategorySelect(suggestion.category)}
                  className={`civic-suggestion-card civic-suggestion-${suggestion.priority}`}
                >
                  <div className="civic-suggestion-icon">
                    {getCategoryIcon(suggestion.category)}
                  </div>
                  <div className="civic-suggestion-content">
                    <span className="civic-suggestion-label">
                      {suggestion.label}
                    </span>
                    <span className="civic-suggestion-priority">
                      {suggestion.priority} priority
                    </span>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Community Impact Stats */}
      {communityStats && (
        <div className="civic-section">
          <div className="civic-section-header">
            <h2 className="civic-section-title">Community Impact</h2>
            <p className="civic-section-subtitle">
              Real-time progress in your area
            </p>
          </div>
          <div className="civic-impact-stats-grid">
            <div className="civic-impact-stat">
              <div className="civic-impact-stat-icon">📊</div>
              <div className="civic-impact-stat-content">
                <div className="civic-impact-stat-number">
                  {communityStats.totalReports || 0}
                </div>
                <div className="civic-impact-stat-label">Total Reports</div>
              </div>
            </div>
            <div className="civic-impact-stat">
              <div className="civic-impact-stat-icon">✅</div>
              <div className="civic-impact-stat-content">
                <div className="civic-impact-stat-number">
                  {communityStats.resolvedReports || 0}
                </div>
                <div className="civic-impact-stat-label">Resolved</div>
              </div>
            </div>
            <div className="civic-impact-stat">
              <div className="civic-impact-stat-icon">⏱️</div>
              <div className="civic-impact-stat-content">
                <div className="civic-impact-stat-number">
                  {communityStats.avgResolutionTime || "N/A"}
                </div>
                <div className="civic-impact-stat-label">Avg Resolution</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing Quick Categories */}
      <div className="civic-section">
        <div className="civic-section-header">
          <h2 className="civic-section-title">Report Issues</h2>
          <p className="civic-section-subtitle">
            Select a category to get started
          </p>
        </div>

        <div className="civic-categories-scroll-container">
          <div className="civic-categories-scroll-track">
            {quickCategories.map((category) => (
              <button
                key={category.key}
                onClick={() => onCategorySelect(category.reportValue)}
                className="civic-category-scroll-card"
              >
                <div className="civic-category-scroll-icon">
                  <span className="civic-category-scroll-emoji">
                    {category.icon}
                  </span>
                </div>
                <div className="civic-category-scroll-content">
                  <span className="civic-category-scroll-label">
                    {category.label}
                  </span>
                  <span className="civic-category-scroll-description">
                    {category.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Report Button */}
      <div className="civic-section">
        <button onClick={onReportClick} className="civic-quick-report-button">
          <Plus size={24} />
          <span>Quick Report</span>
        </button>
      </div>

      {/* Trending Categories */}
      {userSuggestions?.trendingCategories && (
        <div className="civic-section">
          <div className="civic-section-header">
            <h2 className="civic-section-title">Trending in Your Area</h2>
            <p className="civic-section-subtitle">
              Most reported issues nearby
            </p>
          </div>
          <div className="civic-trending-list">
            {userSuggestions.trendingCategories
              .slice(0, 3)
              .map((trending, index) => (
                <div key={index} className="civic-trending-item">
                  <div className="civic-trending-icon">
                    {getCategoryIcon(trending.category)}
                  </div>
                  <div className="civic-trending-content">
                    <span className="civic-trending-category">
                      {trending.category}
                    </span>
                    <span className="civic-trending-count">
                      {trending.count} reports this week
                    </span>
                  </div>
                  <TrendingUp size={16} className="civic-trending-arrow" />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  function getCategoryIcon(category) {
    const icons = {
      garbage: "🗑️",
      streetlight: "💡",
      pothole: "🕳️",
      water: "💧",
      traffic: "🚦",
      drainage: "🌊",
      electricity: "⚡",
      noise: "🔊",
    };
    return icons[category] || "📋";
  }
}

export default HomePage;
