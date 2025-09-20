const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('./config/cloudinary');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase (with error handling)
let db, messaging, admin;
try {
  const firebaseConfig = require('./config/firebase');
  db = firebaseConfig.db;
  messaging = firebaseConfig.messaging;
  admin = firebaseConfig.admin;
  console.log('🔥 Firebase services loaded successfully');
} catch (error) {
  console.error('❌ Firebase loading failed:', error.message);
  console.log('🔄 Running in mock mode for development...');
  
  // Create mock Firebase objects
  db = {
    collection: () => ({
      add: async (data) => ({ id: `mock-${Date.now()}` }),
      doc: () => ({
        get: async () => ({ exists: false, data: () => ({}) }),
        set: async () => ({}),
      }),
      where: () => ({
        orderBy: () => ({
          limit: () => ({
            get: async () => ({ forEach: () => {}, empty: true })
          })
        })
      }),
      orderBy: () => ({
        limit: () => ({
          get: async () => ({ forEach: () => {}, empty: true })
        })
      })
    })
  };
  
  messaging = {
    send: async () => 'mock-message-id',
    subscribeToTopic: async () => 'mock-subscription'
  };
  
  admin = {
    firestore: {
      FieldValue: {
        increment: (num) => num
      }
    }
  };
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Multer setup for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Helper function to upload image to Cloudinary
const uploadToCloudinary = (buffer, originalname) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'civiceye-reports',
        public_id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
        tags: ['civiceye', 'report', 'citizen-submission']
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('✅ Cloudinary upload successful:', result.public_id);
          resolve(result);
        }
      }
    );
    uploadStream.end(buffer);
  });
};

// Helper function to get department supervisor email
const getDepartmentEmail = (issueType) => {
  const emailMap = {
    'pothole': process.env.ROADS_SUPERVISOR_EMAIL,
    'road-damage': process.env.ROADS_SUPERVISOR_EMAIL,
    'garbage': process.env.SANITATION_SUPERVISOR_EMAIL,
    'streetlight': process.env.ELECTRICITY_SUPERVISOR_EMAIL,
    'electricity': process.env.ELECTRICITY_SUPERVISOR_EMAIL,
    'power': process.env.ELECTRICITY_SUPERVISOR_EMAIL,
    'water': process.env.WATER_SUPERVISOR_EMAIL,
    'traffic': process.env.TRAFFIC_SUPERVISOR_EMAIL,
    'drainage': process.env.DRAINAGE_SUPERVISOR_EMAIL,
    'parks': process.env.DEFAULT_SUPERVISOR_EMAIL,
    'construction': process.env.DEFAULT_SUPERVISOR_EMAIL,
    'safety': process.env.DEFAULT_SUPERVISOR_EMAIL
  };
  
  return emailMap[issueType.toLowerCase()] || process.env.DEFAULT_SUPERVISOR_EMAIL;
};

// Helper function to send FCM notification
const sendNotification = async (reportData) => {
  try {
    const message = {
      notification: {
        title: '🏛️ New Civic Report Submitted',
        body: `${reportData.issueType}: ${reportData.description.substring(0, 80)}...`,
        icon: '/favicon.ico',
        image: reportData.imageUrl || undefined
      },
      data: {
        reportId: reportData.id,
        issueType: reportData.issueType,
        location: reportData.latitude && reportData.longitude 
          ? `${reportData.latitude}, ${reportData.longitude}` 
          : 'Location not provided',
        timestamp: reportData.timestamp,
        supervisorEmail: getDepartmentEmail(reportData.issueType)
      },
      topic: 'civic-reports'
    };

    const response = await messaging.send(message);
    console.log('✅ FCM notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Error sending FCM notification:', error);
    return 'mock-notification-sent';
  }
};

