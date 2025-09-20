import React, { useState } from "react";
import {
  Calendar,
  MapPin,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

function ProfilePage() {
  const [selectedTab, setSelectedTab] = useState("overview");

  // Pilot user data
  const userData = {
    profile: {
      name: "Rajesh Kumar",
      email: "rajesh.kumar@civiceye.com",
      location: "HSR Layout, Bengaluru",
      ward: "Ward 184 - HSR Layout",
      pincode: "560102",
      joinedDate: "2024-08-15T10:30:00",
      citizenId: "CVE-USR-240815-1001",
      phone: "+91 98765 43210",
    },
    statistics: {
      totalReports: 12,
      resolved: 8,
      pending: 2,
      inProgress: 2,
      avgResolutionTime: "2.3 days",
      impactScore: 78,
      communityRank: "#23",
    },
    recentReports: [
      {
        id: 1,
        ticketNumber: "CVE-240918-007",
        title: "Broken Streetlight - 27th Main Road",
        category: "streetlight",
        categoryIcon: "💡",
        status: "resolved",
        submittedDate: "2024-09-18T14:30:00",
        resolvedDate: "2024-09-20T09:15:00",
        resolutionTime: "1.8 days",
      },
      {
        id: 2,
        ticketNumber: "CVE-240916-008",
        title: "Garbage Collection Delay",
        category: "garbage",
        categoryIcon: "🗑️",
        status: "in-progress",
        submittedDate: "2024-09-16T08:45:00",
        estimatedResolution: "2024-09-21T17:00:00",
      },
      {
        id: 3,
        ticketNumber: "CVE-240914-009",
        title: "Water Pipeline Leak",
        category: "water",
        categoryIcon: "💧",
        status: "resolved",
        submittedDate: "2024-09-14T11:20:00",
        resolvedDate: "2024-09-15T16:30:00",
        resolutionTime: "1.2 days",
      },
      {
        id: 4,
        ticketNumber: "CVE-240912-010",
        title: "Road Pothole Near Sony World",
        category: "pothole",
        categoryIcon: "🕳️",
        status: "pending",
        submittedDate: "2024-09-12T16:15:00",
      },
    ],
    achievements: [
      {
        id: 1,
        title: "Community Champion",
        description: "Reported 10+ issues that helped improve the community",
        icon: "🏆",
        earnedDate: "2024-09-15",
        points: 100,
      },
      {
        id: 2,
        title: "Quick Reporter",
        description: "First to report 3 critical issues in your area",
        icon: "⚡",
        earnedDate: "2024-09-10",
        points: 75,
      },
      {
        id: 3,
        title: "Resolution Helper",
        description: "80% of your reports were successfully resolved",
        icon: "✅",
        earnedDate: "2024-09-08",
        points: 50,
      },
    ],
    categoryPreferences: [
      { category: "streetlight", count: 4, percentage: 33, icon: "💡" },
      { category: "garbage", count: 3, percentage: 25, icon: "🗑️" },
      { category: "water", count: 2, percentage: 17, icon: "💧" },
      { category: "pothole", count: 2, percentage: 17, icon: "🕳️" },
      { category: "traffic", count: 1, percentage: 8, icon: "🚦" },
    ],
  };

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
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

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

          {/* Category Preferences */}
          <div className="civic-section">
            <div className="civic-section-header">
              <h2 className="civic-section-title">Your Reporting Patterns</h2>
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
                  {report.resolvedDate && (
                    <div className="civic-user-report-resolution">
                      <CheckCircle size={12} />
                      <span>Resolved in {report.resolutionTime}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
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
          <div className="civic-achievements-grid">
            {userData.achievements.map((achievement) => (
              <div key={achievement.id} className="civic-achievement-card">
                <div className="civic-achievement-icon">{achievement.icon}</div>
                <div className="civic-achievement-content">
                  <h3 className="civic-achievement-title">
                    {achievement.title}
                  </h3>
                  <p className="civic-achievement-description">
                    {achievement.description}
                  </p>
                  <div className="civic-achievement-meta">
                    <span className="civic-achievement-date">
                      Earned on {formatDate(achievement.earnedDate)}
                    </span>
                    <span className="civic-achievement-points">
                      +{achievement.points} points
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
