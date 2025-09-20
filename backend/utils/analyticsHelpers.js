// Analytics and reporting utilities for CivicEye

// Get comprehensive analytics
function getAnalytics(reports, options = {}) {
  const { period, department, ward } = options;

  // Filter reports by period
  let filteredReports = reports;
  if (period) {
    const periodMs = period === '7d' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - periodMs);
    filteredReports = reports.filter(r => new Date(r.createdAt) >= cutoffDate);
  }

  // Filter by department/ward if specified
  if (department) {
    filteredReports = filteredReports.filter(r => r.assignedDepartment === department);
  }
  if (ward) {
    filteredReports = filteredReports.filter(r => r.location?.ward === ward);
  }

  // Calculate analytics
  const total = filteredReports.length;
  const statusBreakdown = getStatusBreakdown(filteredReports);
  const categoryBreakdown = getCategoryBreakdown(filteredReports);
  const priorityBreakdown = getPriorityBreakdown(filteredReports);
  const resolutionMetrics = getResolutionMetrics(filteredReports);

  return {
    summary: {
      totalReports: total,
      resolved: statusBreakdown.resolved || 0,
      pending: statusBreakdown.pending || 0,
      inProgress: statusBreakdown['in-progress'] || 0,
      resolutionRate: total > 0 ? Math.round((statusBreakdown.resolved / total) * 100) : 0
    },
    breakdown: {
      byStatus: statusBreakdown,
      byCategory: categoryBreakdown,
      byPriority: priorityBreakdown
    },
    performance: resolutionMetrics,
    trends: getTrendData(filteredReports)
  };
}

function getStatusBreakdown(reports) {
  return reports.reduce((acc, report) => {
    acc[report.status] = (acc[report.status] || 0) + 1;
    return acc;
  }, {});
}

function getCategoryBreakdown(reports) {
  return reports.reduce((acc, report) => {
    acc[report.category] = (acc[report.category] || 0) + 1;
    return acc;
  }, {});
}

function getPriorityBreakdown(reports) {
  return reports.reduce((acc, report) => {
    acc[report.priority] = (acc[report.priority] || 0) + 1;
    return acc;
  }, {});
}

function getResolutionMetrics(reports) {
  const resolved = reports.filter(r => r.status === 'resolved');

  if (resolved.length === 0) {
    return { avgResolutionTime: 0, fastestResolution: 0, slowestResolution: 0 };
  }

  const resolutionTimes = resolved.map(r => {
    const created = new Date(r.createdAt);
    const updated = new Date(r.updatedAt);
    return updated - created;
  });

  return {
    avgResolutionTime: Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length / (1000 * 60 * 60)), // hours
    fastestResolution: Math.round(Math.min(...resolutionTimes) / (1000 * 60 * 60)),
    slowestResolution: Math.round(Math.max(...resolutionTimes) / (1000 * 60 * 60))
  };
}

function getTrendData(reports) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toISOString().split('T')[0],
      count: 0
    };
  }).reverse();

  reports.forEach(report => {
    const reportDate = new Date(report.createdAt).toISOString().split('T')[0];
    const dayData = last7Days.find(d => d.date === reportDate);
    if (dayData) dayData.count++;
  });

  return last7Days;
}

function getHotspots(reports, options = {}) {
  const locationCounts = {};

  reports.forEach(report => {
    if (report.location?.latitude && report.location?.longitude) {
      // Round coordinates to create location clusters
      const lat = Math.round(report.location.latitude * 1000) / 1000;
      const lng = Math.round(report.location.longitude * 1000) / 1000;
      const key = `${lat},${lng}`;

      if (!locationCounts[key]) {
        locationCounts[key] = {
          latitude: lat,
          longitude: lng,
          count: 0,
          reports: [],
          categories: {}
        };
      }

      locationCounts[key].count++;
      locationCounts[key].reports.push(report.id);
      locationCounts[key].categories[report.category] =
        (locationCounts[key].categories[report.category] || 0) + 1;
    }
  });

  return Object.values(locationCounts)
    .filter(hotspot => hotspot.count >= 2)
    .sort((a, b) => b.count - a.count);
}

function getDepartmentStats(reports) {
  const departments = {};

  reports.forEach(report => {
    const dept = report.assignedDepartment || 'Unassigned';

    if (!departments[dept]) {
      departments[dept] = {
        name: dept,
        total: 0,
        resolved: 0,
        pending: 0,
        inProgress: 0,
        avgResolutionTime: 0
      };
    }

    departments[dept].total++;

    if (report.status === 'resolved') {
      departments[dept].resolved++;
    } else if (report.status === 'pending') {
      departments[dept].pending++;
    } else if (report.status === 'in-progress') {
      departments[dept].inProgress++;
    }
  });

  // Calculate performance metrics
  Object.values(departments).forEach(dept => {
    dept.resolutionRate = dept.total > 0 ? Math.round((dept.resolved / dept.total) * 100) : 0;
    dept.efficiency = calculateDepartmentEfficiency(dept);
  });

  return Object.values(departments).sort((a, b) => b.total - a.total);
}

function calculateDepartmentEfficiency(dept) {
  if (dept.total === 0) return 0;

  const resolutionScore = (dept.resolved / dept.total) * 70;
  const progressScore = (dept.inProgress / dept.total) * 20;
  const pendingPenalty = (dept.pending / dept.total) * 10;

  return Math.max(0, Math.round(resolutionScore + progressScore - pendingPenalty));
}

module.exports = {
  getAnalytics,
  getHotspots,
  getDepartmentStats,
  getStatusBreakdown,
  getCategoryBreakdown,
  getPriorityBreakdown,
  getResolutionMetrics,
  getTrendData,
  calculateDepartmentEfficiency
};