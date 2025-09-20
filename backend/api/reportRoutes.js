const express = require('express');
const { validateReport, validateStatusUpdate } = require('../models/reportValidation');
const firebaseService = require('../services/firebaseService');
const cloudinaryService = require('../services/cloudinaryService');
const { sendSLAAlert, sendStatusUpdateNotification, sendReportConfirmation } = require('../utils/emailService');
const { v4: uuidv4 } = require('uuid');
const geolib = require('geolib');

const router = express.Router();
let reportCounter = 1;

// ✅ 1. SUBMIT NEW REPORT - /api/reports/submit
router.post('/submit', async (req, res) => {
  try {
    console.log('📥 Received report submission request');

    // Validate request data
    const { error, value } = validateReport(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    // Generate unique identifiers
    const reportId = uuidv4();
    const ticketNumber = `CE${String(reportCounter++).padStart(6, '0')}`;

    // Check for duplicates
    const duplicateCheck = await checkForDuplicates(value);
    if (duplicateCheck.isDuplicate) {
      return res.status(200).json({
        message: 'Similar report already exists',
        isDuplicate: true,
        existingReport: duplicateCheck.existingReport,
        similarityScore: duplicateCheck.score
      });
    }

    // Upload photo to Cloudinary
    let photoData = null;
    if (value.photo) {
      console.log('📸 Uploading photo to Cloudinary...');
      photoData = await cloudinaryService.uploadReportPhoto(value.photo, ticketNumber, reportId);

      if (!photoData.success) {
        return res.status(500).json({
          error: 'Failed to upload photo',
          details: photoData.error
        });
      }
    }

    // Calculate priority and assign department
    const priority = calculatePriority(value);
    const assignedDepartment = getDepartmentByCategory(value.category);

    // Create new report object
    const newReport = {
      id: reportId,
      ticketNumber,
      title: value.title || `${value.category || value.issueType || 'Civic'} report - ${value.description.substring(0, 50)}...`, category: value.category || value.issueType, // ✅ Handle both field names
      location: value.location,
      reportedBy: value.reportedBy,
      reporterName: value.reporterName,
      reporterPhone: value.reporterPhone,
      status: 'submitted',
      priority,
      assignedDepartment,
      severity: value.severity || 'medium',
      isAnonymous: value.isAnonymous || false,
      photo: photoData ? {
        url: photoData.url,
        publicId: photoData.publicId,
        thumbnail: cloudinaryService.generateThumbnail(photoData.publicId)
      } : null,
      timeline: [{
        status: 'submitted',
        timestamp: new Date().toISOString(),
        note: 'Report submitted by citizen',
        updatedBy: value.reportedBy
      }],
      analytics: {
        priorityScore: calculatePriorityScore(value),
        riskLevel: calculateRiskLevel(value),
        estimatedResolutionTime: getEstimatedResolutionTime(priority, value.category)
      }
    };

    // Save to Firestore
    console.log('💾 Saving report to Firestore...');
    const saveResult = await firebaseService.saveReport(newReport);

    if (!saveResult.success) {
      return res.status(500).json({
        error: 'Failed to save report',
        details: saveResult.error
      });
    }

    // Send confirmation email
    console.log('📧 Sending confirmation email...');
    const emailResult = await sendReportConfirmation(newReport);

    // Send FCM notification (if token provided)
    if (value.fcmToken) {
      await firebaseService.sendNotification(
        value.fcmToken,
        {
          title: '✅ Report Submitted Successfully',
          body: `Your report #${ticketNumber} has been received and assigned to ${assignedDepartment}`,
          imageUrl: photoData?.url
        },
        {
          type: 'report_confirmation',
          ticketNumber,
          reportId
        }
      );
    }

    // 🔥 SMART NOTIFICATIONS AND USER UPDATES
    try {
      // 1. Send confirmation to reporter
      if (value.reportedBy) {
        await firebaseService.sendSmartNotification(
          value.reportedBy,
          'report_submitted',
          {
            ticketNumber,
            department: assignedDepartment,
            priority,
            estimatedResolution: getEstimatedResolutionTime(priority, value.category),
            photoUrl: photoData?.url
          }
        );

        // 2. Update user statistics
        await firebaseService.updateUserStats(value.reportedBy, { reportsSubmitted: 1 });
      }

      // 3. Notify admin for critical issues
      if (priority === 'critical') {
        await firebaseService.sendSmartNotification(
          'admin@example.com', // MVP admin email
          'critical_report_assigned',
          {
            ticketNumber,
            category: value.category,
            location: value.location?.address || 'Location not specified',
            reportedBy: value.isAnonymous ? 'Anonymous' : value.reporterName,
            description: value.description.substring(0, 100) + '...'
          }
        );
      }

      console.log(`🚀 Smart features triggered for report: ${ticketNumber}`);
    } catch (notificationError) {
      console.error('⚠️ Smart features failed (non-critical):', notificationError.message);
      // Don't fail the report submission if smart features fail
    }

    // Response
    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      report: {
        id: newReport.id,
        ticketNumber: newReport.ticketNumber,
        status: newReport.status,
        priority: newReport.priority,
        assignedDepartment: newReport.assignedDepartment,
        estimatedResolutionTime: newReport.analytics.estimatedResolutionTime,
        photoUrl: photoData?.url,
        thumbnail: photoData ? cloudinaryService.generateThumbnail(photoData.publicId) : null
      },
      emailSent: emailResult.success,
      fcmSent: !!value.fcmToken
    });

  } catch (error) {
    console.error('❌ Error submitting report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit report',
      details: error.message
    });
  }
});

