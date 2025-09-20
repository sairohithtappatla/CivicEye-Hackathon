// Create this new file first

import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Mock data for MVP testing
const mockUsers = [
  {
    id: 1,
    email: "citizen1@civiceye.com",
    password: "password123",
    name: "Rajesh Kumar",
    role: "citizen",
    location: "HSR Layout, Bengaluru",
    phone: "+91 98765 43210",
    ward: "Ward 184",
  },
  {
    id: 2,
    email: "citizen2@civiceye.com",
    password: "password123",
    name: "Priya Sharma",
    role: "citizen",
    location: "Koramangala, Bengaluru",
    phone: "+91 98765 43211",
    ward: "Ward 154",
  },
  {
    id: 3,
    email: "admin@civiceye.com",
    password: "admin123",
    name: "Municipal Officer",
    role: "admin",
    location: "BBMP Office, Bengaluru",
    phone: "+91 98765 43212",
    department: "Municipal Corporation",
  },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = () => {
      try {
        const token = localStorage.getItem("civicEyeToken");
        const userStr = localStorage.getItem("civicEyeUser");

        if (token && userStr) {
          const userData = JSON.parse(userStr);
          setUser(userData);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        localStorage.removeItem("civicEyeToken");
        localStorage.removeItem("civicEyeUser");
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials) => {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const foundUser = mockUsers.find(
        (u) =>
          u.email === credentials.email && u.password === credentials.password
      );

      if (foundUser) {
        const token = `mock_token_${foundUser.id}_${Date.now()}`;
        const userWithoutPassword = { ...foundUser };
        delete userWithoutPassword.password;

        localStorage.setItem("civicEyeToken", token);
        localStorage.setItem(
          "civicEyeUser",
          JSON.stringify(userWithoutPassword)
        );
        setUser(userWithoutPassword);

        return { success: true };
      } else {
        return {
          success: false,
          message: "Invalid email or password",
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "Login failed. Please try again.",
      };
    }
  };

  const register = async (userData) => {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const existingUser = mockUsers.find((u) => u.email === userData.email);
      if (existingUser) {
        return {
          success: false,
          message: "User with this email already exists",
        };
      }

      // Add new user to mock data
      const newUser = {
        id: mockUsers.length + 1,
        ...userData,
        role: "citizen",
      };

      mockUsers.push(newUser);

      return {
        success: true,
        message: "Registration successful! Please login.",
      };
    } catch (error) {
      return {
        success: false,
        message: "Registration failed. Please try again.",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("civicEyeToken");
    localStorage.removeItem("civicEyeUser");
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
