import React, { useState, useEffect } from "react";
import { reportAPI } from "../services/api";

function RecentReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentReports();
  }, []);

  const fetchRecentReports = async () => {
    try {
      const response = await reportAPI.getAll({
        limit: 5,
        orderBy: "createdAt",
        order: "desc",
      });
      if (response.success) {
        setReports(response.data);
      }
    } catch (error) {
      console.error("Error fetching recent reports:", error);
      // Set mock data for demonstration
      setReports([
        {
          id: "mock-1",
          issueType: "streetlight",
          description: "Street light not working on Main Road",
          status: "pending",
          createdAt: new Date().toISOString(),
        },
        {
          id: "mock-2",
          issueType: "garbage",
          description: "Garbage not collected for 3 days",
          status: "resolved",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="civic-section">
        <div className="civic-loading-container">
          <div className="civic-spinner"></div>
          <p className="civic-loading-text">Loading recent reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="civic-section">
      <div className="civic-section-header">
        <h2 className="civic-section-title">Recent Reports</h2>
        <p className="civic-section-subtitle">
          Latest civic issues in your area
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="civic-empty-state">
          <div className="civic-empty-icon">📋</div>
          <p className="civic-empty-text">No recent reports found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-lg p-4 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium capitalize">
                  {report.issueType.replace("-", " ")}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    report.status === "resolved"
                      ? "bg-green-100 text-green-800"
                      : report.status === "in-progress"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {report.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {report.description.length > 80
                  ? `${report.description.substring(0, 80)}...`
                  : report.description}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(report.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecentReports;
