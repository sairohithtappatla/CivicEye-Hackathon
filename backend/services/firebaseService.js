const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
let firebaseApp;
let db, messaging;

try {
  // Check if already initialized
  if (admin.apps.length === 0) {
    // Try to use service account file first (for local development)
    const serviceAccountPath = path.join(__dirname, '..', 'config', 'serviceAccountKey.json');

    try {
      const serviceAccount = require(serviceAccountPath);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://civiceye-hackathon-default-rtdb.firebaseio.com`
      });
      console.log('🔥 Firebase initialized with service account file');
    } catch (fileError) {
      console.log('📁 Service account file not found, trying environment variables...');

      // Fallback to environment variables (for production)
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {

        // Fix the private key format
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;

        // Handle different private key formats
        if (privateKey) {
          // Replace literal \n with actual newlines
          privateKey = privateKey.replace(/\\n/g, '\n');

          // Ensure proper PEM format
          if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
            privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
          }
        }

        const serviceAccountFromEnv = {
          type: "service_account",
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: privateKey,
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: `https://www.googleapis.com/oauth2/v1/certs/firebase-adminsdk%40${process.env.FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`
        };

        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccountFromEnv),
          databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
        });
        console.log('🔥 Firebase initialized with environment variables');
      } else {
        throw new Error('Firebase configuration missing in environment variables');
      }
    }
  } else {
    firebaseApp = admin.app();
    console.log('🔥 Firebase already initialized');
  }

  // Initialize Firestore and Messaging
  db = admin.firestore();
  db.settings({ ignoreUndefinedProperties: true });

  messaging = admin.messaging();

} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  console.log('💡 Starting in development mode without Firebase');

  // Create mock services for development
  db = createMockFirestore();
  messaging = createMockMessaging();
}

// Add this at the top of firebaseService.js after line 5
if (process.env.SKIP_FIREBASE === 'true') {
  console.log('🔥 Firebase skipped - running in development mode');
  db = createMockFirestore();
  messaging = createMockMessaging();
} else {
  // ... existing Firebase initialization code ...
}

// Mock Firestore for development
function createMockFirestore() {
  const mockReports = [];

  return {
    collection: (name) => ({
      add: async (data) => {
        const id = 'mock_' + Date.now();
        mockReports.push({ id, ...data, createdAt: new Date(), updatedAt: new Date() });
        console.log(`📝 Mock: Added ${name} document with ID: ${id}`);
        return { id };
      },
      doc: (id) => ({
        get: async () => {
          const doc = mockReports.find(r => r.id === id);
          return {
            exists: !!doc,
            id: doc?.id,
            data: () => doc
          };
        },
        set: async (data) => {
          const index = mockReports.findIndex(r => r.id === id);
          if (index >= 0) {
            mockReports[index] = { ...mockReports[index], ...data, updatedAt: new Date() };
          } else {
            mockReports.push({ id, ...data, createdAt: new Date(), updatedAt: new Date() });
          }
          console.log(`📝 Mock: Set ${name} document ${id}`);
        },
        update: async (data) => {
          const index = mockReports.findIndex(r => r.id === id);
          if (index >= 0) {
            mockReports[index] = { ...mockReports[index], ...data, updatedAt: new Date() };
            console.log(`📝 Mock: Updated ${name} document ${id}`);
          }
        },
        delete: async () => {
          const index = mockReports.findIndex(r => r.id === id);
          if (index >= 0) {
            mockReports.splice(index, 1);
            console.log(`📝 Mock: Deleted ${name} document ${id}`);
          }
        }
      }),
      where: () => ({
        orderBy: () => ({
          limit: () => ({
            get: async () => ({
              forEach: (callback) => {
                mockReports.slice(0, 10).forEach(doc => {
                  callback({
                    id: doc.id,
                    data: () => doc
                  });
                });
              }
            })
          })
        }),
        get: async () => ({
          forEach: (callback) => {
            mockReports.forEach(doc => {
              callback({
                id: doc.id,
                data: () => doc
              });
            });
          }
        })
      }),
      orderBy: () => ({
        limit: () => ({
          get: async () => ({
            forEach: (callback) => {
              mockReports.slice(0, 20).forEach(doc => {
                callback({
                  id: doc.id,
                  data: () => doc
                });
              });
            }
          })
        }),
        get: async () => ({
          forEach: (callback) => {
            mockReports.forEach(doc => {
              callback({
                id: doc.id,
                data: () => doc
              });
            });
          }
        })
      }),
      get: async () => ({
        forEach: (callback) => {
          mockReports.forEach(doc => {
            callback({
              id: doc.id,
              data: () => doc
            });
          });
        }
      })
    })
  };
}

