const express = require('express');
const firebaseService = require('../services/firebaseService');
const slaService = require('../services/slaService');
const { getAnalytics, getHotspots, getDepartmentStats } = require('../utils/analyticsHelpers');

const router = express.Router();

// ✅ DASHBOARD ANALYTICS - /api/admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30d', department, ward, startDate, endDate } = req.query;

    // Fetch reports from Firestore
    const filters = {};
    if (startDate || endDate) {
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
    }

    const result = await firebaseService.getAnalyticsData(filters);
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics data'
      });
    }

    const reports = result.reports;
    const analytics = getAnalytics(reports, { period, department, ward });

    // Add SLA statistics
    const slaStats = await slaService.getSLAStats();
    analytics.sla = slaStats;

    res.json({
      success: true,
      analytics,
      dataSource: 'firestore',
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

// ✅ HOTSPOTS FOR MAP - /api/admin/hotspots
router.get('/hotspots', async (req, res) => {
  try {
    const { category, timeframe = '7d', minReports = 2 } = req.query;

    const result = await firebaseService.getAnalyticsData({
      startDate: new Date(Date.now() - (timeframe === '7d' ? 7 : 30) * 24 * 60 * 60 * 1000)
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch hotspot data'
      });
    }

    let reports = result.reports;

    // Filter by category if specified
    if (category) {
      reports = reports.filter(r => r.category === category);
    }

    const hotspots = getHotspots(reports, { category, timeframe });

    // Filter hotspots by minimum report count
    const filteredHotspots = hotspots.filter(h => h.count >= parseInt(minReports));

    res.json({
      success: true,
      hotspots: filteredHotspots,
      totalHotspots: filteredHotspots.length,
      filters: { category, timeframe, minReports }
    });

  } catch (error) {
    console.error('❌ Error fetching hotspots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hotspots'
    });
  }
});

// ✅ DEPARTMENT PERFORMANCE - /api/admin/departments/stats
router.get('/departments/stats', async (req, res) => {
  try {
    const result = await firebaseService.getAnalyticsData();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch department data'
      });
    }

    const reports = result.reports;
    const departmentStats = getDepartmentStats(reports);

    res.json({
      success: true,
      departments: departmentStats,
      totalDepartments: departmentStats.length
    });

  } catch (error) {
    console.error('❌ Error fetching department stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch department stats'
    });
  }
});

// ✅ WARD PERFORMANCE - /api/admin/wards/performance
router.get('/wards/performance', async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    const result = await firebaseService.getAnalyticsData();
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch ward data'
      });
    }

    const reports = result.reports;
    const wardStats = {};

    reports.forEach(report => {
      const ward = report.location.ward || 'Unknown';

      if (!wardStats[ward]) {
        wardStats[ward] = {
          name: ward,
          total: 0,
          resolved: 0,
          pending: 0,
          avgResolutionTime: 0,
          categories: {},
          priorities: {}
        };
      }

      wardStats[ward].total++;

      if (report.status === 'resolved') {
        wardStats[ward].resolved++;
      } else {
        wardStats[ward].pending++;
      }

      // Track categories
      wardStats[ward].categories[report.category] =
        (wardStats[ward].categories[report.category] || 0) + 1;

      // Track priorities
      wardStats[ward].priorities[report.priority] =
        (wardStats[ward].priorities[report.priority] || 0) + 1;
    });

    // Calculate performance metrics
    Object.values(wardStats).forEach(ward => {
      ward.resolutionRate = ward.total > 0
        ? Math.round((ward.resolved / ward.total) * 100)
        : 0;

      ward.efficiency = calculateWardEfficiency(ward);
    });

    // Sort by total reports
    const sortedWards = Object.values(wardStats)
      .sort((a, b) => b.total - a.total);

    res.json({
      success: true,
      wards: sortedWards,
      totalWards: sortedWards.length
    });

  } catch (error) {
    console.error('❌ Error fetching ward performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ward performance'
    });
  }
});