// ✅ 2. GET REPORTS LIST - /api/reports/list
router.get('/list', async (req, res) => {
  try {
    const {
      status,
      category,
      priority,
      department,
      reportedBy,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      ward,
      startDate,
      endDate
    } = req.query;

    // Build filters
    const filters = {};
    if (status) filters.status = status;
    if (category) filters.category = category;
    if (priority) filters.priority = priority;
    if (department) filters.assignedDepartment = department;
    if (reportedBy) filters.reportedBy = reportedBy;

    // Build pagination
    const pagination = {
      limit: parseInt(limit),
      sortBy,
      sortOrder
    };

    // Fetch from Firestore
    const result = await firebaseService.getReports(filters, pagination);

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to fetch reports',
        details: result.error
      });
    }

    let reports = result.reports;

    // Additional filtering (for complex queries)
    if (ward) {
      reports = reports.filter(r => r.location.ward === ward);
    }

    if (startDate || endDate) {
      reports = reports.filter(r => {
        const reportDate = new Date(r.createdAt);
        if (startDate && reportDate < new Date(startDate)) return false;
        if (endDate && reportDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Apply pagination to filtered results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedReports = reports.slice(startIndex, endIndex);

    res.json({
      success: true,
      reports: paginatedReports.map(report => ({
        ...report,
        thumbnail: report.photo?.publicId ?
          cloudinaryService.generateThumbnail(report.photo.publicId) : null
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(reports.length / limit),
        totalReports: reports.length,
        hasNext: endIndex < reports.length,
        hasPrev: startIndex > 0
      }
    });

  } catch (error) {
    console.error('❌ Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports',
      details: error.message
    });
  }
});

// ✅ 3. GET SPECIFIC REPORT - /api/reports/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await firebaseService.getReportById(req.params.id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    const report = result.report;

    // Add thumbnail if photo exists
    if (report.photo?.publicId) {
      report.thumbnail = cloudinaryService.generateThumbnail(report.photo.publicId);
    }

    res.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('❌ Error fetching report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report',
      details: error.message
    });
  }
});

