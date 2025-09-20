import axios from 'axios';
import { messaging, getToken, onMessage } from '../config/firebase';

const API_BASE_URL = 'http://localhost:3000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`🔗 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Report API
export const reportAPI = {
  // Submit report with image upload
  submit: async (reportData) => {
    try {
      const formData = new FormData();

      // Add text fields
      formData.append('issueType', reportData.issueType);
      formData.append('description', reportData.description);

      if (reportData.latitude) {
        formData.append('latitude', reportData.latitude.toString());
      }
      if (reportData.longitude) {
        formData.append('longitude', reportData.longitude.toString());
      }

      // Add photo if exists
      if (reportData.photo) {
        formData.append('photo', reportData.photo);
        console.log('📸 Photo attached:', reportData.photo.name, `(${(reportData.photo.size / 1024 / 1024).toFixed(2)}MB)`);
      }

      const response = await api.post('/report/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to submit report');
    }
  },

  // Get all reports
  getAll: async (options = {}) => {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.orderBy) params.append('orderBy', options.orderBy);
      if (options.order) params.append('order', options.order);
      if (options.status) params.append('status', options.status);

      const response = await api.get(`/reports?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch reports');
    }
  }
};

// Analytics API
export const analyticsAPI = {
  getCommunityAnalytics: async () => {
    try {
      const response = await api.get('/analytics/community');
      return response.data;
    } catch (error) {
      console.error('Analytics fetch failed:', error);
      return {
        success: false,
        analytics: {
          totalReports: 0,
          resolvedReports: 0,
          avgResolutionTime: 'N/A'
        }
      };
    }
  }
};

// Notification API
export const notificationAPI = {
  // Request notification permission and subscribe
  subscribe: async () => {
    try {
      if (!messaging) {
        console.warn('⚠️ FCM not available in this environment');
        return { success: false, message: 'FCM not supported' };
      }

      // Request permission
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Get FCM token with your actual VAPID key
      const token = await getToken(messaging, {
        vapidKey: 'BPsBCO5ptp2rvyniXqn7vWnDht_DqJKzJXZqH1LX1u17Sinn4wqfX2VpZxuOpCBhyr3U2cFgiW-guw9EIc6jZoI'
      });

      if (!token) {
        throw new Error('Failed to get FCM token');
      }

      console.log('🔑 FCM Token obtained:', token.substring(0, 20) + '...');

      // Subscribe to backend
      const response = await api.post('/notifications/subscribe', { token });

      console.log('🔔 Successfully subscribed to notifications');
      return response.data;
    } catch (error) {
      console.error('❌ Notification subscription failed:', error);
      throw error;
    }
  },

  // Setup foreground message listener
  setupForegroundListener: (callback) => {
    if (!messaging) {
      console.warn('⚠️ FCM not available for foreground messages');
      return () => { };
    }

    return onMessage(messaging, (payload) => {
      console.log('📱 Foreground message received:', payload);

      // Show custom notification or handle as needed
      if (callback) {
        callback(payload);
      }

      // You can also show a browser notification
      if (Notification.permission === 'granted') {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: '/favicon.ico',
          tag: 'civiceye-foreground',
          data: payload.data
        });
      }
    });
  }
};

// User API (enhanced with real trending data)
export const userAPI = {
  getSuggestions: async () => {
    try {
      // Try to get real trending data from analytics
      const analyticsResponse = await analyticsAPI.getCommunityAnalytics();

      if (analyticsResponse.success && analyticsResponse.analytics.categoryBreakdown) {
        const breakdown = analyticsResponse.analytics.categoryBreakdown;
        const trending = Object.entries(breakdown)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([category, count]) => ({ category, count }));

        return {
          success: true,
          suggestions: {
            trendingCategories: trending.length > 0 ? trending : [
              { category: 'streetlight', count: 15 },
              { category: 'garbage', count: 12 },
              { category: 'pothole', count: 8 }
            ]
          }
        };
      }

      // Fallback to mock data
      return {
        success: true,
        suggestions: {
          trendingCategories: [
            { category: 'streetlight', count: 15 },
            { category: 'garbage', count: 12 },
            { category: 'pothole', count: 8 }
          ]
        }
      };
    } catch (error) {
      console.error('Suggestions fetch failed:', error);
      return {
        success: true,
        suggestions: {
          trendingCategories: [
            { category: 'streetlight', count: 15 },
            { category: 'garbage', count: 12 },
            { category: 'pothole', count: 8 }
          ]
        }
      };
    }
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('Backend health check failed');
  }
};

export default api;