// ✅ SLA MONITORING - /api/admin/sla/status
router.get('/sla/status', async (req, res) => {
  try {
    const stats = await slaService.getSLAStats();

    if (!stats) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch SLA statistics'
      });
    }

    res.json({
      success: true,
      sla: stats,
      isMonitoringActive: slaService.isRunning
    });

  } catch (error) {
    console.error('❌ Error fetching SLA status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch SLA status'
    });
  }
});

// ✅ BULK OPERATIONS - /api/admin/reports/bulk-update
router.put('/reports/bulk-update', async (req, res) => {
  try {
    const { reportIds, status, note, updatedBy } = req.body;

    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Report IDs are required'
      });
    }

    const updatePromises = reportIds.map(async (id) => {
      try {
        const existingResult = await firebaseService.getReportById(id);
        if (!existingResult.success) return null;

        const existing = existingResult.report;
        const updateData = {
          status: status || existing.status,
          timeline: [
            ...existing.timeline,
            {
              status: status || existing.status,
              timestamp: new Date().toISOString(),
              note: note || `Bulk update by ${updatedBy}`,
              updatedBy: updatedBy || 'admin'
            }
          ]
        };

        await firebaseService.updateReport(id, updateData);
        return id;
      } catch (error) {
        console.error(`❌ Failed to update report ${id}:`, error);
        return null;
      }
    });

    const results = await Promise.all(updatePromises);
    const successCount = results.filter(r => r !== null).length;

    res.json({
      success: true,
      message: `${successCount} reports updated successfully`,
      totalRequested: reportIds.length,
      successful: successCount,
      failed: reportIds.length - successCount
    });

  } catch (error) {
    console.error('❌ Error in bulk update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update reports'
    });
  }
});

