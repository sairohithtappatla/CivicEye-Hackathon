import React from "react";
import { Home, User, FileText } from "lucide-react";

function Navigation({ currentPage, setCurrentPage }) {
  return (
    <nav className="civic-nav">
      <button
        className={`civic-nav-item ${currentPage === "home" ? "active" : ""}`}
        onClick={() => setCurrentPage("home")}
      >
        <Home size={20} />
        <span>Home</span>
      </button>
      <button
        className={`civic-nav-item ${
          currentPage === "reports" ? "active" : ""
        }`}
        onClick={() => setCurrentPage("reports")}
      >
        <FileText size={20} />
        <span>Reports</span>
      </button>
      <button
        className={`civic-nav-item ${
          currentPage === "profile" ? "active" : ""
        }`}
        onClick={() => setCurrentPage("profile")}
      >
        <User size={20} />
        <span>Profile</span>
      </button>
    </nav>
  );
}

export default Navigation;