// ✅ 4. UPDATE REPORT STATUS - /api/reports/update/:id
router.put('/update/:id', async (req, res) => {
  try {
    const { error, value } = validateStatusUpdate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    // Get existing report
    const existingResult = await firebaseService.getReportById(req.params.id);
    if (!existingResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    const existingReport = existingResult.report;
    const oldStatus = existingReport.status;

    // Handle after photo upload if provided
    let afterPhotoData = null;
    if (value.afterPhoto) {
      console.log('📸 Uploading after photo to Cloudinary...');
      afterPhotoData = await cloudinaryService.uploadAfterPhoto(
        value.afterPhoto,
        existingReport.ticketNumber,
        existingReport.id
      );
    }

    // Prepare update data
    const updateData = {
      status: value.status,
      assignedTo: value.assignedTo || existingReport.assignedTo,
      resolution: value.resolution || existingReport.resolution,
      timeline: [
        ...existingReport.timeline,
        {
          status: value.status,
          timestamp: new Date().toISOString(),
          note: value.note || `Status changed from ${oldStatus} to ${value.status}`,
          updatedBy: value.updatedBy || 'system'
        }
      ]
    };

    if (afterPhotoData?.success) {
      updateData.afterPhoto = {
        url: afterPhotoData.url,
        publicId: afterPhotoData.publicId,
        thumbnail: cloudinaryService.generateThumbnail(afterPhotoData.publicId)
      };
    }

    // Update in Firestore
    const updateResult = await firebaseService.updateReport(req.params.id, updateData);

    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update report'
      });
    }

    // Get updated report
    const updatedResult = await firebaseService.getReportById(req.params.id);
    const updatedReport = updatedResult.report;

    // Send email notification
    try {
      await sendStatusUpdateNotification(updatedReport, updatedReport.reportedBy);
      console.log(`✅ Email notification sent for report ${updatedReport.ticketNumber}`);
    } catch (emailError) {
      console.error(`❌ Failed to send email notification:`, emailError);
    }

    // Send FCM notification if token available
    if (updatedReport.fcmToken) {
      await firebaseService.sendNotification(
        updatedReport.fcmToken,
        {
          title: `📋 Report Update: ${updatedReport.ticketNumber}`,
          body: `Status changed to: ${value.status.toUpperCase()}`,
          imageUrl: afterPhotoData?.url
        },
        {
          type: 'status_update',
          ticketNumber: updatedReport.ticketNumber,
          newStatus: value.status
        }
      );
    }

    // 🔥 SMART NOTIFICATIONS AND USER UPDATES

    // 1. Send status update to reporter
    await firebaseService.sendSmartNotification(
      updatedReport.reportedBy,
      'report_status_updated',
      {
        ticketNumber: updatedReport.ticketNumber,
        newStatus: value.status,
        assignedTo: value.assignedTo || updatedReport.assignedTo,
        resolution: value.resolution || updatedReport.resolution,
        photoUrl: afterPhotoData?.url
      }
    );

    // 2. Notify admin for critical updates
    if (updatedReport.priority === 'critical' && oldStatus !== 'closed') {
      await firebaseService.sendSmartNotification(
        'admin@example.com', // MVP admin email
        'critical_report_status_update',
        {
          ticketNumber: updatedReport.ticketNumber,
          newStatus: value.status,
          assignedTo: value.assignedTo || updatedReport.assignedTo,
          resolution: value.resolution || updatedReport.resolution,
          category: updatedReport.category,
          location: updatedReport.location?.address || 'Location not specified',
          reportedBy: updatedReport.isAnonymous ? 'Anonymous' : updatedReport.reporterName,
          description: updatedReport.description.substring(0, 100) + '...'
        }
      );
    }

    res.json({
      success: true,
      message: 'Report updated successfully',
      report: updatedReport,
      emailSent: true,
      fcmSent: !!updatedReport.fcmToken
    });

  } catch (error) {
    console.error('❌ Error updating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update report',
      details: error.message
    });
  }
});

