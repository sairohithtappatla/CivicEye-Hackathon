import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ReportForm from "./pages/ReportForm";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-100 p-8">
        <Routes>
          {/* Default homepage → Dashboard */}
          <Route path="/" element={<Dashboard />} />
          {/* Report page */}
          <Route path="/report" element={<ReportForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
