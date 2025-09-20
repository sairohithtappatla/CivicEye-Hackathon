const express = require('express');
const firebaseService = require('../services/firebaseService');
const router = express.Router();

// Save FCM token for user
router.post('/fcm-token', async (req, res) => {
  try {
    const { fcmToken, userEmail, deviceInfo } = req.body;

    if (!fcmToken || !userEmail) {
      return res.status(400).json({
        success: false,
        error: 'FCM token and user email are required'
      });
    }

    const result = await firebaseService.saveUserFCMToken(userEmail, fcmToken, deviceInfo);

    if (result.success) {
      res.json({
        success: true,
        message: 'FCM token saved successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to save FCM token'
      });
    }

  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 🔥 USER DASHBOARD
router.get('/dashboard/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // Get user profile
    const profileResult = await firebaseService.getUserProfile(email);
    if (!profileResult.success) {
      // Create default profile for MVP
      const defaultProfile = {
        name: email.split('@')[0],
        email,
        role: email.includes('admin') ? 'admin' : 'citizen',
        location: { ward: 'Ward-1', pincode: '560001' },
        createdAt: new Date().toISOString()
      };

      await firebaseService.saveUserProfile(email, defaultProfile);
      const profileResult = await firebaseService.getUserProfile(email);
    }

    // Get user's reports
    const reportsResult = await firebaseService.getReports({ reportedBy: email });
    const userReports = reportsResult.success ? reportsResult.reports : [];

    // Calculate user statistics
    const dashboard = {
      profile: profileResult.profile,
      statistics: {
        totalReports: userReports.length,
        resolved: userReports.filter(r => r.status === 'resolved').length,
        pending: userReports.filter(r => r.status === 'pending').length,
        inProgress: userReports.filter(r => r.status === 'in-progress').length,
        avgResolutionTime: calculateUserAvgResolution(userReports),
        lastReport: userReports.length > 0 ? userReports[0].createdAt : null
      },
      recentReports: userReports
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(r => ({
          ticketNumber: r.ticketNumber,
          category: r.category,
          status: r.status,
          priority: r.priority,
          createdAt: r.createdAt,
          location: r.location?.address
        })),
      achievements: calculateUserAchievements(userReports, profileResult.profile),
      nearbyActivity: await getNearbyActivity(email),
      recommendations: getUserRecommendations(userReports)
    };

    res.json({
      success: true,
      dashboard
    });

  } catch (error) {
    console.error('❌ Error fetching user dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user dashboard'
    });
  }
});

// 🔥 SMART REPORT SUGGESTIONS
router.get('/suggestions/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { latitude, longitude } = req.query;

    const suggestions = {
      quickActions: [
        { category: 'pothole', label: 'Report Road Damage', icon: '🕳️', priority: 'high' },
        { category: 'garbage', label: 'Garbage Issue', icon: '🗑️', priority: 'medium' },
        { category: 'streetlight', label: 'Street Light Problem', icon: '💡', priority: 'low' },
        { category: 'water', label: 'Water Issue', icon: '💧', priority: 'high' }
      ],
      nearbyIssues: await getNearbyIssues(latitude, longitude),
      trending: await getTrendingCategories(),
      userPreferences: await getUserPreferences(email)
    };

    res.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('❌ Error fetching suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suggestions'
    });
  }
});

// 🔥 USER PREFERENCES UPDATE
router.put('/preferences/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { notifications, categories, location, privacy } = req.body;

    const preferences = {
      notifications: notifications || { email: true, push: true, sms: false },
      categories: categories || [],
      location: location || {},
      privacy: privacy || { shareLocation: true, anonymous: false },
      updatedAt: new Date().toISOString()
    };

    const result = await firebaseService.updateUserProfile(email, { preferences });

    if (result.success) {
      res.json({
        success: true,
        message: 'Preferences updated successfully',
        preferences
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update preferences'
      });
    }

  } catch (error) {
    console.error('❌ Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Helper functions
function calculateUserAvgResolution(reports) {
  const resolved = reports.filter(r => r.status === 'resolved');
  if (resolved.length === 0) return 0;

  const totalTime = resolved.reduce((sum, report) => {
    const created = new Date(report.createdAt);
    const updated = new Date(report.updatedAt);
    return sum + (updated - created);
  }, 0);

  return Math.round(totalTime / resolved.length / (1000 * 60 * 60)); // Hours
}

function calculateUserAchievements(reports, profile) {
  const achievements = [];

  if (reports.length >= 5) {
    achievements.push({
      title: 'Active Citizen',
      description: 'Submitted 5+ reports',
      icon: '🏆',
      earned: true
    });
  }

  const resolved = reports.filter(r => r.status === 'resolved').length;
  if (resolved >= 3) {
    achievements.push({
      title: 'Problem Solver',
      description: '3+ issues resolved',
      icon: '✅',
      earned: true
    });
  }

  if (profile.stats?.reputationScore > 150) {
    achievements.push({
      title: 'Trusted Reporter',
      description: 'High reputation score',
      icon: '⭐',
      earned: true
    });
  }

  return achievements;
}

async function getNearbyActivity(email) {
  try {
    // For MVP, return mock nearby activity
    return {
      recentReports: 3,
      resolvedIssues: 5,
      activeUsers: 12,
      commonCategories: ['pothole', 'streetlight', 'garbage']
    };
  } catch (error) {
    return { recentReports: 0, resolvedIssues: 0, activeUsers: 0, commonCategories: [] };
  }
}

function getUserRecommendations(reports) {
  const recommendations = [];

  if (reports.length === 0) {
    recommendations.push({
      type: 'getting_started',
      title: 'Submit your first report',
      description: 'Help improve your community by reporting local issues',
      action: 'Create Report'
    });
  }

  const categories = [...new Set(reports.map(r => r.category))];
  if (categories.length < 3) {
    recommendations.push({
      type: 'diversify',
      title: 'Explore more categories',
      description: 'Try reporting different types of civic issues',
      action: 'Browse Categories'
    });
  }

  return recommendations;
}

async function getNearbyIssues(latitude, longitude) {
  if (!latitude || !longitude) return [];

  // For MVP, return mock nearby issues
  return [
    { category: 'pothole', distance: '0.2 km', status: 'pending' },
    { category: 'streetlight', distance: '0.5 km', status: 'in-progress' }
  ];
}

async function getTrendingCategories() {
  return [
    { category: 'pothole', reports: 15, trend: '+20%' },
    { category: 'water', reports: 8, trend: '+5%' },
    { category: 'garbage', reports: 12, trend: '-10%' }
  ];
}

async function getUserPreferences(email) {
  try {
    const result = await firebaseService.getUserProfile(email);
    return result.success ? result.profile.preferences || {} : {};
  } catch (error) {
    return {};
  }
}

module.exports = router;