// ✅ 5. CLOSE REPORT - /api/reports/close/:id
router.put('/close/:id', async (req, res) => {
  try {
    const { resolution, rating, feedback, closedBy } = req.body;

    // Get existing report
    const existingResult = await firebaseService.getReportById(req.params.id);
    if (!existingResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    const existingReport = existingResult.report;

    // Update data for closing
    const updateData = {
      status: 'closed',
      resolution: resolution || 'Report closed',
      closedAt: new Date().toISOString(),
      closedBy: closedBy || 'system',
      rating: rating || null,
      feedback: feedback || null,
      timeline: [
        ...existingReport.timeline,
        {
          status: 'closed',
          timestamp: new Date().toISOString(),
          note: `Report closed. Resolution: ${resolution || 'Report closed'}`,
          updatedBy: closedBy || 'system'
        }
      ]
    };

    // Update in Firestore
    const updateResult = await firebaseService.updateReport(req.params.id, updateData);

    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to close report'
      });
    }

    // Get updated report
    const updatedResult = await firebaseService.getReportById(req.params.id);
    const updatedReport = updatedResult.report;

    // Send closure notification
    try {
      await sendStatusUpdateNotification(updatedReport, updatedReport.reportedBy);
    } catch (emailError) {
      console.error('❌ Failed to send closure email:', emailError);
    }

    // 🔥 SMART NOTIFICATIONS AND USER UPDATES

    // 1. Send closure confirmation to reporter
    await firebaseService.sendSmartNotification(
      updatedReport.reportedBy,
      'report_closed',
      {
        ticketNumber: updatedReport.ticketNumber,
        resolution: resolution || 'Report closed',
        feedback: feedback || null,
        rating: rating || null
      }
    );

    // 2. Update user statistics
    await firebaseService.updateUserStats(updatedReport.reportedBy, { reportsClosed: 1 });

    // 3. Notify admin on report closure
    await firebaseService.sendSmartNotification(
      'admin@example.com', // MVP admin email
      'report_closed_notification',
      {
        ticketNumber: updatedReport.ticketNumber,
        resolution: resolution || 'Report closed',
        feedback: feedback || null,
        rating: rating || null,
        category: updatedReport.category,
        location: updatedReport.location?.address || 'Location not specified',
        reportedBy: updatedReport.isAnonymous ? 'Anonymous' : updatedReport.reporterName,
        description: updatedReport.description.substring(0, 100) + '...'
      }
    );

    res.json({
      success: true,
      message: 'Report closed successfully',
      report: updatedReport
    });

  } catch (error) {
    console.error('❌ Error closing report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to close report',
      details: error.message
    });
  }
});

// ✅ 6. TEST EMAIL ENDPOINT
router.post('/test-email', async (req, res) => {
  try {
    const testReport = {
      id: 'test123',
      ticketNumber: 'CE999999',
      title: 'Test Email Notification',
      description: 'This is a test email to verify email functionality',
      category: 'water',
      status: 'acknowledged',
      priority: 'high',
      assignedDepartment: 'Water Supply Department',
      reportedBy: 'sairohithtappatla45@gmail.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      location: {
        address: 'Test Location, Bangalore',
        latitude: 12.9716,
        longitude: 77.5946
      },
      timeline: [
        {
          status: 'submitted',
          timestamp: new Date().toISOString(),
          note: 'Test report submitted'
        }
      ]
    };

    const result = await sendReportConfirmation(testReport);

    res.json({
      success: true,
      message: 'Test email sent',
      result: result,
      emailSent: result.success
    });

  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      details: error.message
    });
  }
});

// 🔍 HELPER FUNCTIONS

