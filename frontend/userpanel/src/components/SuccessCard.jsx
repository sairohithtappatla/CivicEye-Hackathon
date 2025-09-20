import React from "react";

function SuccessCard({ submissionResult, onBack, showToast }) {
  return (
    <div className="civic-success-overlay">
      <div className="civic-success-card">
        <div className="civic-success-header">
          <div className="civic-success-icon">✅</div>
          <h2 className="civic-success-title">
            Report Submitted Successfully!
          </h2>
          <p className="civic-success-subtitle">
            We'll look into it and get back to you
          </p>
        </div>

        <div className="civic-success-details">
          <div className="civic-success-row">
            <span className="civic-success-label">Ticket Number:</span>
            <span className="civic-success-value">
              #{submissionResult?.ticketNumber}
            </span>
          </div>

          <div className="civic-success-row">
            <span className="civic-success-label">Category:</span>
            <div className="civic-success-category">
              <span className="civic-success-category-icon">
                {submissionResult?.category?.icon || "📋"}
              </span>
              <span className="civic-success-category-text">
                {submissionResult?.category?.label ||
                  submissionResult?.issueType}
              </span>
            </div>
          </div>

          <div className="civic-success-row">
            <span className="civic-success-label">Estimated Resolution:</span>
            <span className="civic-success-value-highlight">
              {submissionResult?.estimatedResolution}
            </span>
          </div>
        </div>

        <div className="civic-success-actions">
          <button
            className="civic-success-btn-primary"
            onClick={() => {
              onBack();
            }}
          >
            Back to Home
          </button>
          <button
            className="civic-success-btn-secondary"
            onClick={() => {
              navigator.clipboard.writeText(
                submissionResult?.ticketNumber || ""
              );
              showToast("📋 Ticket number copied!");
            }}
          >
            Copy Ticket Number
          </button>
        </div>

        <div className="civic-success-footer">
          <p className="civic-success-footer-text">
            💚 Thank you for making your community better!
          </p>
        </div>
      </div>
    </div>
  );
}

export default SuccessCard;
