const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'INFO';
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` | Meta: ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}\n`;
  }

  writeToFile(level, message, meta) {
    const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
    const formattedMessage = this.formatMessage(level, message, meta);

    fs.appendFile(logFile, formattedMessage, (err) => {
      if (err) console.error('Failed to write to log file:', err);
    });
  }

  log(level, message, meta = {}) {
    const currentLevel = LOG_LEVELS[this.logLevel] || LOG_LEVELS.INFO;
    const messageLevel = LOG_LEVELS[level] || LOG_LEVELS.INFO;

    if (messageLevel <= currentLevel) {
      console.log(`${level}: ${message}`, meta);
      this.writeToFile(level, message, meta);
    }
  }

  error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }

  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }

  // Log API requests
  logRequest(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const meta = {
        method: req.method,
        url: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('user-agent'),
        ip: req.ip
      };

      if (res.statusCode >= 400) {
        this.error(`HTTP ${res.statusCode} - ${req.method} ${req.path}`, meta);
      } else {
        this.info(`HTTP ${res.statusCode} - ${req.method} ${req.path}`, meta);
      }
    });

    next();
  }

  // Log report activities
  logReportActivity(action, reportId, meta = {}) {
    this.info(`Report Activity: ${action}`, {
      reportId,
      action,
      timestamp: new Date().toISOString(),
      ...meta
    });
  }
}

module.exports = new Logger();