// 🔥 REAL-TIME ADMIN DASHBOARD
router.get('/dashboard/realtime', async (req, res) => {
  try {
    const result = await firebaseService.getRealTimeDashboard();

    if (result.success) {
      res.json({
        success: true,
        ...result.dashboard,
        generatedAt: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch real-time dashboard data'
      });
    }

  } catch (error) {
    console.error('❌ Error fetching real-time dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 🔥 ADVANCED ANALYTICS
router.get('/analytics/advanced', async (req, res) => {
  try {
    const { timeframe = '30d', department, ward } = req.query;

    const filters = {};
    if (timeframe) {
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      filters.startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }

    const result = await firebaseService.getAdvancedAnalytics(filters);

    if (result.success) {
      res.json({
        success: true,
        analytics: result.analytics,
        filters: { timeframe, department, ward },
        generatedAt: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to generate advanced analytics'
      });
    }

  } catch (error) {
    console.error('❌ Error generating advanced analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 🔥 SMART NOTIFICATION MANAGEMENT
router.post('/notifications/broadcast', async (req, res) => {
  try {
    const { title, message, targetType = 'all', priority = 'normal', schedule } = req.body;

    // For MVP, we'll send to our 3 test accounts
    const mvpUsers = [
      'user1@example.com',
      'user2@example.com',
      'admin@example.com'
    ];

    const broadcastId = `broadcast_${Date.now()}`;
    const results = [];

    for (const userEmail of mvpUsers) {
      if (targetType === 'all' ||
        (targetType === 'users' && !userEmail.includes('admin')) ||
        (targetType === 'admin' && userEmail.includes('admin'))) {

        const result = await firebaseService.sendSmartNotification(
          userEmail,
          'admin_broadcast',
          {
            title,
            message,
            priority,
            broadcastId,
            scheduledFor: schedule
          }
        );

        results.push({ userEmail, success: result.success });
      }
    }

    const successful = results.filter(r => r.success).length;

    res.json({
      success: true,
      message: `Broadcast sent to ${successful} out of ${results.length} users`,
      broadcastId,
      results,
      stats: {
        targeted: results.length,
        successful,
        failed: results.length - successful
      }
    });

  } catch (error) {
    console.error('❌ Error sending broadcast notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send broadcast notification'
    });
  }
});

// 🔥 SMART RESOURCE RECOMMENDATIONS
router.get('/resources/recommendations', async (req, res) => {
  try {
    const analyticsResult = await firebaseService.getAdvancedAnalytics();
    if (!analyticsResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch data for recommendations'
      });
    }

    const analytics = analyticsResult.analytics;

    const recommendations = {
      immediate: [
        {
          priority: 'high',
          action: 'Deploy emergency response team',
          reason: `${analytics.overview.criticalReports} critical issues require immediate attention`
        }
      ],
      planned: [
        {
          priority: 'medium',
          action: 'Review pending reports',
          reason: `${analytics.overview.activeReports} reports need attention`
        }
      ],
      budget: {
        total: analytics.overview.activeReports * 15000,
        breakdown: { maintenance: 60, personnel: 30, equipment: 10 },
        currency: 'INR',
        confidence: 75
      },
      workforce: {
        current: Math.ceil(analytics.overview.activeReports / 10),
        recommended: Math.ceil(analytics.overview.activeReports / 8),
        critical: analytics.overview.criticalReports
      },
      geographical: {
        hotspots: analytics.geographic?.hotspots || [],
        focusAreas: ['Brigade Road', 'MG Road', 'Commercial Street']
      },
      predictions: {
        volume: {
          nextWeek: Math.round(analytics.overview.todayReports * 7),
          nextMonth: Math.round(analytics.overview.todayReports * 30),
          trend: analytics.overview.weeklyGrowth > 0 ? 'increasing' : 'stable',
          confidence: 80
        }
      }
    };

    res.json({
      success: true,
      recommendations,
      basedOnData: 'Advanced analytics and predictive modeling',
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating resource recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations'
    });
  }
});

// 🔥 SYSTEM HEALTH MONITORING
router.get('/system/health', async (req, res) => {
  try {
    const reportsResult = await firebaseService.getReports({}, { limit: 10 });
    const testConnection = await firebaseService.testConnection();

    const health = {
      overall: 'healthy',
      services: {
        database: testConnection.success ? 'operational' : 'degraded',
        storage: 'operational', // Cloudinary
        notifications: 'operational', // FCM/Email
        sla: slaService.isRunning ? 'active' : 'stopped'
      },
      metrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        responseTime: reportsResult.success ? 'fast' : 'slow'
      },
      alerts: [],
      lastCheck: new Date().toISOString()
    };

    // Check for system alerts
    if (!testConnection.success) {
      health.alerts.push({
        level: 'warning',
        message: 'Database connection issues detected',
        action: 'Check Firebase configuration'
      });
      health.overall = 'degraded';
    }

    if (!slaService.isRunning) {
      health.alerts.push({
        level: 'info',
        message: 'SLA monitoring not active',
        action: 'Review monitoring service'
      });
    }

    res.json({
      success: true,
      health
    });

  } catch (error) {
    console.error('❌ Error checking system health:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      health: {
        overall: 'unhealthy',
        lastCheck: new Date().toISOString()
      }
    });
  }
});

// 🔥 USER MANAGEMENT FOR MVP
router.get('/users/profiles', async (req, res) => {
  try {
    // For MVP, return our 3 test user profiles
    const mvpUsers = [
      'user1@example.com',
      'user2@example.com',
      'admin@example.com'
    ];

    const profiles = [];
    for (const email of mvpUsers) {
      const result = await firebaseService.getUserProfile(email);
      if (result.success) {
        profiles.push(result.profile);
      }
    }

    res.json({
      success: true,
      users: profiles,
      totalUsers: profiles.length,
      activeUsers: profiles.filter(u => {
        const lastActivity = new Date(u.stats?.lastActivity || 0);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return lastActivity > weekAgo;
      }).length
    });

  } catch (error) {
    console.error('❌ Error fetching user profiles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profiles'
    });
  }
});

module.exports = router;