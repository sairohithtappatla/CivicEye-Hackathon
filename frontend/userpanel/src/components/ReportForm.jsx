import React, { useState, useRef, useEffect } from "react";
import { Camera, MapPin, CheckCircle } from "lucide-react";
import { reportAPI } from "../services/api";

const issueTypes = [
  { value: "pothole", label: "Road", icon: "🕳️" },
  { value: "water", label: "Water", icon: "💧" },
  { value: "streetlight", label: "Light", icon: "💡" },
  { value: "garbage", label: "Waste", icon: "🗑️" },
  { value: "traffic", label: "Traffic", icon: "🚦" },
  { value: "drainage", label: "Drain", icon: "🌊" },
  { value: "construction", label: "Build", icon: "🏗️" },
  { value: "parks", label: "Parks", icon: "🌳" },
  { value: "electricity", label: "Power", icon: "⚡" },
  { value: "safety", label: "Safety", icon: "🛡️" },
  { value: "noise", label: "Noise", icon: "🔊" },
  { value: "other", label: "Other", icon: "📝" },
];

function ReportForm({ onBack, preSelectedCategory = null }) {
  const [desc, setDesc] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoURL, setPhotoURL] = useState(null);
  const [photoMetadata, setPhotoMetadata] = useState(null);
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [toast, setToast] = useState("");
  const [issueType, setIssueType] = useState(
    preSelectedCategory?.reportValue || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [isBackLoading, setIsBackLoading] = useState(false);

  const fileRef = useRef(null);

  const showToast = (message, duration = 3000) => {
    setToast(message);
    setTimeout(() => setToast(""), duration);
  };

  useEffect(() => {
    if (preSelectedCategory) {
      setIssueType(preSelectedCategory.reportValue);
      showToast(`📋 ${preSelectedCategory.label} category selected!`);
    }
  }, [preSelectedCategory]);

  // Enhanced GPS overlay function
  const addGPSOverlayToImage = async (
    imageFile,
    latitude,
    longitude,
    accuracy = null
  ) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Add enhanced GPS overlay
        addEnhancedGPSInfoOverlay(
          ctx,
          canvas.width,
          canvas.height,
          latitude,
          longitude,
          accuracy
        );

        canvas.toBlob(
          (blob) => {
            const processedFile = new File([blob], imageFile.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(processedFile);
          },
          "image/jpeg",
          0.9
        );
      };

      img.src = URL.createObjectURL(imageFile);
    });
  };

  const addEnhancedGPSInfoOverlay = (
    ctx,
    width,
    height,
    lat,
    lng,
    accuracy
  ) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const timeStr = now.toLocaleTimeString("en-IN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const overlayHeight = Math.max(80, height * 0.08);
    const fontSize = Math.max(12, overlayHeight * 0.12);
    const padding = Math.max(8, overlayHeight * 0.1);

    // Draw main overlay background with gradient
    const gradient = ctx.createLinearGradient(
      0,
      height - overlayHeight,
      0,
      height
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.85)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.95)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height - overlayHeight, width, overlayHeight);

    // Add top border - Blue theme
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(0, height - overlayHeight, width, 2);

    // GPS coordinates
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;

    const locationText =
      lat && lng
        ? `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`
        : "📍 Location unavailable";

    ctx.fillText(
      locationText,
      padding,
      height - overlayHeight + overlayHeight * 0.35
    );

    // Date and time
    ctx.font = `${fontSize * 0.8}px Arial, sans-serif`;
    ctx.fillStyle = "#E5E7EB";
    const dateTimeText = `📅 ${dateStr} ⏰ ${timeStr} IST`;
    ctx.fillText(
      dateTimeText,
      padding,
      height - overlayHeight + overlayHeight * 0.55
    );

    // Accuracy info if available
    if (accuracy) {
      ctx.fillStyle = "#10B981";
      const accuracyText = `🎯 Accuracy: ±${Math.round(accuracy)}m`;
      ctx.fillText(
        accuracyText,
        padding,
        height - overlayHeight + overlayHeight * 0.75
      );
    }

    // CivicEye watermark - Saffron accent
    ctx.fillStyle = "#f59e0b";
    ctx.font = `bold ${fontSize * 0.9}px Arial, sans-serif`;
    const watermarkText = "🏛️ CivicEye Report";
    const textWidth = ctx.measureText(watermarkText).width;
    ctx.fillText(
      watermarkText,
      width - textWidth - padding,
      height - overlayHeight + overlayHeight * 0.35
    );

    // Report ID
    ctx.fillStyle = "#9CA3AF";
    ctx.font = `${fontSize * 0.7}px Arial, sans-serif`;
    const reportId = `ID: CVE-${Date.now().toString().slice(-6)}`;
    const idWidth = ctx.measureText(reportId).width;
    ctx.fillText(
      reportId,
      width - idWidth - padding,
      height - overlayHeight + overlayHeight * 0.85
    );
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("📦 File too large (max 5MB)");
      return;
    }

    try {
      const processedImageBlob = await addGPSOverlayToImage(
        file,
        lat,
        lng,
        locationAccuracy
      );

      setPhoto(processedImageBlob);
      setPhotoURL(URL.createObjectURL(processedImageBlob));

      const metadata = {
        size: processedImageBlob.size,
        type: processedImageBlob.type,
        lastModified: new Date().getTime(),
        hasGPSOverlay: true,
        originalSize: file.size,
        gpsData:
          lat && lng
            ? {
                latitude: lat,
                longitude: lng,
                accuracy: locationAccuracy,
                timestamp: new Date().toISOString(),
              }
            : null,
      };
      setPhotoMetadata(metadata);

      showToast("📷 Photo captured with GPS overlay!");
    } catch (error) {
      console.error("Photo processing error:", error);
      showToast("❌ Photo processing failed");
    }
  };

  const capturePhotoWithLocation = (e) => {
    e.preventDefault();
    setIsCapturingPhoto(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
          setLocationAccuracy(position.coords.accuracy);
          showToast("📍 Location captured with GPS!");

          setTimeout(() => {
            if (fileRef.current) {
              fileRef.current.click();
            }
            setIsCapturingPhoto(false);
          }, 300);
        },
        (error) => {
          showToast("📷 Opening camera (location unavailable)");
          setTimeout(() => {
            if (fileRef.current) {
              fileRef.current.click();
            }
            setIsCapturingPhoto(false);
          }, 300);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 }
      );
    } else {
      setTimeout(() => {
        if (fileRef.current) {
          fileRef.current.click();
        }
        setIsCapturingPhoto(false);
      }, 300);
    }
  };

  const removePhoto = (e) => {
    e.preventDefault();
    setPhoto(null);
    setPhotoMetadata(null);
    if (photoURL) {
      URL.revokeObjectURL(photoURL);
      setPhotoURL(null);
    }
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const getLocation = (e) => {
    e.preventDefault();

    if (!navigator.geolocation) {
      showToast("📍 Location not supported");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setLocationAccuracy(position.coords.accuracy);
        showToast("📍 Location captured!");
        setLocationLoading(false);
      },
      (error) => {
        setLat(12.9716);
        setLng(77.5946);
        setLocationAccuracy(null);
        showToast("📍 Using default location");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!issueType || !desc.trim()) {
      showToast("❌ Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare report data
      const reportData = {
        issueType,
        description: desc.trim(),
        latitude: lat || 12.9716, // Default to Bangalore coordinates if no GPS
        longitude: lng || 77.5946,
        photo: photo,
        metadata: photoMetadata,
        submittedAt: new Date().toISOString(),
      };

      console.log("Submitting report:", reportData);

      // Submit to backend API
      const response = await reportAPI.submitReport(reportData);

      if (response.data.success) {
        showToast("✅ Report submitted successfully!");
        console.log("Report submitted:", response.data.report);

        // Reset form
        setIssueType("");
        setDesc("");
        setPhoto(null);
        setPhotoURL(null);
        setPhotoMetadata(null);
        setLat(null);
        setLng(null);
        setLocationAccuracy(null);

        // Go back to home after delay
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        throw new Error(response.data.message || "Submission failed");
      }
    } catch (error) {
      console.error("Report submission error:", error);

      if (error.message.includes("User already exists")) {
        showToast("❌ Please login to submit reports");
      } else if (error.message.includes("File too large")) {
        showToast("❌ File too large. Please use a smaller image");
      } else if (error.response?.data?.message) {
        showToast(`❌ ${error.response.data.message}`);
      } else {
        showToast("❌ Failed to submit report. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!issueType || !desc.trim()) {
      showToast("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare report data for backend
      const reportData = {
        category: issueType,
        description: desc.trim(),
        priority: getPriorityFromCategory(issueType),
        location: {
          address: "Location not specified",
          coordinates: lat && lng ? [lng, lat] : null,
          area: "Unknown Area",
        },
        reporterEmail: "rajesh.kumar@civiceye.com", // In real app, get from auth context
        reporterName: "Rajesh Kumar", // In real app, get from auth context
        additionalDetails: {
          landmark: null,
          urgency:
            issueType === "water" || issueType === "traffic"
              ? "high"
              : "medium",
          contactPhone: "+91 98765 43210", // In real app, get from user profile
        },
      };

      // Add photo if available
      if (photo) {
        // Convert photo to base64 for backend
        const reader = new FileReader();
        reader.onload = async (event) => {
          reportData.photo = {
            data: event.target.result,
            metadata: photoMetadata,
          };

          await submitToBackend(reportData);
        };
        reader.readAsDataURL(photo);
      } else {
        await submitToBackend(reportData);
      }
    } catch (error) {
      console.error("Submission error:", error);
      showToast("❌ Failed to submit report. Please try again.");
      setIsSubmitting(false);
    }
  };

  const submitToBackend = async (reportData) => {
    try {
      const response = await reportAPI.submitReport(reportData);

      if (response.success) {
        showToast(
          `✅ Report submitted! Ticket: ${response.report.ticketNumber}`
        );

        // Reset form
        setTimeout(() => {
          resetForm();
          onBack();
        }, 2000);
      } else {
        throw new Error(response.error || "Submission failed");
      }
    } catch (error) {
      console.error("Backend submission error:", error);
      showToast("❌ Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityFromCategory = (category) => {
    const priorities = {
      water: "critical",
      electricity: "high",
      traffic: "critical",
      drainage: "high",
      streetlight: "medium",
      pothole: "high",
      garbage: "medium",
      noise: "low",
    };
    return priorities[category] || "medium";
  };

  const resetForm = () => {
    setIssueType(null);
    setDesc("");
    setLat(null);
    setLng(null);
    setPhoto(null);
    setPhotoURL(null);
    setPhotoMetadata(null);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  // Success Card Component
  const SuccessCard = () => (
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
              setShowSuccess(false);
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

  const handleBack = () => {
    setIsBackLoading(true);

    // Clean up any URLs to prevent memory leaks
    if (photoURL) {
      URL.revokeObjectURL(photoURL);
    }

    // Add small delay for smooth transition
    setTimeout(() => {
      onBack();
      setIsBackLoading(false);
    }, 200);
  };

  if (showSuccess) {
    return <SuccessCard />;
  }

  return (
    <div className="civic-report-form">
      {/* Header */}
      <div className="civic-form-header">
        <button
          type="button"
          onClick={handleBack}
          className="civic-back-button"
          disabled={isBackLoading || isSubmitting}
        >
          {isBackLoading ? <div className="civic-spinner-small"></div> : "←"}
        </button>
        <div className="civic-form-header-content">
          <h1 className="civic-form-title">Report Issue</h1>
          <div className="civic-form-progress">
            {photo ? "3/3" : lat ? "2/3" : "1/3"}
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="civic-form-container">
        <form onSubmit={handleSubmit} className="civic-form">
          {/* Scrollable Issue Type Section */}
          <div className="civic-form-section">
            <h3 className="civic-form-label">
              Issue Type *
              {preSelectedCategory && (
                <span className="civic-preselected-badge">
                  {preSelectedCategory.icon} Pre-selected
                </span>
              )}
            </h3>

            <div className="civic-issue-types-scroll-container">
              <p className="civic-scroll-help">
                ← Swipe to see all issue types →
              </p>
              <div className="civic-issue-types-scroll-track">
                {issueTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setIssueType(type.value);
                    }}
                    className={`civic-issue-type-scroll-chip ${
                      issueType === type.value ? "selected" : ""
                    } ${
                      preSelectedCategory?.reportValue === type.value
                        ? "preselected"
                        : ""
                    }`}
                  >
                    <span className="civic-issue-scroll-icon">{type.icon}</span>
                    <span className="civic-issue-scroll-text">
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
              <div className="civic-scroll-indicator">
                <span className="civic-scroll-hint">Swipe for more →</span>
              </div>
            </div>
          </div>

          {/* Photo Section */}
          <div className="civic-form-section">
            <h3 className="civic-form-label">
              Photo Evidence *
              <span className="civic-required-badge">Required</span>
            </h3>

            {!photo ? (
              <div className="civic-photo-capture-area">
                <button
                  type="button"
                  onClick={capturePhotoWithLocation}
                  disabled={isCapturingPhoto}
                  className="civic-capture-button"
                >
                  {isCapturingPhoto ? (
                    <>
                      <div className="civic-spinner"></div>
                      <span>Getting GPS...</span>
                    </>
                  ) : (
                    <>
                      <Camera size={20} />
                      <span>Take Photo with GPS</span>
                    </>
                  )}
                </button>

                <div className="civic-divider">or</div>

                <label className="civic-upload-button" htmlFor="photo-input">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17,8 12,3 7,8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>Upload from Gallery</span>
                </label>
              </div>
            ) : (
              <div className="civic-photo-preview">
                <div className="civic-photo-container">
                  <img
                    src={photoURL}
                    alt="Issue Evidence"
                    className="civic-photo-image"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="civic-photo-remove"
                  >
                    ×
                  </button>
                </div>
                <div className="civic-photo-details">
                  <div className="civic-photo-info">
                    <span className="civic-photo-status">
                      📷 Photo captured
                    </span>
                    {photoMetadata && (
                      <span className="civic-photo-size">
                        {(photoMetadata.size / 1024 / 1024).toFixed(1)}MB
                      </span>
                    )}
                  </div>
                  {photoMetadata && photoMetadata.hasGPSOverlay && (
                    <div className="civic-gps-tag">
                      <span className="civic-gps-indicator"></span>
                      GPS overlay embedded with location data
                    </div>
                  )}
                  {photoMetadata?.gpsData && (
                    <div className="civic-gps-tag">
                      <span>
                        🎯 Accuracy: ±
                        {Math.round(photoMetadata.gpsData.accuracy || 0)}m
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <input
              ref={fileRef}
              id="photo-input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="civic-hidden-input"
            />
          </div>

          {/* Description Section */}
          <div className="civic-form-section">
            <h3 className="civic-form-label">
              Description *
              <span className="civic-character-count">({desc.length}/500)</span>
            </h3>
            <textarea
              className="civic-textarea"
              placeholder="Describe the issue briefly..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Location Section */}
          <div className="civic-form-section">
            <h3 className="civic-form-label">Location Verification</h3>

            {lat && lng ? (
              <div className="civic-location-display">
                <div className="civic-location-info">
                  <div className="civic-location-header">
                    <span className="civic-location-icon">📍</span>
                    <span className="civic-location-text">
                      Location captured
                    </span>
                    <span className="civic-location-verified">Verified</span>
                  </div>
                  <div className="civic-coordinates">
                    {lat.toFixed(6)}, {lng.toFixed(6)}
                  </div>
                  {locationAccuracy && (
                    <div style={{ fontSize: "12px", color: "#10b981" }}>
                      Accuracy: ±{Math.round(locationAccuracy)}m
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={getLocation}
                  className="civic-refresh-location"
                  disabled={locationLoading}
                >
                  🔄
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={getLocation}
                disabled={locationLoading}
                className="civic-get-location-button"
              >
                {locationLoading ? (
                  <>
                    <div className="civic-spinner"></div>
                    <span>Getting location...</span>
                  </>
                ) : (
                  <>
                    <MapPin size={16} />
                    <span>Get Current Location</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Submit Section */}
          <div className="civic-submit-section">
            <button
              type="submit"
              disabled={!desc.trim() || !issueType || !photo || isSubmitting}
              className="civic-submit-button"
            >
              {isSubmitting ? (
                <>
                  <div className="civic-spinner"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  <span>Submit Report</span>
                </>
              )}
            </button>

            <div className="civic-checklist">
              <div
                className={`civic-checklist-item ${
                  issueType ? "completed" : ""
                }`}
              >
                {issueType ? "✅" : "⏸️"} Issue type selected
              </div>
              <div
                className={`civic-checklist-item ${photo ? "completed" : ""}`}
              >
                {photo ? "✅" : "⏸️"} Photo evidence captured
              </div>
              <div
                className={`civic-checklist-item ${
                  desc.trim() ? "completed" : ""
                }`}
              >
                {desc.trim() ? "✅" : "⏸️"} Description provided
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Toast */}
      {toast && <div className="civic-toast">{toast}</div>}
    </div>
  );
}

export default ReportForm;
