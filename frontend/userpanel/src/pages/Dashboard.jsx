import React from "react";
import HeroSection from "../components/HeroSection";
import QuickCategories from "../components/QuickCategories";
import CityProgress from "../components/CityProgress";
import RecentReports from "../components/RecentReports";
import CommunityEngagement from "../components/CommunityEngagement";
import Toast from "../components/Toast";

function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 space-y-10">
      <HeroSection />
      <QuickCategories />
      <CityProgress />
      <RecentReports />
      <CommunityEngagement />
      {/* Removed Description since no such component exists */}
      <Toast />
    </div>
  );
}

export default Dashboard;
