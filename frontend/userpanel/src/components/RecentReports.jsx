import React from "react";

function RecentReports() {
  // placeholder — fetch from backend later
  const reports = [
    { id: 1, issue: "Garbage overflow", status: "Resolved" },
    { id: 2, issue: "Street light not working", status: "Pending" },
    { id: 3, issue: "Road damage near park", status: "In Review" },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 mb-4">
        Recent Reports
      </h2>
      <div className="space-y-3">
        {reports.map((r) => (
          <div
            key={r.id}
            className="p-4 bg-white border rounded-lg shadow-sm flex justify-between items-center"
          >
            <span className="text-slate-700">{r.issue}</span>
            <span className="text-sm text-slate-500">{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentReports;
