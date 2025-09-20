const crypto = require('crypto');

// Generate unique report ID
function generateReportId() {
  return crypto.randomBytes(8).toString('hex');
}

// Check for duplicate reports
function checkDuplicates(newReport, existingReports) {
  const LOCATION_THRESHOLD = 0.001; // ~100 meters
  const TIME_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  const duplicates = existingReports.filter(existing => {
    // Skip resolved reports
    if (existing.status === 'resolved' || existing.status === 'closed') {
      return false;
    }

    // Check category match
    if (existing.category !== newReport.category) {
      return false;
    }

    // Check location proximity
    const latDiff = Math.abs(existing.location.latitude - newReport.location.latitude);
    const lngDiff = Math.abs(existing.location.longitude - newReport.location.longitude);

    if (latDiff > LOCATION_THRESHOLD || lngDiff > LOCATION_THRESHOLD) {
      return false;
    }

    // Check time proximity
    const timeDiff = Date.now() - new Date(existing.createdAt).getTime();
    if (timeDiff > TIME_THRESHOLD) {
      return false;
    }

    return true;
  });

  if (duplicates.length > 0) {
    return {
      isDuplicate: true,
      existingReport: duplicates[0],
      score: calculateSimilarityScore(newReport, duplicates[0])
    };
  }

  return { isDuplicate: false };
}

// Calculate similarity score between reports
function calculateSimilarityScore(report1, report2) {
  let score = 0;

  // Category match (40%)
  if (report1.category === report2.category) {
    score += 40;
  }

  // Location proximity (30%)
  const distance = calculateDistance(
    report1.location.latitude, report1.location.longitude,
    report2.location.latitude, report2.location.longitude
  );

  if (distance < 50) score += 30; // Within 50 meters
  else if (distance < 100) score += 20; // Within 100 meters
  else if (distance < 200) score += 10; // Within 200 meters

  // Description similarity (30%)
  const descSimilarity = calculateTextSimilarity(report1.description, report2.description);
  score += Math.floor(descSimilarity * 30);

  return Math.min(score, 100);
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Simple text similarity calculation
function calculateTextSimilarity(text1, text2) {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);

  const allWords = new Set([...words1, ...words2]);
  const intersection = words1.filter(word => words2.includes(word));

  return intersection.length / allWords.size;
}

// Calculate priority based on content and context
function calculatePriority(report) {
  let priorityScore = 50; // Base score

  // Critical keywords
  const criticalKeywords = [
    'emergency', 'urgent', 'dangerous', 'immediate', 'critical',
    'overflow', 'blocked', 'accident', 'fire', 'flood', 'broken'
  ];

  // High priority keywords
  const highKeywords = [
    'water', 'traffic', 'signal', 'main road', 'highway',
    'school', 'hospital', 'market', 'busy'
  ];

  // Medium priority keywords
  const mediumKeywords = [
    'repair', 'cleaning', 'maintenance', 'improvement'
  ];

  const description = report.description.toLowerCase();
  const title = report.title.toLowerCase();
  const fullText = `${title} ${description}`;

  // Check for critical keywords
  if (criticalKeywords.some(keyword => fullText.includes(keyword))) {
    priorityScore += 40;
  }

  // Check for high priority keywords
  if (highKeywords.some(keyword => fullText.includes(keyword))) {
    priorityScore += 25;
  }

  // Check for medium priority keywords
  if (mediumKeywords.some(keyword => fullText.includes(keyword))) {
    priorityScore += 10;
  }

  // Category-based priority adjustment
  const categoryPriority = {
    'water': 30,
    'traffic': 25,
    'streetlight': 15,
    'drainage': 20,
    'pothole': 10,
    'garbage': 5,
    'construction': 5
  };

  priorityScore += categoryPriority[report.category] || 0;

  // User-specified severity
  if (report.severity) {
    const severityBonus = {
      'critical': 30,
      'high': 20,
      'medium': 0,
      'low': -10
    };
    priorityScore += severityBonus[report.severity] || 0;
  }

  // Convert score to priority level
  if (priorityScore >= 80) return 'critical';
  if (priorityScore >= 65) return 'high';
  if (priorityScore >= 35) return 'medium';
  return 'low';
}

// Generate report analytics
function generateReportAnalytics(reports) {
  const analytics = {
    total: reports.length,
    byStatus: {},
    byCategory: {},
    byPriority: {},
    avgResolutionTime: 0,
    slaCompliance: 0
  };

  // Count by status
  reports.forEach(report => {
    analytics.byStatus[report.status] = (analytics.byStatus[report.status] || 0) + 1;
    analytics.byCategory[report.category] = (analytics.byCategory[report.category] || 0) + 1;
    analytics.byPriority[report.priority] = (analytics.byPriority[report.priority] || 0) + 1;
  });

  // Calculate average resolution time for resolved reports
  const resolvedReports = reports.filter(r => r.status === 'resolved');
  if (resolvedReports.length > 0) {
    const totalResolutionTime = resolvedReports.reduce((sum, report) => {
      const created = new Date(report.createdAt);
      const resolved = new Date(report.updatedAt);
      return sum + (resolved - created);
    }, 0);

    analytics.avgResolutionTime = totalResolutionTime / resolvedReports.length / (1000 * 60 * 60); // in hours
  }

  return analytics;
}

module.exports = {
  generateReportId,
  checkDuplicates,
  calculatePriority,
  calculateDistance,
  calculateSimilarityScore,
  generateReportAnalytics
};