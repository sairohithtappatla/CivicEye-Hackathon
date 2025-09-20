import axios from 'axios';

// Base API configuration
const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('civicEyeToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('civicEyeToken');
      // Don't reload immediately, let components handle auth state
    }
    return Promise.reject(error);
  }
);

// Mock data for MVP (when backend is not available)
const mockUsers = [
  {
    id: 1,
    email: 'citizen1@civiceye.com',
    password: 'password123',
    name: 'Rajesh Kumar',
    role: 'citizen',
    location: 'HSR Layout, Bengaluru',
    phone: '+91 98765 43210',
    ward: 'Ward 184'
  },
  {
    id: 2,
    email: 'citizen2@civiceye.com',
    password: 'password123',
    name: 'Priya Sharma',
    role: 'citizen',
    location: 'Koramangala, Bengaluru',
    phone: '+91 98765 43211',
    ward: 'Ward 154'
  },
  {
    id: 3,
    email: 'admin@civiceye.com',
    password: 'admin123',
    name: 'Municipal Officer',
    role: 'admin',
    location: 'BBMP Office, Bengaluru',
    phone: '+91 98765 43212',
    department: 'Municipal Corporation'
  }
];

// Mock data for reports
const mockReports = [
  {
    _id: 'report_1',
    ticketNumber: 'CVE-240920-001',
    title: 'Broken Street Light on Brigade Road',
    issueType: 'streetlight',
    status: 'resolved',
    priority: 'medium',
    description: 'Street light pole #BRG-401 has been non-functional for 3 days.',
    location: 'Brigade Road, Near Forum Mall, Bengaluru',
    coordinates: { latitude: 12.9716, longitude: 77.5946 },
    submittedAt: '2024-09-18T14:30:00Z',
    resolvedAt: '2024-09-20T09:15:00Z',
    submittedBy: { name: 'Rajesh Kumar', email: 'citizen1@civiceye.com' },
    department: 'BESCOM'
  },
  {
    _id: 'report_2',
    ticketNumber: 'CVE-240919-002',
    title: 'Garbage Overflow Near HSR Layout',
    issueType: 'garbage',
    status: 'in-progress',
    priority: 'high',
    description: 'Large garbage accumulation blocking pedestrian walkway.',
    location: '27th Main Road, HSR Layout Sector 1',
    coordinates: { latitude: 12.9081, longitude: 77.6476 },
    submittedAt: '2024-09-19T08:45:00Z',
    submittedBy: { name: 'Priya Sharma', email: 'citizen2@civiceye.com' },
    department: 'BBMP Waste Management'
  }
];

// Helper function to get current user
const getCurrentUser = () => {
  const userStr = localStorage.getItem('civicEyeUser');
  return userStr ? JSON.parse(userStr) : null;
};

// Report API
export const reportAPI = {
  submitReport: async (reportData) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const currentUser = getCurrentUser();
    const newReport = {
      _id: `report_${Date.now()}`,
      ticketNumber: `CVE-${Date.now().toString().slice(-6)}`,
      title: `${reportData.issueType} Issue`,
      issueType: reportData.issueType,
      status: 'pending',
      priority: 'medium',
      description: reportData.description,
      location: 'User Location',
      coordinates: {
        latitude: reportData.latitude,
        longitude: reportData.longitude
      },
      submittedAt: new Date().toISOString(),
      submittedBy: currentUser || { name: 'Anonymous', email: 'anonymous@civiceye.com' },
      department: 'Municipal Corporation'
    };

    mockReports.unshift(newReport);

    return {
      data: {
        success: true,
        message: 'Report submitted successfully',
        report: newReport
      }
    };
  },

  getAllReports: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      data: {
        success: true,
        reports: mockReports
      }
    };
  },

  getUserReports: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const currentUser = getCurrentUser();
    const userReports = mockReports.filter(
      report => report.submittedBy.email === currentUser?.email
    );
    return {
      data: {
        success: true,
        reports: userReports
      }
    };
  },
};

// User API
export const userAPI = {
  getDashboard: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const currentUser = getCurrentUser();
    const userReports = mockReports.filter(
      report => report.submittedBy.email === currentUser?.email
    );

    return {
      data: {
        success: true,
        dashboard: {
          profile: currentUser,
          statistics: {
            totalReports: userReports.length,
            resolved: userReports.filter(r => r.status === 'resolved').length,
            pending: userReports.filter(r => r.status === 'pending').length,
            inProgress: userReports.filter(r => r.status === 'in-progress').length,
            avgResolutionTime: '2.3 days'
          }
        }
      }
    };
  },

  getSuggestions: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
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
};

// Analytics API
export const analyticsAPI = {
  getCommunityAnalytics: async () => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return {
      success: true,
      analytics: {
        totalReports: mockReports.length,
        resolvedReports: mockReports.filter(r => r.status === 'resolved').length,
        activeCitizens: 25,
        avgResolutionTime: '2.1 days'
      }
    };
  }
};