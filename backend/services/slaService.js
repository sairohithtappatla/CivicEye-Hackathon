const cron = require('node-cron');
const firebaseService = require('./firebaseService');
const { sendSLAAlert } = require('../utils/emailService');

class SLAService {
  constructor() {
    this.isRunning = false;
    this.alertsSent = new Set(); // Track sent alerts
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ SLA Monitor already running');
      return;
    }

    // Run every 30 minutes
    this.job = cron.schedule('*/30 * * * *', async () => {
      await this.checkSLABreaches();
    }, {
      scheduled: false
    });

    this.job.start();
    this.isRunning = true;
    console.log('🕐 SLA Monitor started - checking every 30 minutes');
  }

  stop() {
    if (this.job) {
      this.job.stop();
      this.isRunning = false;
      console.log('🛑 SLA Monitor stopped');
    }
  }

  async checkSLABreaches() {
    try {
      console.log('🔍 Checking for SLA breaches...');

      // Get all active reports
      const result = await firebaseService.getAnalyticsData({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      });

      if (!result.success) {
        console.error('❌ Failed to fetch reports for SLA check');
        return;
      }

      const activeReports = result.reports.filter(report =>
        !['resolved', 'closed'].includes(report.status)
      );

      let breachCount = 0;

      for (const report of activeReports) {
        if (this.isSLABreach(report) && !this.alertsSent.has(report.id)) {
          try {
            await sendSLAAlert(report);

            // Send FCM notification if token available
            if (report.fcmToken) {
              await firebaseService.sendNotification(
                report.fcmToken,
                {
                  title: '🚨 SLA Breach Alert',
                  body: `Report ${report.ticketNumber} has exceeded SLA deadline`,
                  imageUrl: report.photo?.url
                },
                {
                  type: 'sla_breach',
                  ticketNumber: report.ticketNumber,
                  priority: report.priority
                }
              );
            }

            this.alertsSent.add(report.id);
            breachCount++;

            console.log(`🚨 SLA Alert sent for ${report.ticketNumber}`);
          } catch (error) {
            console.error(`❌ Failed to send SLA alert for ${report.ticketNumber}:`, error);
          }
        }
      }

      if (breachCount > 0) {
        console.log(`📊 SLA Check completed: ${breachCount} alerts sent`);
      } else {
        console.log('✅ SLA Check completed: No breaches detected');
      }

    } catch (error) {
      console.error('❌ SLA Monitor error:', error);
    }
  }

  isSLABreach(report) {
    const now = new Date();
    const created = new Date(report.createdAt);
    const hoursElapsed = (now - created) / (1000 * 60 * 60);

    const slaLimits = {
      critical: 4,   // 4 hours
      high: 24,      // 24 hours
      medium: 72,    // 72 hours (3 days)
      low: 168       // 168 hours (7 days)
    };

    const limit = slaLimits[report.priority] || slaLimits.medium;
    return hoursElapsed > limit;
  }

  // Manual SLA check for specific report
  async checkReportSLA(reportId) {
    try {
      const result = await firebaseService.getReportById(reportId);
      if (!result.success) return false;

      return this.isSLABreach(result.report);
    } catch (error) {
      console.error(`❌ Error checking SLA for report ${reportId}:`, error);
      return false;
    }
  }

  // Get SLA statistics
  async getSLAStats() {
    try {
      const result = await firebaseService.getAnalyticsData();
      if (!result.success) return null;

      const reports = result.reports;
      const stats = {
        compliant: 0,
        breach: 0,
        pending: 0,
        totalActive: 0
      };

      reports.forEach(report => {
        if (['resolved', 'closed'].includes(report.status)) return;

        stats.totalActive++;

        if (this.isSLABreach(report)) {
          stats.breach++;
        } else {
          stats.pending++;
        }
      });

      stats.complianceRate = stats.totalActive > 0
        ? Math.round(((stats.totalActive - stats.breach) / stats.totalActive) * 100)
        : 100;

      return stats;
    } catch (error) {
      console.error('❌ Error getting SLA stats:', error);
      return null;
    }
  }
}

module.exports = new SLAService();