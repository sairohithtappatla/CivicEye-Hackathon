import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  LogOut,
} from "lucide-react";
import { analyticsAPI, userAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [communityStats, setCommunityStats] = useState({
    totalReports: 0,
    resolvedReports: 0,
    activeCitizens: 0,
    avgResolutionTime: "N/A",
  });
  const [trendingCategories, setTrendingCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);

      const [analyticsResponse, suggestionsResponse] = await Promise.all([
        analyticsAPI.getCommunityAnalytics(),
        userAPI.getSuggestions(),
      ]);

      if (analyticsResponse.success) {
        setCommunityStats(analyticsResponse.analytics);
      }

      if (suggestionsResponse.success) {
        setTrendingCategories(
          suggestionsResponse.suggestions.trendingCategories
        );
      }
    } catch (error) {
      console.error("Error fetching home data:", error);
      // Use fallback data
      setCommunityStats({
        totalReports: 2,
        resolvedReports: 1,
        activeCitizens: 25,
        avgResolutionTime: "2.1 days",
      });
      setTrendingCategories([
        { category: "streetlight", count: 15 },
        { category: "garbage", count: 12 },
        { category: "pothole", count: 8 },
      ]);
    } finally {
      setLoading(false);
    }
  };

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

  const handleReportClick = () => {
    navigate("/report");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="civic-spinner">🏛️</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome, {user?.name || "Citizen"} 🇮🇳
          </h1>
          <p className="text-gray-600">Building better communities together</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      {/* Hero Section */}
      <div className="civic-section">
        <div className="civic-hero-card">
          <div className="civic-hero-content">
            <h2 className="civic-hero-title">
              🏛️ Serve Bharat — Together We Rise
            </h2>
            <p className="civic-hero-subtitle">
              Quick civic updates, one tap away 🚀
            </p>
            <button onClick={handleReportClick} className="civic-hero-button">
              📤 Report an Issue Now
            </button>
          </div>
        </div>
      </div>

      {/* Quick Categories */}
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

      {/* Community Stats */}
      <div className="civic-section">
        <div className="civic-section-header">
          <h2 className="civic-section-title">Community Impact</h2>
          <p className="civic-section-subtitle">
            Real-time progress in your area
          </p>
        </div>

        <div className="civic-stats-grid">
          <div className="civic-stat-card">
            <div className="civic-stat-icon">📊</div>
            <div className="civic-stat-number">
              {communityStats.totalReports}
            </div>
            <div className="civic-stat-label">Total Reports</div>
          </div>

          <div className="civic-stat-card">
            <div className="civic-stat-icon">✅</div>
            <div className="civic-stat-number">
              {communityStats.resolvedReports}
            </div>
            <div className="civic-stat-label">Resolved</div>
          </div>

          <div className="civic-stat-card">
            <div className="civic-stat-icon">⏱️</div>
            <div className="civic-stat-number">
              {communityStats.avgResolutionTime}
            </div>
            <div className="civic-stat-label">Avg Resolution</div>
          </div>
        </div>
      </div>

      {/* Trending Issues */}
      {trendingCategories.length > 0 && (
        <div className="civic-section">
          <div className="civic-section-header">
            <h2 className="civic-section-title">Trending in Your Area</h2>
            <p className="civic-section-subtitle">
              Most reported issues nearby
            </p>
          </div>

          <div className="civic-trending-wrapper-perfect">
            {trendingCategories.map((trend, index) => (
              <div key={index} className="civic-trending-card-perfect">
                <div className="civic-trending-icon-wrapper">
                  <div className="civic-trending-icon-emoji">
                    {trend.category === "streetlight"
                      ? "💡"
                      : trend.category === "garbage"
                      ? "🗑️"
                      : trend.category === "pothole"
                      ? "🕳️"
                      : "📋"}
                  </div>
                </div>
                <div className="civic-trending-info-perfect">
                  <h3 className="civic-trending-title-perfect">
                    {trend.category.charAt(0).toUpperCase() +
                      trend.category.slice(1)}
                  </h3>
                  <p className="civic-trending-count-perfect">
                    {trend.count} reports this week
                  </p>
                </div>
                <button
                  className="civic-trending-button-perfect"
                  onClick={() => handleCategorySelect(trend.category)}
                >
                  Report
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
