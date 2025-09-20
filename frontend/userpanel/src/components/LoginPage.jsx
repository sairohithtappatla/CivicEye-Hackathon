// Create this new file

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext"; // Fixed path
import { User, Lock, Mail, Phone, MapPin, Eye, EyeOff } from "lucide-react";

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { login, register } = useAuth();

  // Sample accounts for easy testing
  const sampleAccounts = [
    {
      email: "citizen1@civiceye.com",
      password: "password123",
      role: "Citizen",
    },
    {
      email: "citizen2@civiceye.com",
      password: "password123",
      role: "Citizen",
    },
    { email: "admin@civiceye.com", password: "admin123", role: "Admin" },
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const fillSampleAccount = (account) => {
    setFormData({
      ...formData,
      email: account.email,
      password: account.password,
    });
    setMessage(`${account.role} account loaded! Click login.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          setMessage("Login successful! Redirecting...");
        } else {
          setMessage(result.error || "Login failed");
        }
      } else {
        const result = await register(formData);
        if (result.success) {
          setMessage("Registration successful! Welcome to CivicEye!");
        } else {
          setMessage(result.error || "Registration failed");
        }
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="civic-login-page-perfect">
      <div className="civic-login-container-perfect">
        {/* Header Section */}
        <div className="civic-login-header-perfect">
          <div className="civic-login-logo-perfect">🏛️</div>
          <h1 className="civic-login-title-perfect">CivicEye</h1>
          <p className="civic-login-subtitle-perfect">
            Building better communities together
          </p>
        </div>

        {/* Sample Accounts Section */}
        <div className="civic-sample-accounts-perfect">
          <h3 className="civic-sample-title">
            🧪 Sample Accounts for MVP Testing
          </h3>
          <div className="civic-sample-grid">
            {sampleAccounts.map((account, index) => (
              <button
                key={index}
                onClick={() => fillSampleAccount(account)}
                className="civic-sample-btn-perfect"
                type="button"
              >
                <div className="civic-sample-role">{account.role}</div>
                <div className="civic-sample-email">{account.email}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="civic-login-tabs-perfect">
          <button
            onClick={() => setIsLogin(true)}
            className={`civic-login-tab-perfect ${isLogin ? "active" : ""}`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`civic-login-tab-perfect ${!isLogin ? "active" : ""}`}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="civic-login-form-perfect">
          {!isLogin && (
            <div className="civic-input-group-perfect">
              <div className="civic-input-icon">
                <User size={18} />
              </div>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                required={!isLogin}
                className="civic-input-field-perfect"
              />
            </div>
          )}

          <div className="civic-input-group-perfect">
            <div className="civic-input-icon">
              <Mail size={18} />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="civic-input-field-perfect"
            />
          </div>

          <div className="civic-input-group-perfect">
            <div className="civic-input-icon">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="civic-input-field-perfect"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="civic-password-toggle"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {!isLogin && (
            <>
              <div className="civic-input-group-perfect">
                <div className="civic-input-icon">
                  <Phone size={18} />
                </div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required={!isLogin}
                  className="civic-input-field-perfect"
                />
              </div>

              <div className="civic-input-group-perfect">
                <div className="civic-input-icon">
                  <MapPin size={18} />
                </div>
                <input
                  type="text"
                  name="location"
                  placeholder="City, State (e.g., Bengaluru, Karnataka)"
                  value={formData.location}
                  onChange={handleInputChange}
                  required={!isLogin}
                  className="civic-input-field-perfect"
                />
              </div>
            </>
          )}

          {message && (
            <div
              className={`civic-message-perfect ${
                message.includes("successful") || message.includes("loaded")
                  ? "success"
                  : "error"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            className="civic-login-button-perfect"
            disabled={loading}
          >
            {loading ? (
              <div className="civic-spinner-small-perfect"></div>
            ) : isLogin ? (
              "Login to CivicEye"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="civic-login-footer-perfect">
          <p>🔒 Secure • 🇮🇳 Made in India • 🏛️ Government Approved</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
