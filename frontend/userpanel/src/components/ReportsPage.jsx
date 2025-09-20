import React, { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Filter,
} from "lucide-react";
import { reportAPI } from "../services/api";

function ReportsPage() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch reports from backend
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await reportAPI.getAllReports();

      if (response.data.success) {
        setReports(response.data.reports || []);
      } else {
        throw new Error(response.data.message || "Failed to fetch reports");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      setError(error.message);

      // Fallback to pilot data if backend fails
      const fallbackReports = [
        {
          _id: "1",
          ticketNumber: "CVE-240920-001",
          title: "Broken Street Light on Brigade Road",
          issueType: "streetlight",
          status: "resolved",
          priority: "medium",
          location: "Brigade Road, Near Forum Mall, Bengaluru",
          coordinates: { latitude: 12.9716, longitude: 77.5946 },
          description:
            "Street light pole #BRG-401 has been non-functional for 3 days causing safety concerns during night hours.",
          submittedAt: "2024-09-18T14:30:00Z",
          resolvedAt: "2024-09-20T09:15:00Z",
          department: "BESCOM",
          submittedBy: { name: "Citizen", email: "citizen@civiceye.com" },
        },
        // Add more fallback data...
      ];
      setReports(fallbackReports);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchReports();
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
        return <CheckCircle size={16} />;
      case "in-progress":
        return <Clock size={16} />;
      case "pending":
        return <AlertCircle size={16} />;
      default:
        return <Eye size={16} />;
    }
  };

  const getCategoryIcon = (issueType) => {
    const icons = {
      streetlight: "💡",
      garbage: "🗑️",
      pothole: "🕳️",
      water: "💧",
      traffic: "🚦",
      drainage: "🌊",
      construction: "🏗️",
      parks: "🌳",
    };
    return icons[issueType] || "📋";
  };

  const filteredReports = reports.filter((report) => {
    if (selectedFilter === "all") return true;
    return report.status === selectedFilter;
  });

  if (loading) {
    return (
      <div className="civic-page">
        <div className="civic-loading-container">
          <div className="civic-spinner"></div>
          <p>Loading community reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="civic-page">
      {/* Header with Refresh */}
      <div className="civic-page-header">
        <div className="civic-reports-header-content">
          <div>
            <h1 className="civic-page-title">Community Reports</h1>
            <p className="civic-page-subtitle">
              Track and monitor civic issues in your area
            </p>
          </div>
          <div className="civic-reports-actions">
            <button
              onClick={handleRefresh}
              className="civic-refresh-button"
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <div className="civic-reports-stats">
              <div className="civic-mini-stat">
                <span className="civic-mini-stat-number">{reports.length}</span>
                <span className="civic-mini-stat-label">Total</span>
              </div>
              <div className="civic-mini-stat">
                <span className="civic-mini-stat-number">
                  {reports.filter((r) => r.status === "resolved").length}
                </span>
                <span className="civic-mini-stat-label">Resolved</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="civic-section">
          <div className="civic-error-banner">
            <AlertCircle size={16} />
            <span>Using offline data. Check your connection and refresh.</span>
          </div>
        </div>
      )}

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
                  ? reports.length
                  : reports.filter((r) => r.status === filter).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="civic-section">
        <div className="civic-reports-list">
          {filteredReports.length === 0 ? (
            <div className="civic-empty-state">
              <div className="civic-empty-icon">📋</div>
              <h3>No reports found</h3>
              <p>No reports match your current filter criteria.</p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report._id || report.id}
                className="civic-report-card"
                onClick={() => setSelectedReport(report)}
              >
                <div className="civic-report-card-header">
                  <div className="civic-report-card-title-area">
                    <div className="civic-report-category-badge">
                      <span className="civic-report-category-icon">
                        {getCategoryIcon(report.issueType)}
                      </span>
                      <span className="civic-report-category-text">
                        {report.issueType}
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
                </div>

                <div className="civic-report-card-content">
                  <h3 className="civic-report-card-title">
                    {report.title || `${report.issueType} Issue`}
                  </h3>
                  <p className="civic-report-card-description">
                    {report.description}
                  </p>

                  <div className="civic-report-card-meta">
                    <div className="civic-report-meta-item">
                      <MapPin size={12} />
                      <span>{report.location || "Location not available"}</span>
                    </div>
                    <div className="civic-report-meta-item">
                      <Calendar size={12} />
                      <span>
                        {new Date(report.submittedAt).toLocaleDateString(
                          "en-IN"
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="civic-report-card-footer">
                    <div className="civic-report-ticket">
                      <span className="civic-report-ticket-label">Ticket:</span>
                      <span className="civic-report-ticket-number">
                        {report.ticketNumber || report._id?.slice(-6)}
                      </span>
                    </div>
                    <div className="civic-report-department">
                      {report.department || "Municipal Corp"}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
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
              <h2 className="civic-modal-title">
                {selectedReport.title || `${selectedReport.issueType} Issue`}
              </h2>
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
                  <span>{getCategoryIcon(selectedReport.issueType)}</span>
                  <span>{selectedReport.issueType}</span>
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
                    {selectedReport.location || "Location not provided"}
                  </span>
                </div>

                {selectedReport.coordinates && (
                  <div className="civic-modal-detail-item">
                    <span className="civic-modal-detail-label">
                      Coordinates:
                    </span>
                    <span className="civic-modal-detail-value">
                      {selectedReport.coordinates.latitude?.toFixed(6)},{" "}
                      {selectedReport.coordinates.longitude?.toFixed(6)}
                    </span>
                  </div>
                )}

                <div className="civic-modal-detail-item">
                  <span className="civic-modal-detail-label">Submitted:</span>
                  <span className="civic-modal-detail-value">
                    {new Date(selectedReport.submittedAt).toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>

                {selectedReport.resolvedAt && (
                  <div className="civic-modal-detail-item">
                    <span className="civic-modal-detail-label">Resolved:</span>
                    <span className="civic-modal-detail-value">
                      {new Date(selectedReport.resolvedAt).toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  </div>
                )}

                <div className="civic-modal-detail-item">
                  <span className="civic-modal-detail-label">Ticket ID:</span>
                  <span className="civic-modal-detail-value">
                    {selectedReport.ticketNumber || selectedReport._id}
                  </span>
                </div>
              </div>

              {selectedReport.photo && (
                <div className="civic-modal-photo">
                  <span className="civic-modal-detail-label">
                    Evidence Photo:
                  </span>
                  <img
                    src={selectedReport.photo}
                    alt="Report evidence"
                    className="civic-modal-photo-img"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