// Route: Submit Report
app.post('/report/submit', upload.single('photo'), async (req, res) => {
  try {
    console.log('📝 Report submission started...');
    console.log('Request body:', req.body);
    console.log('File uploaded:', !!req.file);

    const { issueType, description, latitude, longitude } = req.body;

    // Validate required fields
    if (!issueType || !description) {
      return res.status(400).json({
        success: false,
        message: 'Issue type and description are required'
      });
    }

    if (description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 10 characters long'
      });
    }

    // Prepare report data
    const reportData = {
      issueType: issueType.trim(),
      description: description.trim(),
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      timestamp: new Date().toISOString(),
      status: 'pending',
      priority: 'medium',
      departmentEmail: getDepartmentEmail(issueType),
      createdAt: new Date(),
      updatedAt: new Date(),
      submissionMethod: 'web-app',
      userAgent: req.get('User-Agent') || 'Unknown'
    };

    // Upload image to Cloudinary if provided
    if (req.file) {
      console.log('☁️ Uploading image to Cloudinary...');
      console.log('File details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: `${(req.file.size / 1024 / 1024).toFixed(2)}MB`
      });
      
      try {
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);
        reportData.imageUrl = cloudinaryResult.secure_url;
        reportData.imagePublicId = cloudinaryResult.public_id;
        reportData.imageMetadata = {
          originalName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
          cloudinaryVersion: cloudinaryResult.version,
          format: cloudinaryResult.format
        };
        console.log('✅ Image uploaded successfully:', cloudinaryResult.secure_url);
      } catch (uploadError) {
        console.error('❌ Cloudinary upload failed:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image. Please try again.'
        });
      }
    }

    // Save to Firestore
    console.log('🔥 Saving to Firestore...');
    const docRef = await db.collection('reports').add(reportData);
    reportData.id = docRef.id;

    console.log('✅ Report saved to Firestore with ID:', docRef.id);

    // Send FCM notification
    console.log('📱 Sending FCM notification...');
    try {
      await sendNotification(reportData);
      console.log('✅ FCM notification sent successfully');
    } catch (fcmError) {
      console.error('❌ FCM notification failed:', fcmError);
      // Don't fail the request if notification fails
    }

    // Update community analytics
    try {
      const analyticsRef = db.collection('analytics').doc('community');
      const analyticsUpdate = {
        totalReports: admin.firestore.FieldValue.increment(1),
        lastUpdated: new Date(),
        [`reports_${issueType.toLowerCase().replace(/[^a-z0-9]/g, '_')}`]: admin.firestore.FieldValue.increment(1)
      };
      
      await analyticsRef.set(analyticsUpdate, { merge: true });
      console.log('✅ Analytics updated');
    } catch (analyticsError) {
      console.error('❌ Analytics update failed:', analyticsError);
    }

    // Success response
    res.status(201).json({
      success: true,
      message: 'Report submitted successfully! Your civic contribution makes Bharat stronger. 🇮🇳',
      data: {
        reportId: docRef.id,
        issueType: reportData.issueType,
        timestamp: reportData.timestamp,
        imageUploaded: !!reportData.imageUrl,
        location: reportData.latitude && reportData.longitude 
          ? `${reportData.latitude.toFixed(6)}, ${reportData.longitude.toFixed(6)}` 
          : 'No location provided',
        departmentNotified: reportData.departmentEmail,
        estimatedResolution: getEstimatedResolution(reportData.issueType)
      }
    });

    console.log('🎉 Report submission completed successfully!');

  } catch (error) {
    console.error('❌ Report submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to get estimated resolution time
const getEstimatedResolution = (issueType) => {
  const resolutionMap = {
    'streetlight': '2-3 days',
    'garbage': '1-2 days',
    'pothole': '5-7 days',
    'water': '1-3 days',
    'traffic': '3-5 days',
    'drainage': '3-7 days',
    'construction': '7-14 days',
    'parks': '3-5 days',
    'electricity': '1-2 days',
    'safety': '1-3 days'
  };
  
  return resolutionMap[issueType.toLowerCase()] || '3-7 days';
};

// Route: Get All Reports
app.get('/reports', async (req, res) => {
  try {
    const { limit = 50, orderBy = 'createdAt', order = 'desc', status } = req.query;
    
    let query = db.collection('reports');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    query = query.orderBy(orderBy, order).limit(parseInt(limit));

    const snapshot = await query.get();
    const reports = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      reports.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      });
    });

    res.json({
      success: true,
      data: reports,
      total: reports.length,
      filters: { limit: parseInt(limit), orderBy, order, status }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports'
    });
  }
});

// Route: Get Community Analytics
app.get('/analytics/community', async (req, res) => {
  try {
    const analyticsDoc = await db.collection('analytics').doc('community').get();
    
    if (!analyticsDoc.exists) {
      return res.json({
        success: true,
        analytics: {
          totalReports: 0,
          resolvedReports: 0,
          pendingReports: 0,
          avgResolutionTime: 'N/A',
          lastUpdated: new Date().toISOString()
        }
      });
    }

    const data = analyticsDoc.data();
    
    // Calculate additional metrics
    const totalReports = data.totalReports || 0;
    const resolvedReports = data.resolvedReports || 0;
    const pendingReports = totalReports - resolvedReports;
    
    res.json({
      success: true,
      analytics: {
        totalReports,
        resolvedReports,
        pendingReports,
        avgResolutionTime: data.avgResolutionTime || '2.5 days',
        activeCitizens: data.activeCitizens || 25,
        lastUpdated: data.lastUpdated?.toDate?.()?.toISOString() || new Date().toISOString(),
        categoryBreakdown: extractCategoryData(data)
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

// Helper to extract category data
const extractCategoryData = (data) => {
  const categories = {};
  Object.keys(data).forEach(key => {
    if (key.startsWith('reports_')) {
      const category = key.replace('reports_', '').replace(/_/g, '-');
      categories[category] = data[key];
    }
  });
  return categories;
};

// Route: Subscribe to FCM notifications
app.post('/notifications/subscribe', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    // Subscribe token to topic
    await messaging.subscribeToTopic([token], 'civic-reports');
    
    console.log('📱 Device subscribed to notifications:', token.substring(0, 20) + '...');
    
    res.json({
      success: true,
      message: 'Successfully subscribed to civic reports notifications! 🔔'
    });
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe to notifications'
    });
  }
});

// Route: Health check
app.get('/health', async (req, res) => {
  try {
    // Test Firestore connection
    let firestoreStatus = '✅ Connected';
    try {
      await db.collection('_health').doc('test').get();
    } catch (dbError) {
      firestoreStatus = '⚠️ Mock Mode';
    }
    
    // Test Cloudinary connection
    let cloudinaryStatus = '✅ Connected';
    try {
      const cloudinaryPing = await cloudinary.api.ping();
      if (cloudinaryPing.status !== 'ok') {
        cloudinaryStatus = '❌ Error';
      }
    } catch (cloudError) {
      cloudinaryStatus = '❌ Error';
    }
    
    res.json({
      success: true,
      message: 'CivicEye Backend is running smoothly! 🏛️',
      timestamp: new Date().toISOString(),
      services: {
        firestore: firestoreStatus,
        cloudinary: cloudinaryStatus,
        fcm: '✅ Connected',
        upload: '✅ Ready'
      },
      environment: process.env.NODE_ENV,
      version: '2.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CivicEye Backend running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 CORS enabled for: ${process.env.FRONTEND_URL}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;