import React, { useState } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
} from "lucide-react";

function ReportsPage() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);

  // Pilot data with realistic Indian civic issues
  const pilotReports = [
    {
      id: 1,
      ticketNumber: "CVE-240920-001",
      title: "Broken Street Light on Brigade Road",
      category: "streetlight",
      categoryIcon: "💡",
      status: "resolved",
      priority: "medium",
      location: "Brigade Road, Near Forum Mall, Bengaluru",
      coordinates: "12.9716° N, 77.5946° E",
      submittedDate: "2024-09-18T14:30:00",
      resolvedDate: "2024-09-20T09:15:00",
      description:
        "Street light pole #BRG-401 has been non-functional for 3 days causing safety concerns during night hours.",
      department: "BESCOM",
      resolutionTime: "1.8 days",
      reportedBy: "citizen@civiceye.com",
    },
    {
      id: 2,
      ticketNumber: "CVE-240919-002",
      title: "Garbage Overflow Near HSR Layout",
      category: "garbage",
      categoryIcon: "🗑️",
      status: "in-progress",
      priority: "high",
      location: "27th Main Road, HSR Layout Sector 1",
      coordinates: "12.9081° N, 77.6476° E",
      submittedDate: "2024-09-19T08:45:00",
      estimatedResolution: "2024-09-21T17:00:00",
      description:
        "Large garbage accumulation blocking pedestrian walkway. Immediate attention required due to health hazards.",
      department: "BBMP Waste Management",
      reportedBy: "resident@civiceye.com",
    },
    {
      id: 3,
      ticketNumber: "CVE-240917-003",
      title: "Pothole on Outer Ring Road",
      category: "pothole",
      categoryIcon: "🕳️",
      status: "pending",
      priority: "high",
      location: "Outer Ring Road, Near Marathahalli Bridge",
      coordinates: "12.9591° N, 77.6974° E",
      submittedDate: "2024-09-17T16:20:00",
      description:
        "Deep pothole causing traffic congestion and vehicle damage. Approximately 2 feet wide and 8 inches deep.",
      department: "BBMP Roads",
      reportedBy: "commuter@civiceye.com",
    },
    {
      id: 4,
      ticketNumber: "CVE-240916-004",
      title: "Water Supply Disruption in Koramangala",
      category: "water",
      categoryIcon: "💧",
      status: "resolved",
      priority: "high",
      location: "5th Block, Koramangala, Near Sony World Signal",
      coordinates: "12.9352° N, 77.6245° E",
      submittedDate: "2024-09-16T07:30:00",
      resolvedDate: "2024-09-16T18:45:00",
      description:
        "Complete water supply cut-off affecting 200+ households. Emergency restoration needed.",
      department: "BWSSB",
      resolutionTime: "11.25 hours",
      reportedBy: "society@civiceye.com",
    },
    {
      id: 5,
      ticketNumber: "CVE-240915-005",
      title: "Traffic Signal Malfunction at Silk Board",
      category: "traffic",
      categoryIcon: "🚦",
      status: "in-progress",
      priority: "critical",
      location: "Silk Board Junction, Hosur Road",
      coordinates: "12.9116° N, 77.6229° E",
      submittedDate: "2024-09-15T11:15:00",
      estimatedResolution: "2024-09-21T14:00:00",
      description:
        "Main traffic signal not functioning during peak hours causing major traffic jams.",
      department: "Bengaluru Traffic Police",
      reportedBy: "traffic@civiceye.com",
    },
  ];

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
        return <CheckCircle size={16} />;
      case "in-progress":
        return <Clock size={16} />;
      case "pending":
        return <AlertCircle size={16} />;
      default:
        return <Eye size={16} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "#dc2626";
      case "high":
        return "#ea580c";
      case "medium":
        return "#d97706";
      case "low":
        return "#65a30d";
      default:
        return "#6b7280";
    }
  };

  const filteredReports = pilotReports.filter((report) => {
    if (selectedFilter === "all") return true;
    return report.status === selectedFilter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateTimeAgo = (dateString) => {
    const now = new Date();
    const reportDate = new Date(dateString);
    const diffTime = Math.abs(now - reportDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  return (
    <div className="civic-page">
      {/* Header */}
      <div className="civic-page-header">
        <div className="civic-reports-header-content">
          <div>
            <h1 className="civic-page-title">Community Reports</h1>
            <p className="civic-page-subtitle">
              Track and monitor civic issues in your area
            </p>
          </div>
          <div className="civic-reports-stats">
            <div className="civic-mini-stat">
              <span className="civic-mini-stat-number">
                {pilotReports.length}
              </span>
              <span className="civic-mini-stat-label">Total</span>
            </div>
            <div className="civic-mini-stat">
              <span className="civic-mini-stat-number">
                {pilotReports.filter((r) => r.status === "resolved").length}
              </span>
              <span className="civic-mini-stat-label">Resolved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="civic-section">
        <div className="civic-filter-tabs">
          {["all", "pending", "in-progress", "resolved"].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`civic-filter-tab ${
                selectedFilter === filter ? "active" : ""
              }`}
            >
              {filter === "all"
                ? "All Reports"
                : filter === "in-progress"
                ? "In Progress"
                : filter.charAt(0).toUpperCase() + filter.slice(1)}
              <span className="civic-filter-count">
                {filter === "all"
                  ? pilotReports.length
                  : pilotReports.filter((r) => r.status === filter).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="civic-section">
        <div className="civic-reports-list">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="civic-report-card"
              onClick={() => setSelectedReport(report)}
            >
              <div className="civic-report-card-header">
                <div className="civic-report-card-title-area">
                  <div className="civic-report-category-badge">
                    <span className="civic-report-category-icon">
                      {report.categoryIcon}
                    </span>
                    <span className="civic-report-category-text">
                      {report.category}
                    </span>
                  </div>
                  <div
                    className="civic-report-status-badge"
                    style={{ backgroundColor: getStatusColor(report.status) }}
                  >
                    {getStatusIcon(report.status)}
                    <span>{report.status.replace("-", " ")}</span>
                  </div>
                </div>
                <div
                  className="civic-report-priority-badge"
                  style={{ backgroundColor: getPriorityColor(report.priority) }}
                >
                  {report.priority}
                </div>
              </div>

              <div className="civic-report-card-content">
                <h3 className="civic-report-card-title">{report.title}</h3>
                <p className="civic-report-card-description">
                  {report.description}
                </p>

                <div className="civic-report-card-meta">
                  <div className="civic-report-meta-item">
                    <MapPin size={12} />
                    <span>{report.location}</span>
                  </div>
                  <div className="civic-report-meta-item">
                    <Calendar size={12} />
                    <span>{calculateTimeAgo(report.submittedDate)}</span>
                  </div>
                </div>

                <div className="civic-report-card-footer">
                  <div className="civic-report-ticket">
                    <span className="civic-report-ticket-label">Ticket:</span>
                    <span className="civic-report-ticket-number">
                      {report.ticketNumber}
                    </span>
                  </div>
                  <div className="civic-report-department">
                    {report.department}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div
          className="civic-modal-overlay"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="civic-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="civic-modal-header">
              <h2 className="civic-modal-title">{selectedReport.title}</h2>
              <button
                className="civic-modal-close"
                onClick={() => setSelectedReport(null)}
              >
                ×
              </button>
            </div>

            <div className="civic-modal-body">
              <div className="civic-modal-badges">
                <div className="civic-modal-category-badge">
                  <span>{selectedReport.categoryIcon}</span>
                  <span>{selectedReport.category}</span>
                </div>
                <div
                  className="civic-modal-status-badge"
                  style={{
                    backgroundColor: getStatusColor(selectedReport.status),
                  }}
                >
                  {getStatusIcon(selectedReport.status)}
                  <span>{selectedReport.status.replace("-", " ")}</span>
                </div>
              </div>

              <div className="civic-modal-details">
                <div className="civic-modal-detail-item">
                  <span className="civic-modal-detail-label">Description:</span>
                  <span className="civic-modal-detail-value">
                    {selectedReport.description}
                  </span>
                </div>
                <div className="civic-modal-detail-item">
                  <span className="civic-modal-detail-label">Location:</span>
                  <span className="civic-modal-detail-value">
                    {selectedReport.location}
                  </span>
                </div>
                <div className="civic-modal-detail-item">
                  <span className="civic-modal-detail-label">Coordinates:</span>
                  <span className="civic-modal-detail-value">
                    {selectedReport.coordinates}
                  </span>
                </div>
                <div className="civic-modal-detail-item">
                  <span className="civic-modal-detail-label">Department:</span>
                  <span className="civic-modal-detail-value">
                    {selectedReport.department}
                  </span>
                </div>
                <div className="civic-modal-detail-item">
                  <span className="civic-modal-detail-label">Submitted:</span>
                  <span className="civic-modal-detail-value">
                    {formatDate(selectedReport.submittedDate)}
                  </span>
                </div>
                {selectedReport.resolvedDate && (
                  <div className="civic-modal-detail-item">
                    <span className="civic-modal-detail-label">Resolved:</span>
                    <span className="civic-modal-detail-value">
                      {formatDate(selectedReport.resolvedDate)}
                    </span>
                  </div>
                )}
                {selectedReport.resolutionTime && (
                  <div className="civic-modal-detail-item">
                    <span className="civic-modal-detail-label">
                      Resolution Time:
                    </span>
                    <span className="civic-modal-detail-value">
                      {selectedReport.resolutionTime}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