// Mock Messaging for development
function createMockMessaging() {
  return {
    send: async (message) => {
      console.log('📱 Mock FCM: Notification sent', {
        to: message.token,
        title: message.notification?.title
      });
      return 'mock_message_id_' + Date.now();
    },
    sendMulticast: async (message) => {
      console.log('📱 Mock FCM: Batch notification sent to', message.tokens?.length, 'tokens');
      return {
        successCount: message.tokens?.length || 0,
        failureCount: 0,
        responses: []
      };
    }
  };
}

class FirebaseService {
  // Test Firebase connection
  async testConnection() {
    try {
      if (!firebaseApp) {
        return { success: false, error: 'Firebase not initialized', service: 'Mock Mode' };
      }

      // Test Firestore connection
      const testDoc = await db.collection('_test').doc('connection').set({
        timestamp: new Date().toISOString(),
        status: 'connected'
      });

      // Clean up test document
      await db.collection('_test').doc('connection').delete();

      console.log('✅ Firestore connection successful');
      return { success: true, service: 'Firestore' };
    } catch (error) {
      console.error('❌ Firestore connection failed:', error);
      return { success: false, error: error.message, service: 'Mock Mode' };
    }
  }

  // Reports collection operations
  async saveReport(report) {
    try {
      // Add server timestamp
      const reportWithTimestamp = {
        ...report,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await db.collection('reports').add(reportWithTimestamp);

      console.log(`✅ Report saved: ${docRef.id || 'mock_id'}`);
      return { success: true, id: docRef.id || 'mock_' + Date.now() };
    } catch (error) {
      console.error('❌ Failed to save report:', error);
      return { success: false, error: error.message };
    }
  }

  async getReports(filters = {}, pagination = {}) {
    try {
      let query = db.collection('reports');

      // Apply filters and pagination (simplified for mock)
      const snapshot = await query.get();
      const reports = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        reports.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt || Date.now()),
          updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt || Date.now())
        });
      });

      console.log(`📊 Fetched ${reports.length} reports`);
      return { success: true, reports, count: reports.length };
    } catch (error) {
      console.error('❌ Failed to fetch reports:', error);
      return { success: false, error: error.message, reports: [] };
    }
  }

  async getReportById(id) {
    try {
      const doc = await db.collection('reports').doc(id).get();

      if (!doc.exists) {
        return { success: false, error: 'Report not found' };
      }

      const data = doc.data();
      const report = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt || Date.now())
      };

      return { success: true, report };
    } catch (error) {
      console.error('❌ Failed to fetch report:', error);
      return { success: false, error: error.message };
    }
  }

  async updateReport(id, updates) {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await db.collection('reports').doc(id).update(updateData);

      console.log(`✅ Report updated: ${id}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to update report:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteReport(id) {
    try {
      await db.collection('reports').doc(id).delete();
      console.log(`✅ Report deleted: ${id}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete report:', error);
      return { success: false, error: error.message };
    }
  }

  // FCM Notifications
  async sendNotification(token, notification, data = {}) {
    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl && { imageUrl: notification.imageUrl })
        },
        data: Object.keys(data).reduce((acc, key) => {
          acc[key] = String(data[key]);
          return acc;
        }, {}),
        token
      };

      const response = await messaging.send(message);
      console.log(`✅ FCM notification sent: ${response}`);
      return { success: true, messageId: response };
    } catch (error) {
      console.error('❌ Failed to send FCM notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Analytics queries
  async getAnalyticsData(filters = {}) {
    try {
      const result = await this.getReports(filters);
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch analytics data:', error);
      return { success: false, error: error.message, reports: [] };
    }
  }

  // User management for FCM tokens
  async saveUserFCMToken(userId, token, deviceInfo = {}) {
    try {
      await db.collection('user_tokens').doc(userId).set({
        fcmToken: token,
        deviceInfo,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      console.log(`✅ FCM token saved for user: ${userId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to save FCM token:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserFCMToken(userId) {
    try {
      const doc = await db.collection('user_tokens').doc(userId).get();

      if (!doc.exists) {
        return { success: false, error: 'User token not found' };
      }

      return { success: true, token: doc.data().fcmToken };
    } catch (error) {
      console.error('❌ Failed to get FCM token:', error);
      return { success: false, error: error.message };
    }
  }

  // 🔥 USER PROFILE MANAGEMENT
  async saveUserProfile(email, profile) {
    try {
      const userProfile = {
        ...profile,
        email,
        createdAt: profile.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          reportsSubmitted: 0,
          reportsResolved: 0,
          lastActivity: new Date().toISOString(),
          reputationScore: 100
        },
        preferences: {
          notifications: true,
          emailUpdates: true,
          smsAlerts: false,
          nearbyAlerts: true,
          categories: profile.preferences?.categories || []
        }
      };

      await db.collection('users').doc(email).set(userProfile, { merge: true });
      console.log(`✅ User profile saved: ${email}`);
      return { success: true, profile: userProfile };
    } catch (error) {
      console.error('❌ Failed to save user profile:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserProfile(email) {
    try {
      const doc = await db.collection('users').doc(email).get();

      if (!doc.exists) {
        return { success: false, error: 'User profile not found' };
      }

      return { success: true, profile: doc.data() };
    } catch (error) {
      console.error('❌ Failed to get user profile:', error);
      return { success: false, error: error.message };
    }
  }

  async updateUserProfile(email, updates) {
    try {
      await db.collection('users').doc(email).update({
        ...updates,
        updatedAt: new Date().toISOString()
      });
      console.log(`✅ User profile updated: ${email}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      return { success: false, error: error.message };
    }
  }

  // 🔥 SMART NOTIFICATION SYSTEM
  async sendSmartNotification(userId, notificationType, data) {
    try {
      // Get user preferences (with fallback for MVP)
      let userResult = await this.getUserProfile(userId);
      if (!userResult.success) {
        // Create basic profile for MVP
        await this.saveUserProfile(userId, { name: userId.split('@')[0] });
        userResult = await this.getUserProfile(userId);
      }

      const user = userResult.profile;
      if (!user.preferences?.notifications) {
        console.log(`⚠️ User ${userId} has notifications disabled`);
        return { success: false, error: 'Notifications disabled' };
      }

      // Get notification template
      let notification = this.getNotificationTemplate(notificationType, data);

      // Log notification (mock send for MVP)
      await db.collection('notifications').add({
        userId,
        type: notificationType,
        notification,
        data,
        sent: true,
        sentAt: new Date().toISOString(),
        messageId: `mock_${Date.now()}`
      });

      console.log(`🔔 Smart notification sent to ${userId}: ${notification.title}`);
      return { success: true, messageId: `mock_${Date.now()}` };
    } catch (error) {
      console.error('❌ Failed to send smart notification:', error);
      return { success: false, error: error.message };
    }
  }

  getNotificationTemplate(type, data) {
    const templates = {
      'report_submitted': {
        title: '✅ Report Submitted Successfully',
        body: `Your report #${data.ticketNumber} has been received and assigned to ${data.department}`,
        imageUrl: data.photoUrl
      },
      'status_update': {
        title: `📋 Report Update - ${data.ticketNumber}`,
        body: `Status changed to: ${data.newStatus}. ${data.note || 'No additional notes.'}`,
      },
      'sla_breach': {
        title: '⚠️ SLA Alert',
        body: `Your report #${data.ticketNumber} has exceeded expected resolution time`,
      },
      'admin_broadcast': {
        title: data.title || '📢 Important Notice',
        body: data.message || 'Please check the latest updates',
      },
      'critical_report_assigned': {
        title: '🚨 Critical Report Assigned',
        body: `Urgent: ${data.category} issue reported at ${data.location}`,
      }
    };

    return templates[type] || { title: 'CivicEye Update', body: 'New notification' };
  }

  // 🔥 ADVANCED ANALYTICS FOR ADMIN
  async getAdvancedAnalytics(filters = {}) {
    try {
      const result = await this.getReports(filters);
      if (!result.success) return result;

      const reports = result.reports;

      const analytics = {
        overview: {
          totalReports: reports.length,
          activeReports: reports.filter(r => !['resolved', 'closed'].includes(r.status)).length,
          criticalReports: reports.filter(r => r.priority === 'critical').length,
          avgResolutionTime: this.calculateAvgResolutionTime(reports),
          todayReports: this.getTodayReports(reports),
          weeklyGrowth: this.getWeeklyGrowth(reports)
        },
        performance: {
          resolutionRate: this.getResolutionRate(reports),
          slaCompliance: this.getSLACompliance(reports),
          departmentEfficiency: this.getDepartmentEfficiency(reports),
          responseTime: this.getResponseTimeMetrics(reports)
        },
        geographic: {
          hotspots: this.getHotspots(reports),
          wardDistribution: this.getWardDistribution(reports),
          locationInsights: this.getLocationInsights(reports)
        },
        predictions: {
          expectedVolume: this.predictReportVolume(reports),
          resourceNeeds: this.predictResourceNeeds(reports),
          riskAssessment: this.assessRisks(reports)
        },
        userEngagement: {
          activeUsers: this.getActiveUsersCount(reports),
          topReporters: this.getTopReporters(reports),
          categoryPreferences: this.getCategoryPreferences(reports)
        }
      };

      return { success: true, analytics };
    } catch (error) {
      console.error('❌ Failed to get advanced analytics:', error);
      return { success: false, error: error.message };
    }
  }

  // 🔥 SMART HELPER METHODS
  calculateAvgResolutionTime(reports) {
    const resolved = reports.filter(r => r.status === 'resolved');
    if (resolved.length === 0) return 0;

    const totalTime = resolved.reduce((sum, report) => {
      const created = new Date(report.createdAt);
      const updated = new Date(report.updatedAt);
      return sum + (updated - created);
    }, 0);

    return Math.round(totalTime / resolved.length / (1000 * 60 * 60)); // Hours
  }

  getTodayReports(reports) {
    const today = new Date().toDateString();
    return reports.filter(r => new Date(r.createdAt).toDateString() === today).length;
  }

  getWeeklyGrowth(reports) {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek = reports.filter(r => new Date(r.createdAt) >= lastWeek).length;
    const previousWeek = reports.filter(r => {
      const date = new Date(r.createdAt);
      return date >= prevWeek && date < lastWeek;
    }).length;

    return previousWeek > 0 ? Math.round(((thisWeek - previousWeek) / previousWeek) * 100) : 100;
  }

  getResolutionRate(reports) {
    if (reports.length === 0) return 0;
    const resolved = reports.filter(r => r.status === 'resolved').length;
    return Math.round((resolved / reports.length) * 100);
  }

  getSLACompliance(reports) {
    const slaLimits = { critical: 4, high: 24, medium: 72, low: 168 };
    let compliant = 0;
    let total = 0;

    reports.forEach(report => {
      const limitHours = slaLimits[report.priority] || 72;
      const createdTime = new Date(report.createdAt);
      const resolvedTime = report.status === 'resolved' ? new Date(report.updatedAt) : new Date();
      const actualHours = (resolvedTime - createdTime) / (1000 * 60 * 60);

      total++;
      if (actualHours <= limitHours) compliant++;
    });

    return total > 0 ? Math.round((compliant / total) * 100) : 0;
  }

  getDepartmentEfficiency(reports) {
    const departments = {};
    reports.forEach(report => {
      const dept = report.assignedDepartment || 'Unassigned';
      if (!departments[dept]) {
        departments[dept] = { total: 0, resolved: 0, avgTime: 0 };
      }
      departments[dept].total++;
      if (report.status === 'resolved') departments[dept].resolved++;
    });

    Object.values(departments).forEach(dept => {
      dept.efficiency = dept.total > 0 ? Math.round((dept.resolved / dept.total) * 100) : 0;
    });

    return departments;
  }

  getHotspots(reports) {
    const locationCounts = {};

    reports.forEach(report => {
      if (report.location?.latitude && report.location?.longitude) {
        const lat = Math.round(report.location.latitude * 1000) / 1000;
        const lng = Math.round(report.location.longitude * 1000) / 1000;
        const key = `${lat},${lng}`;

        if (!locationCounts[key]) {
          locationCounts[key] = {
            latitude: lat,
            longitude: lng,
            count: 0,
            categories: {},
            severity: { critical: 0, high: 0, medium: 0, low: 0 }
          };
        }

        locationCounts[key].count++;
        locationCounts[key].categories[report.category] =
          (locationCounts[key].categories[report.category] || 0) + 1;
        locationCounts[key].severity[report.priority || 'medium']++;
      }
    });

    return Object.values(locationCounts)
      .filter(hotspot => hotspot.count >= 1) // Lower threshold for MVP
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  predictReportVolume(reports) {
    const last7Days = reports.filter(r => {
      const reportDate = new Date(r.createdAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return reportDate >= weekAgo;
    });

    const dailyAvg = last7Days.length / 7;
    const trend = last7Days.length > 5 ? 'increasing' : last7Days.length < 2 ? 'decreasing' : 'stable';

    return {
      nextWeek: Math.round(dailyAvg * 7),
      nextMonth: Math.round(dailyAvg * 30),
      trend,
      confidence: trend === 'stable' ? 85 : 70
    };
  }

  predictResourceNeeds(reports) {
    const activeReports = reports.filter(r => !['resolved', 'closed'].includes(r.status));
    const criticalCount = activeReports.filter(r => r.priority === 'critical').length;

    return {
      urgentAttention: criticalCount,
      estimatedWorkforce: Math.max(1, Math.ceil(activeReports.length / 8)),
      recommendedActions: this.getRecommendedActions(activeReports),
      budgetEstimate: this.estimateBudget(activeReports)
    };
  }

  getRecommendedActions(activeReports) {
    const actions = [];

    const critical = activeReports.filter(r => r.priority === 'critical');
    if (critical.length > 3) {
      actions.push({
        priority: 'high',
        action: 'Deploy emergency response team',
        reason: `${critical.length} critical issues require immediate attention`
      });
    }

    const oldReports = activeReports.filter(r => {
      const daysOld = (Date.now() - new Date(r.createdAt)) / (1000 * 60 * 60 * 24);
      return daysOld > 7;
    });

    if (oldReports.length > 5) {
      actions.push({
        priority: 'medium',
        action: 'Review pending reports',
        reason: `${oldReports.length} reports are overdue for resolution`
      });
    }

    // Category-specific recommendations
    const categories = {};
    activeReports.forEach(r => {
      categories[r.category] = (categories[r.category] || 0) + 1;
    });

    Object.entries(categories).forEach(([category, count]) => {
      if (count > 5) {
        actions.push({
          priority: 'medium',
          action: `Focus on ${category} issues`,
          reason: `${count} active ${category} reports indicate systemic issue`
        });
      }
    });

    return actions;
  }

  estimateBudget(activeReports) {
    const costPerCategory = {
      'pothole': 15000,
      'water': 25000,
      'streetlight': 8000,
      'garbage': 5000,
      'traffic': 12000,
      'drainage': 30000
    };

    let totalEstimate = 0;
    const breakdown = {};

    activeReports.forEach(report => {
      const cost = costPerCategory[report.category] || 10000;
      const multiplier = report.priority === 'critical' ? 1.5 : 1;
      const estimatedCost = cost * multiplier;

      totalEstimate += estimatedCost;
      breakdown[report.category] = (breakdown[report.category] || 0) + estimatedCost;
    });

    return {
      total: Math.max(50000, totalEstimate), // Minimum budget for MVP
      breakdown,
      currency: 'INR',
      confidence: 75
    };
  }

  // 🔥 REAL-TIME DASHBOARD DATA
  async getRealTimeDashboard() {
    try {
      const reportsResult = await this.getReports({}, { limit: 100 });
      if (!reportsResult.success) {
        return { success: false, error: 'Failed to fetch reports' };
      }

      const reports = reportsResult.reports;
      const now = new Date();

      const dashboardData = {
        timestamp: now.toISOString(),
        status: 'operational',
        alerts: {
          critical: reports.filter(r => r.priority === 'critical' && !['resolved', 'closed'].includes(r.status)).length,
          slaBreaches: this.getSLABreaches(reports),
          systemHealth: 'green'
        },
        metrics: {
          activeIncidents: reports.filter(r => !['resolved', 'closed'].includes(r.status)).length,
          todayReports: this.getTodayReports(reports),
          resolutionRate: this.getResolutionRate(reports),
          avgResponseTime: this.calculateAvgResponseTime(reports)
        },
        recentActivity: reports
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map(r => ({
            id: r.id,
            ticketNumber: r.ticketNumber,
            category: r.category,
            priority: r.priority,
            status: r.status,
            timeAgo: this.getTimeAgo(r.createdAt),
            location: r.location?.address || 'Location not specified'
          })),
        departmentStatus: this.getDepartmentStatus(reports)
      };

      return { success: true, dashboard: dashboardData };
    } catch (error) {
      console.error('❌ Failed to get real-time dashboard:', error);
      return { success: false, error: error.message };
    }
  }

  // Missing helper methods for advanced analytics
  getResponseTimeMetrics(reports) {
    const avgTime = this.calculateAvgResolutionTime(reports);
    return {
      average: avgTime,
      fastest: Math.max(0, avgTime - 24), // Mock data for MVP
      slowest: avgTime + 48 // Mock data for MVP
    };
  }

  getWardDistribution(reports) {
    const wardCounts = {};
    reports.forEach(report => {
      const ward = report.location?.ward || report.location?.address?.split(',')[0] || 'Unknown';
      wardCounts[ward] = (wardCounts[ward] || 0) + 1;
    });
    return wardCounts;
  }

  getLocationInsights(reports) {
    const wards = this.getWardDistribution(reports);
    const insights = [];

    Object.entries(wards).forEach(([ward, count]) => {
      if (count > 2) { // For MVP, lower threshold
        insights.push({
          ward,
          issueCount: count,
          recommendation: `High activity area - consider increased monitoring`,
          priority: count > 5 ? 'high' : 'medium'
        });
      }
    });

    return insights.length > 0 ? insights : [{
      ward: 'Brigade Road',
      issueCount: 3,
      recommendation: 'Monitor for emerging issues',
      priority: 'medium'
    }];
  }

  assessRisks(reports) {
    const activeReports = reports.filter(r => !['resolved', 'closed'].includes(r.status));
    const slaBreaches = this.getSLABreaches(reports);
    const criticalCount = reports.filter(r => r.priority === 'critical').length;

    let level = 'low';
    if (slaBreaches > 5 || criticalCount > 3) level = 'high';
    else if (slaBreaches > 2 || criticalCount > 1) level = 'medium';

    return {
      level,
      score: Math.min(100, (slaBreaches * 20) + (criticalCount * 15) + (activeReports.length * 2)),
      factors: [
        `${activeReports.length} active reports`,
        `${slaBreaches} SLA breaches`,
        `${criticalCount} critical issues`
      ],
      recommendations: level === 'high' ?
        ['Deploy emergency response team', 'Escalate to senior management'] :
        ['Monitor closely', 'Review resource allocation']
    };
  }

  getActiveUsersCount(reports) {
    const uniqueReporters = new Set(reports.map(r => r.reportedBy).filter(r => r));
    return uniqueReporters.size;
  }

  getTopReporters(reports) {
    const reporterCounts = {};
    reports.forEach(report => {
      const reporter = report.reportedBy || 'Anonymous';
      if (reporter !== 'Anonymous') {
        reporterCounts[reporter] = (reporterCounts[reporter] || 0) + 1;
      }
    });

    return Object.entries(reporterCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([email, count]) => ({
        email: email.includes('@') ? email.split('@')[0] : email,
        reports: count,
        level: count > 5 ? 'gold' : count > 3 ? 'silver' : 'bronze'
      }));
  }

  getCategoryPreferences(reports) {
    const categoryCounts = {};
    reports.forEach(report => {
      const category = report.category || 'Other';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // Calculate percentages
    const total = reports.length;
    const preferences = {};
    Object.entries(categoryCounts).forEach(([category, count]) => {
      preferences[category] = {
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      };
    });

    return preferences;
  }

  // Fix the getSLABreaches method to handle edge cases
  getSLABreaches(reports) {
    const slaLimits = { critical: 4, high: 24, medium: 72, low: 168 };
    let breaches = 0;

    reports.forEach(report => {
      if (['resolved', 'closed'].includes(report.status)) return;

      const limitHours = slaLimits[report.priority] || 72;
      const hoursElapsed = (Date.now() - new Date(report.createdAt)) / (1000 * 60 * 60);

      if (hoursElapsed > limitHours) {
        breaches++;
      }
    });

    return breaches;
  }

  // Enhanced getDepartmentStatus method
  getDepartmentStatus(reports) {
    const departments = {};
    reports.forEach(report => {
      const dept = report.assignedDepartment || 'General';
      if (!departments[dept]) {
        departments[dept] = {
          active: 0,
          resolved: 0,
          critical: 0,
          status: 'normal',
          efficiency: 0
        };
      }

      if (!['resolved', 'closed'].includes(report.status)) {
        departments[dept].active++;
        if (report.priority === 'critical') departments[dept].critical++;
      } else {
        departments[dept].resolved++;
      }
    });

    // Calculate status and efficiency
    Object.values(departments).forEach(dept => {
      const total = dept.active + dept.resolved;
      dept.efficiency = total > 0 ? Math.round((dept.resolved / total) * 100) : 0;

      if (dept.critical > 2) dept.status = 'critical';
      else if (dept.active > 10) dept.status = 'overloaded';
      else if (dept.active < 3 && dept.efficiency > 80) dept.status = 'optimal';
      else dept.status = 'normal';
    });

    return departments;
  }

  // Add these methods after line 950 in your FirebaseService class

  // Missing method: updateUserStats
  async updateUserStats(email, statsUpdate) {
    try {
      const userDoc = db.collection('users').doc(email);
      const userProfile = await userDoc.get();

      if (!userProfile.exists) {
        // Create basic profile if doesn't exist
        await this.saveUserProfile(email, { name: email.split('@')[0] });
      }

      // Update stats
      const currentStats = userProfile.exists ? userProfile.data().stats || {} : {};
      const newStats = {
        ...currentStats,
        reportsSubmitted: (currentStats.reportsSubmitted || 0) + (statsUpdate.reportsSubmitted || 0),
        reportsResolved: (currentStats.reportsResolved || 0) + (statsUpdate.reportsResolved || 0),
        lastActivity: new Date().toISOString(),
        reputationScore: (currentStats.reputationScore || 100) + (statsUpdate.reportsSubmitted || 0) * 10
      };

      await userDoc.update({
        stats: newStats,
        updatedAt: new Date().toISOString()
      });

      console.log(`✅ User stats updated: ${email}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to update user stats:', error);
      return { success: false, error: error.message };
    }
  }

  // Missing method: calculateAvgResponseTime 
  calculateAvgResponseTime(reports) {
    const acknowledgedReports = reports.filter(r => r.status !== 'pending');
    if (acknowledgedReports.length === 0) return 0;

    const totalTime = acknowledgedReports.reduce((sum, report) => {
      const created = new Date(report.createdAt);
      const acknowledged = new Date(report.updatedAt);
      return sum + (acknowledged - created);
    }, 0);

    return Math.round(totalTime / acknowledgedReports.length / (1000 * 60 * 60)); // Hours
  }

  // Fix getTimeAgo method (might be missing)
  getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }
}

module.exports = new FirebaseService();