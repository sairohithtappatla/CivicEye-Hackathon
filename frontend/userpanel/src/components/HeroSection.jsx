import React from "react";
import { Link } from "react-router-dom";

function HeroSection() {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-slate-800">
        Serve Bharat — Together We Rise 🇮🇳
      </h1>
      <p className="text-slate-600 mt-2">
        Quick civic updates, one tap away 🚀
      </p>
      <Link
        to="/report"
        className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
      >
        Report an Issue
      </Link>
    </div>
  );
}

export default HeroSection;
