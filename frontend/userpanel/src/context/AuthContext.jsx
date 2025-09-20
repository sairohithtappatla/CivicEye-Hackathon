import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const savedUser = localStorage.getItem("civiceye_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("civiceye_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Mock authentication - replace with real API call
      const mockUser = {
        email,
        name: email.includes("admin") ? "Admin User" : "Citizen User",
        role: email.includes("admin") ? "admin" : "citizen",
        id: Date.now().toString(),
      };

      setUser(mockUser);
      localStorage.setItem("civiceye_user", JSON.stringify(mockUser));

      return { success: true, user: mockUser };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Login failed" };
    }
  };

  const register = async (userData) => {
    try {
      // Mock registration - replace with real API call
      const newUser = {
        ...userData,
        id: Date.now().toString(),
        role: "citizen",
      };

      setUser(newUser);
      localStorage.setItem("civiceye_user", JSON.stringify(newUser));

      return { success: true, user: newUser };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: "Registration failed" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("civiceye_user");
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
