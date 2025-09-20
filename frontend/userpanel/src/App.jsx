import React, { useState, useEffect } from "react";
import HomePage from "./components/HomePage";
import ProfilePage from "./components/ProfilePage";
import ReportsPage from "./components/ReportsPage";
import ReportForm from "./components/ReportForm";
import Navigation from "./components/Navigation";
import "./index.css";

// Main App Component
function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Simple Android scrolling fix
  useEffect(() => {
    // Force scrolling on mobile devices
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // Wait for DOM to be ready
      setTimeout(() => {
        const mainContent = document.querySelector(".civic-main-content");
        if (mainContent) {
          // Force scrolling properties
          mainContent.style.overflowY = "scroll";
          mainContent.style.webkitOverflowScrolling = "touch";
          mainContent.style.height = "calc(100vh - 90px)";
          mainContent.style.position = "relative";

          // Test scroll
          console.log("Mobile scrolling enabled");
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

  // Show Report Form
  if (showReportForm) {
    return (
      <ReportForm
        onBack={handleReportFormBack}
        preSelectedCategory={selectedCategory}
      />
    );
  }

  // Main App with Navigation
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

export default App;
