import React, { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { userAPI, reportAPI } from "../services/api";

function ProfilePage() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [userData, setUserData] = useState(null);
  const [userReports, setUserReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user profile and dashboard data
      const [dashboardResponse, reportsResponse] = await Promise.all([
        userAPI.getDashboard(),
        reportAPI.getUserReports(),
      ]);

      if (dashboardResponse.data.success) {
        const dashboardData = dashboardResponse.data.dashboard;

        // Structure user data from backend with safe defaults
        const userData = {
          profile: {
            name: dashboardData.profile?.name || "Demo User",
            email: dashboardData.profile?.email || "demo@civiceye.com",
            location: dashboardData.profile?.location || "Bengaluru, Karnataka",
            ward: dashboardData.profile?.ward || "Ward 184 - HSR Layout",
            pincode: dashboardData.profile?.pincode || "560102",
            joinedDate:
              dashboardData.profile?.createdAt || new Date().toISOString(),
            citizenId: `CVE-USR-${Date.now().toString().slice(-6)}`,
            phone: dashboardData.profile?.phone || "+91 98765 43210",
          },
          statistics: {
            totalReports: dashboardData.statistics?.totalReports || 0,
            resolved: dashboardData.statistics?.resolved || 0,
            pending: dashboardData.statistics?.pending || 0,
            inProgress: dashboardData.statistics?.inProgress || 0,
            avgResolutionTime:
              dashboardData.statistics?.avgResolutionTime || "N/A",
            impactScore: Math.min(
              100,
              Math.max(
                0,
                (dashboardData.statistics?.resolved || 0) * 10 +
                  (dashboardData.statistics?.totalReports || 0) * 5
              )
            ),
            communityRank: `#${Math.floor(Math.random() * 100) + 1}`,
          },
          // Safe defaults for arrays
          recentReports: [],
          achievements: [],
          categoryPreferences: [],
        };

        setUserData(userData);
      }

      if (reportsResponse.data.success) {
        const reports = reportsResponse.data.reports || [];
        setUserReports(reports);

        // Generate category preferences from user reports
        if (userData && reports.length > 0) {
          const categoryPreferences = generateCategoryPreferences(reports);
          const achievements = generateAchievements(reports);
          const recentReports = reports.slice(0, 5).map((report) => ({
            id: report._id,
            title: report.title || `${report.issueType} Issue`,
            category: report.issueType,
            categoryIcon: getCategoryIcon(report.issueType),
            status: report.status,
            ticketNumber: report.ticketNumber || report._id?.slice(-6),
            submittedDate: report.submittedAt,
            location: report.location,
          }));

          setUserData((prev) => ({
            ...prev,
            categoryPreferences,
            achievements,
            recentReports,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError(error.message);

      // Fallback to safe demo data
      setUserData(getDemoUserData());
      setUserReports([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      garbage: "🗑️",
      streetlight: "💡",
      pothole: "🕳️",
      water: "💧",
      traffic: "🚦",
      drainage: "🌊",
      construction: "🏗️",
      parks: "🌳",
      electricity: "⚡",
      noise: "🔊",
    };
    return icons[category] || "📋";
  };

  const getAchievementIcon = (type) => {
    const icons = {
      reporter: "🏆",
      resolver: "✅",
      speed: "⚡",
      community: "👥",
      impact: "🎯",
    };
    return icons[type] || "🏅";
  };

  const generateCategoryPreferences = (reports) => {
    if (!reports || reports.length === 0) return [];

    const categoryCount = {};
    reports.forEach((report) => {
      const category = report.issueType || "other";
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const total = reports.length;
    return Object.entries(categoryCount)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / total) * 100),
        icon: getCategoryIcon(category),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 categories
  };

  const generateAchievements = (reports) => {
    const achievements = [];
    const resolvedCount = reports.filter((r) => r.status === "resolved").length;
    const totalReports = reports.length;

    if (totalReports >= 1) {
      achievements.push({
        id: 1,
        title: "First Reporter",
        description: "Submitted your first civic report",
        icon: getAchievementIcon("reporter"),
        earned: true,
        earnedDate: reports[0]?.submittedAt,
      });
    }

    if (totalReports >= 5) {
      achievements.push({
        id: 2,
        title: "Community Champion",
        description: "Submitted 5+ reports",
        icon: getAchievementIcon("community"),
        earned: true,
        earnedDate: new Date().toISOString(),
      });
    }

    if (resolvedCount >= 1) {
      achievements.push({
        id: 3,
        title: "Problem Solver",
        description: "Had your first report resolved",
        icon: getAchievementIcon("resolver"),
        earned: true,
        earnedDate: reports.find((r) => r.status === "resolved")?.resolvedAt,
      });
    }

    return achievements;
  };

  const getDemoUserData = () => ({
    profile: {
      name: "Demo User",
      email: "demo@civiceye.com",
      location: "Bengaluru, Karnataka",
      ward: "Ward 184 - HSR Layout",
      pincode: "560102",
      joinedDate: new Date().toISOString(),
      citizenId: "CVE-USR-DEMO",
      phone: "+91 98765 43210",
    },
    statistics: {
      totalReports: 0,
      resolved: 0,
      pending: 0,
      inProgress: 0,
      avgResolutionTime: "N/A",
      impactScore: 0,
      communityRank: "#--",
    },
    recentReports: [],
    achievements: [],
    categoryPreferences: [],
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "resolved":
        return "#10b981";
      case "in-progress":
        return "#f59e0b";
      case "pending":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "resolved":
        return <CheckCircle size={14} />;
      case "in-progress":
        return <Clock size={14} />;
      case "pending":
        return <AlertTriangle size={14} />;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Unknown date";
    }
  };

  if (loading) {
    return (
      <div className="civic-page">
        <div className="civic-loading-container">
          <div className="civic-spinner"></div>
          <p className="civic-loading-text">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="civic-page">
        <div className="civic-error-container">
          <div className="civic-error-icon">⚠️</div>
          <h2 className="civic-error-title">Unable to Load Profile</h2>
          <p className="civic-error-message">{error}</p>
          <button onClick={fetchUserData} className="civic-retry-button">
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Safe check for userData
  if (!userData) {
    return (
      <div className="civic-page">
        <div className="civic-error-container">
          <div className="civic-error-icon">⚠️</div>
          <h2 className="civic-error-title">No Profile Data</h2>
          <p className="civic-error-message">
            Unable to load profile information
          </p>
          <button onClick={fetchUserData} className="civic-retry-button">
            <RefreshCw size={16} />
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="civic-page">
      {/* Enhanced Profile Header */}
      <div className="civic-profile-header-enhanced">
        <div className="civic-profile-banner">
          <div className="civic-profile-main-info">
            <div className="civic-profile-avatar-large">
              <div className="civic-avatar-placeholder-large">
                {userData.profile.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="civic-profile-status-dot"></div>
            </div>
            <div className="civic-profile-details">
              <h1 className="civic-profile-name-large">
                {userData.profile.name}
              </h1>
              <p className="civic-profile-email">{userData.profile.email}</p>
              <div className="civic-profile-location-info">
                <MapPin size={14} />
                <span>{userData.profile.location}</span>
              </div>
              <div className="civic-profile-member-since">
                <Calendar size={14} />
                <span>
                  Member since {formatDate(userData.profile.joinedDate)}
                </span>
              </div>
            </div>
          </div>
          <div className="civic-profile-quick-stats">
            <div className="civic-quick-stat-item">
              <div className="civic-quick-stat-number">
                {userData.statistics.impactScore}
              </div>
              <div className="civic-quick-stat-label">Impact Score</div>
            </div>
            <div className="civic-quick-stat-item">
              <div className="civic-quick-stat-number">
                {userData.statistics.communityRank}
              </div>
              <div className="civic-quick-stat-label">Community Rank</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="civic-profile-tabs">
        {["overview", "reports", "achievements"].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`civic-profile-tab ${
              selectedTab === tab ? "active" : ""
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {selectedTab === "overview" && (
        <>
          {/* Enhanced Impact Statistics */}
          <div className="civic-section">
            <div className="civic-section-header">
              <h2 className="civic-section-title">Your Civic Impact</h2>
              <p className="civic-section-subtitle">
                Making a difference in your community
              </p>
            </div>
            <div className="civic-impact-grid">
              <div className="civic-impact-card civic-impact-card-primary">
                <div className="civic-impact-card-icon">📊</div>
                <div className="civic-impact-card-content">
                  <div className="civic-impact-card-number">
                    {userData.statistics.totalReports}
                  </div>
                  <div className="civic-impact-card-label">Total Reports</div>
                  <div className="civic-impact-card-sublabel">
                    Issues reported to authorities
                  </div>
                </div>
              </div>
              <div className="civic-impact-card civic-impact-card-success">
                <div className="civic-impact-card-icon">✅</div>
                <div className="civic-impact-card-content">
                  <div className="civic-impact-card-number">
                    {userData.statistics.resolved}
                  </div>
                  <div className="civic-impact-card-label">Resolved</div>
                  <div className="civic-impact-card-sublabel">
                    Successfully addressed
                  </div>
                </div>
              </div>
              <div className="civic-impact-card civic-impact-card-warning">
                <div className="civic-impact-card-icon">⏰</div>
                <div className="civic-impact-card-content">
                  <div className="civic-impact-card-number">
                    {userData.statistics.inProgress}
                  </div>
                  <div className="civic-impact-card-label">In Progress</div>
                  <div className="civic-impact-card-sublabel">
                    Being worked on
                  </div>
                </div>
              </div>
              <div className="civic-impact-card civic-impact-card-danger">
                <div className="civic-impact-card-icon">📋</div>
                <div className="civic-impact-card-content">
                  <div className="civic-impact-card-number">
                    {userData.statistics.pending}
                  </div>
                  <div className="civic-impact-card-label">Pending</div>
                  <div className="civic-impact-card-sublabel">
                    Awaiting response
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Preferences - Safe check */}
          {userData.categoryPreferences &&
            userData.categoryPreferences.length > 0 && (
              <div className="civic-section">
                <div className="civic-section-header">
                  <h2 className="civic-section-title">
                    Your Reporting Patterns
                  </h2>
                  <p className="civic-section-subtitle">
                    Most reported issue categories
                  </p>
                </div>
                <div className="civic-category-preferences">
                  {userData.categoryPreferences.map((category, index) => (
                    <div key={index} className="civic-preference-item">
                      <div className="civic-preference-info">
                        <span className="civic-preference-icon">
                          {category.icon}
                        </span>
                        <span className="civic-preference-name">
                          {category.category}
                        </span>
                        <span className="civic-preference-count">
                          {category.count} reports
                        </span>
                      </div>
                      <div className="civic-preference-bar">
                        <div
                          className="civic-preference-fill"
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                      <span className="civic-preference-percentage">
                        {category.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </>
      )}

      {selectedTab === "reports" && (
        <div className="civic-section">
          <div className="civic-section-header">
            <h2 className="civic-section-title">Your Recent Reports</h2>
            <p className="civic-section-subtitle">
              Track your submitted issues
            </p>
          </div>
          {userData.recentReports && userData.recentReports.length > 0 ? (
            <div className="civic-user-reports-list">
              {userData.recentReports.map((report) => (
                <div key={report.id} className="civic-user-report-card">
                  <div className="civic-user-report-header">
                    <div className="civic-user-report-category">
                      <span className="civic-user-report-icon">
                        {report.categoryIcon}
                      </span>
                      <span className="civic-user-report-category-name">
                        {report.category}
                      </span>
                    </div>
                    <div
                      className="civic-user-report-status"
                      style={{ backgroundColor: getStatusColor(report.status) }}
                    >
                      {getStatusIcon(report.status)}
                      <span>{report.status.replace("-", " ")}</span>
                    </div>
                  </div>

                  <h3 className="civic-user-report-title">{report.title}</h3>

                  <div className="civic-user-report-meta">
                    <div className="civic-user-report-ticket">
                      <span className="civic-user-report-ticket-label">
                        Ticket:
                      </span>
                      <span className="civic-user-report-ticket-number">
                        {report.ticketNumber}
                      </span>
                    </div>
                    <div className="civic-user-report-date">
                      Submitted: {formatDate(report.submittedDate)}
                    </div>
                    {report.location && (
                      <div className="civic-user-report-location">
                        <MapPin size={12} />
                        <span>{report.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="civic-empty-state">
              <div className="civic-empty-icon">📝</div>
              <h3 className="civic-empty-title">No Reports Yet</h3>
              <p className="civic-empty-message">
                Start making a difference by reporting your first civic issue!
              </p>
            </div>
          )}
        </div>
      )}

      {selectedTab === "achievements" && (
        <div className="civic-section">
          <div className="civic-section-header">
            <h2 className="civic-section-title">Your Achievements</h2>
            <p className="civic-section-subtitle">
              Badges earned for civic contribution
            </p>
          </div>
          {userData.achievements && userData.achievements.length > 0 ? (
            <div className="civic-achievements-grid">
              {userData.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`civic-achievement-card ${
                    achievement.earned ? "earned" : "locked"
                  }`}
                >
                  <div className="civic-achievement-icon">
                    {achievement.icon}
                  </div>
                  <div className="civic-achievement-content">
                    <h3 className="civic-achievement-title">
                      {achievement.title}
                    </h3>
                    <p className="civic-achievement-description">
                      {achievement.description}
                    </p>
                    {achievement.earned && achievement.earnedDate && (
                      <div className="civic-achievement-earned">
                        Earned: {formatDate(achievement.earnedDate)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="civic-empty-state">
              <div className="civic-empty-icon">🏆</div>
              <h3 className="civic-empty-title">No Achievements Yet</h3>
              <p className="civic-empty-message">
                Submit reports and engage with the community to earn badges!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
