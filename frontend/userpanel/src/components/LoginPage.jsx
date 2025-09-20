// Create this new file

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
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
    setMessage(
      `Sample ${account.role} account loaded. Click Login to continue.`
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isLogin) {
        const result = await login({
          email: formData.email,
          password: formData.password,
        });

        if (!result.success) {
          setMessage(result.message);
        }
      } else {
        if (formData.password.length < 6) {
          setMessage("Password must be at least 6 characters long");
          return;
        }

        const result = await register(formData);

        if (result.success) {
          setMessage("Registration successful! Please login.");
          setIsLogin(true);
          setFormData({ ...formData, password: "" });
        } else {
          setMessage(result.message);
        }
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="civic-login-page">
      <div className="civic-login-container">
        <div className="civic-login-header">
          <div className="civic-login-logo">🏛️</div>
          <h1 className="civic-login-title">CivicEye</h1>
          <p className="civic-login-subtitle">
            Building better communities together
          </p>
        </div>

        {/* Sample Accounts */}
        <div className="civic-sample-accounts">
          <h3>🧪 Sample Accounts for MVP Testing</h3>
          <div className="civic-sample-buttons">
            {sampleAccounts.map((account, index) => (
              <button
                key={index}
                onClick={() => fillSampleAccount(account)}
                className="civic-sample-button"
                type="button"
              >
                {account.role}: {account.email}
              </button>
            ))}
          </div>
        </div>

        <div className="civic-login-tabs">
          <button
            onClick={() => setIsLogin(true)}
            className={`civic-login-tab ${isLogin ? "active" : ""}`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`civic-login-tab ${!isLogin ? "active" : ""}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="civic-login-form">
          {!isLogin && (
            <div className="civic-input-group">
              <User size={18} />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                required={!isLogin}
              />
            </div>
          )}

          <div className="civic-input-group">
            <Mail size={18} />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="civic-input-group">
            <Lock size={18} />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="civic-password-toggle"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {!isLogin && (
            <>
              <div className="civic-input-group">
                <Phone size={18} />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number (+91 XXXXX XXXXX)"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required={!isLogin}
                />
              </div>

              <div className="civic-input-group">
                <MapPin size={18} />
                <input
                  type="text"
                  name="location"
                  placeholder="City, State (e.g., Bengaluru, Karnataka)"
                  value={formData.location}
                  onChange={handleInputChange}
                  required={!isLogin}
                />
              </div>
            </>
          )}

          {message && (
            <div
              className={`civic-message ${
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
            className="civic-login-button"
            disabled={loading}
          >
            {loading ? (
              <div className="civic-spinner-small"></div>
            ) : isLogin ? (
              "Login to CivicEye"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="civic-login-footer">
          <p>🔒 Secure • 🇮🇳 Made in India • 🏛️ Government Approved</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
