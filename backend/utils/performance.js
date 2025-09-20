const logger = require('./logger');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        avgResponseTime: 0,
        responseTimes: []
      },
      reports: {
        submitted: 0,
        duplicatesDetected: 0,
        slaBreaches: 0,
        resolved: 0
      },
      system: {
        startTime: Date.now(),
        uptime: 0
      }
    };
  }

  // Track request performance
  trackRequest(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;

      this.metrics.requests.total++;
      this.metrics.requests.responseTimes.push(duration);

      if (res.statusCode >= 200 && res.statusCode < 400) {
        this.metrics.requests.success++;
      } else {
        this.metrics.requests.errors++;
      }

      // Keep only last 1000 response times for memory efficiency
      if (this.metrics.requests.responseTimes.length > 1000) {
        this.metrics.requests.responseTimes = this.metrics.requests.responseTimes.slice(-1000);
      }

      // Calculate average response time
      this.metrics.requests.avgResponseTime =
        this.metrics.requests.responseTimes.reduce((a, b) => a + b, 0) /
        this.metrics.requests.responseTimes.length;

      // Log slow requests
      if (duration > 5000) { // 5 seconds
        logger.warn(`Slow request detected`, {
          method: req.method,
          path: req.path,
          duration: `${duration}ms`,
          statusCode: res.statusCode
        });
      }
    });

    next();
  }

  // Track report submissions
  trackReportSubmission(report, isDuplicate = false) {
    this.metrics.reports.submitted++;
    if (isDuplicate) {
      this.metrics.reports.duplicatesDetected++;
    }

    logger.info('Report submitted', {
      reportId: report.id,
      ticketNumber: report.ticketNumber,
      category: report.category,
      priority: report.priority,
      isDuplicate
    });
  }

  // Track SLA breaches
  trackSLABreach(report) {
    this.metrics.reports.slaBreaches++;
    logger.warn('SLA breach detected', {
      reportId: report.id,
      ticketNumber: report.ticketNumber,
      priority: report.priority,
      hoursOverdue: Math.floor((Date.now() - new Date(report.createdAt)) / (1000 * 60 * 60))
    });
  }

  // Track report resolution
  trackReportResolution(report) {
    this.metrics.reports.resolved++;
    const resolutionTime = Date.now() - new Date(report.createdAt);

    logger.info('Report resolved', {
      reportId: report.id,
      ticketNumber: report.ticketNumber,
      resolutionTimeHours: Math.floor(resolutionTime / (1000 * 60 * 60)),
      priority: report.priority
    });
  }

  // Get current metrics
  getMetrics() {
    this.metrics.system.uptime = Date.now() - this.metrics.system.startTime;

    return {
      ...this.metrics,
      system: {
        ...this.metrics.system,
        uptimeFormatted: this.formatUptime(this.metrics.system.uptime),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      }
    };
  }

  formatUptime(uptimeMs) {
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  // Reset metrics
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        avgResponseTime: 0,
        responseTimes: []
      },
      reports: {
        submitted: 0,
        duplicatesDetected: 0,
        slaBreaches: 0,
        resolved: 0
      },
      system: {
        startTime: Date.now(),
        uptime: 0
      }
    };
  }
}

module.exports = new PerformanceMonitor();