// Duplicate detection with geolocation
async function checkForDuplicates(newReport) {
  try {
    const filters = {
      category: newReport.category
    };

    const result = await firebaseService.getReports(filters);
    if (!result.success) return { isDuplicate: false };

    const existingReports = result.reports;

    const duplicates = existingReports.filter(existing => {
      // Skip if resolved/closed
      if (['resolved', 'closed'].includes(existing.status)) return false;

      // Check location proximity (within 100 meters)
      const distance = calculateDistance(
        { latitude: existing.location.latitude, longitude: existing.location.longitude },
        { latitude: newReport.location.latitude, longitude: newReport.location.longitude }
      );

      if (distance > 100) return false; // 100 meters threshold

      // Check time proximity (within 24 hours)
      const timeDiff = Date.now() - new Date(existing.createdAt).getTime();
      if (timeDiff > 24 * 60 * 60 * 1000) return false; // 24 hours

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
  } catch (error) {
    console.error('❌ Error checking duplicates:', error);
    return { isDuplicate: false };
  }
}

// Calculate distance between two coordinates
function calculateDistance(coord1, coord2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = coord1.latitude * Math.PI / 180;
  const φ2 = coord2.latitude * Math.PI / 180;
  const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Enhanced priority calculation
function calculatePriority(report) {
  let score = 50; // Base score

  // Critical keywords
  const criticalWords = ['emergency', 'urgent', 'dangerous', 'fire', 'flood', 'accident'];
  const highWords = ['water', 'traffic', 'signal', 'school', 'hospital'];
  const fullText = `${report.title} ${report.description}`.toLowerCase();

  if (criticalWords.some(word => fullText.includes(word))) score += 40;
  else if (highWords.some(word => fullText.includes(word))) score += 25;

  // Category-based scoring
  const categoryScores = {
    'water': 30, 'traffic': 25, 'streetlight': 15,
    'drainage': 20, 'pothole': 10, 'garbage': 5
  };
  score += categoryScores[report.category] || 0;

  // User severity
  const severityScores = { 'critical': 30, 'high': 20, 'medium': 0, 'low': -10 };
  score += severityScores[report.severity] || 0;

  // Convert to priority
  if (score >= 80) return 'critical';
  if (score >= 65) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

function calculatePriorityScore(report) {
  // Return numerical score for analytics
  let score = 50;
  const fullText = `${report.title} ${report.description}`.toLowerCase();

  if (['emergency', 'urgent', 'dangerous'].some(word => fullText.includes(word))) score += 40;
  if (['water', 'traffic', 'signal'].some(word => fullText.includes(word))) score += 25;

  const categoryScores = { 'water': 30, 'traffic': 25, 'streetlight': 15 };
  score += categoryScores[report.category] || 0;

  return Math.min(score, 100);
}

function calculateRiskLevel(report) {
  const score = calculatePriorityScore(report);
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

function calculateSimilarityScore(report1, report2) {
  let score = 0;

  // Category match
  if (report1.category === report2.category) score += 40;

  // Location proximity
  const distance = calculateDistance(
    { latitude: report1.location.latitude, longitude: report1.location.longitude },
    { latitude: report2.location.latitude, longitude: report2.location.longitude }
  );

  if (distance < 50) score += 30;
  else if (distance < 100) score += 20;

  // Text similarity (basic)
  const words1 = report1.description.toLowerCase().split(' ');
  const words2 = report2.description.toLowerCase().split(' ');
  const commonWords = words1.filter(word => words2.includes(word));
  score += Math.min((commonWords.length / Math.max(words1.length, words2.length)) * 30, 30);

  return Math.min(score, 100);
}

function getDepartmentByCategory(category) {
  const departments = {
    'pothole': 'Roads & Infrastructure Department',
    'garbage': 'Sanitation Department',
    'streetlight': 'Electricity Department',
    'water': 'Water Supply Department',
    'traffic': 'Traffic Police Department',
    'drainage': 'Drainage Department',
    'construction': 'Building & Construction Department'
  };
  return departments[category] || 'General Administration';
}

// Add this helper function at the end of the file (before module.exports)

function getEstimatedResolutionTime(priority, category) {
  const baseTimes = {
    'critical': '4 hours',
    'high': '24 hours',
    'medium': '72 hours',
    'low': '7 days'
  };

  return baseTimes[priority] || '72 hours';
}

module.exports = router;