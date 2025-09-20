import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import HomePage from "./components/HomePage";
import ProfilePage from "./components/ProfilePage";
import ReportsPage from "./components/ReportsPage";
import ReportForm from "./components/ReportForm";
import LoginPage from "./components/LoginPage";
import Navigation from "./components/Navigation";
import "./index.css";

// Main App Component
function AppContent() {
  const [currentPage, setCurrentPage] = useState("home");
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { user, loading, isAuthenticated } = useAuth();

  // Mobile scrolling fix
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      setTimeout(() => {
        const mainContent = document.querySelector(".civic-main-content");
        if (mainContent) {
          mainContent.style.overflowY = "scroll";
          mainContent.style.webkitOverflowScrolling = "touch";
          mainContent.style.height = "calc(100vh - 90px)";
          mainContent.style.position = "relative";
        }
      }, 200);
    }
  }, []);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setShowReportForm(true);
  };

  const handleReportFormBack = () => {
    setShowReportForm(false);
    setSelectedCategory(null);
    setCurrentPage("home");
  };

  const handleReportIssueClick = () => {
    setSelectedCategory(null);
    setShowReportForm(true);
  };

  if (loading) {
    return (
      <div className="civic-app">
        <div className="civic-loading-container">
          <div className="civic-loading-spinner"></div>
          <h2>Loading CivicEye...</h2>
          <p>Connecting to secure servers</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Show report form
  if (showReportForm) {
    return (
      <ReportForm
        onBack={handleReportFormBack}
        preSelectedCategory={selectedCategory}
      />
    );
  }

  // Main authenticated app
  return (
    <div className="civic-app">
      <div className="civic-main-content">
        {currentPage === "home" && (
          <HomePage
            onCategorySelect={handleCategorySelect}
            onReportClick={handleReportIssueClick}
          />
        )}
        {currentPage === "profile" && <ProfilePage />}
        {currentPage === "reports" && <ReportsPage />}
      </div>

      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </div>
  );
}

// App wrapper with Auth Provider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
