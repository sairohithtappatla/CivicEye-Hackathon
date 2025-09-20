const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import utilities and services
const logger = require('./utils/logger');
const performance = require('./utils/performance');
const { testEmailConnection } = require('./utils/emailService');
const slaService = require('./services/slaService');

// Import routes
const reportRoutes = require('./api/reportRoutes');
const adminRoutes = require('./api/adminRoutes');
const userRoutes = require('./api/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Start services
testEmailConnection();
slaService.start();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Performance monitoring
app.use(performance.trackRequest.bind(performance));

// Enhanced request logging
app.use(logger.logRequest.bind(logger));

// Routes
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint with detailed status
app.get('/api/health', (req, res) => {
  const metrics = performance.getMetrics();

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'CivicEye Backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: metrics.system.uptimeFormatted,
    services: {
      email: 'active',
      sla: slaService.isRunning ? 'active' : 'stopped',
      database: 'firestore',
      storage: 'cloudinary'
    },
    metrics: {
      totalRequests: metrics.requests.total,
      successRate: `${Math.round((metrics.requests.success / metrics.requests.total) * 100) || 0}%`,
      avgResponseTime: `${Math.round(metrics.requests.avgResponseTime) || 0}ms`,
      reportsSubmitted: metrics.reports.submitted,
      duplicatesDetected: metrics.reports.duplicatesDetected,
      slaBreaches: metrics.reports.slaBreaches
    }
  });
});

// System metrics endpoint
app.get('/api/metrics', (req, res) => {
  try {
    const metrics = performance.getMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Failed to get metrics', { error: error.message });
    res.status(500).json({ error: 'Failed to get system metrics' });
  }
});

// ⭐ NEW: Test Firebase connection endpoint
app.get('/api/test/firebase', async (req, res) => {
  try {
    const firebaseService = require('./services/firebaseService');
    const result = await firebaseService.testConnection();

    res.json({
      success: result.success,
      service: result.service || 'Firebase',
      message: result.success ? 'Firebase connection successful' : 'Firebase connection failed',
      error: result.error || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    body: req.body
  });

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });

  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  slaService.stop(); // ⭐ NEW: Stop SLA monitoring
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  slaService.stop(); // ⭐ NEW: Stop SLA monitoring
  process.exit(0);
});

app.listen(PORT, () => {
  logger.info(`🚀 CivicEye Backend started successfully`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    nodeVersion: process.version
  });

  console.log(`🚀 CivicEye Backend running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Metrics available at: http://localhost:${PORT}/api/metrics`);
  console.log(`❤️ Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔥 Database: Firestore`);
  console.log(`📸 Storage: Cloudinary`);
  console.log(`📧 Email: Resend`);
  console.log(`⏰ SLA Monitoring: ${slaService.isRunning ? 'Active' : 'Inactive'}`);
});

module.exports = app;