import React, { useState, useRef } from "react";
import { Camera } from "lucide-react";

function PhotoCapture({
  photo,
  photoURL,
  photoMetadata,
  lat,
  lng,
  setPhoto,
  setPhotoURL,
  setPhotoMetadata,
  setLat,
  setLng,
  showToast,
}) {
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const fileRef = useRef(null);

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

    // Add top border
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(0, height - overlayHeight, width, 2);

    // GPS coordinates with validation
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;

    const locationText =
      lat && lng && lat !== 0 && lng !== 0
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

    // Accuracy info with better validation
    if (accuracy && accuracy > 0) {
      const accuracyColor =
        accuracy < 10 ? "#10B981" : accuracy < 50 ? "#f59e0b" : "#ef4444";
      ctx.fillStyle = accuracyColor;
      const accuracyText = `🎯 Accuracy: ±${Math.round(accuracy)}m`;
      ctx.fillText(
        accuracyText,
        padding,
        height - overlayHeight + overlayHeight * 0.75
      );
    } else if (lat && lng) {
      ctx.fillStyle = "#9CA3AF";
      ctx.fillText(
        "🎯 GPS: Approximate location",
        padding,
        height - overlayHeight + overlayHeight * 0.75
      );
    }

    // CivicEye watermark
    ctx.fillStyle = "#f59e0b";
    ctx.font = `bold ${fontSize * 0.9}px Arial, sans-serif`;
    const watermarkText = "🏛️ CivicEye Report";
    const textWidth = ctx.measureText(watermarkText).width;
    ctx.fillText(
      watermarkText,
      width - textWidth - padding,
      height - overlayHeight + overlayHeight * 0.35
    );

    // Report ID with timestamp
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
      // Use current location state (which should be updated from capturePhotoWithLocation)
      const currentLat = lat;
      const currentLng = lng;
      const currentAccuracy = locationAccuracy;

      console.log("Processing image with location:", {
        currentLat,
        currentLng,
        currentAccuracy,
      });

      const processedImageBlob = await addGPSOverlayToImage(
        file,
        currentLat,
        currentLng,
        currentAccuracy
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
          currentLat && currentLng
            ? {
                latitude: currentLat,
                longitude: currentLng,
                accuracy: currentAccuracy,
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
          const currentLat = position.coords.latitude;
          const currentLng = position.coords.longitude;
          const currentAccuracy = position.coords.accuracy;

          // Set location state immediately
          setLat(currentLat);
          setLng(currentLng);
          setLocationAccuracy(currentAccuracy);

          showToast("📍 Location captured with GPS!");

          // Small delay to ensure state is updated, then trigger camera
          setTimeout(() => {
            if (fileRef.current) {
              fileRef.current.click();
            }
            setIsCapturingPhoto(false);
          }, 500); // Increased delay to ensure location state updates
        },
        (error) => {
          console.warn("GPS error:", error);
          // Use fallback location
          setLat(12.9716);
          setLng(77.5946);
          setLocationAccuracy(null);
          showToast("📷 Opening camera (using default location)");

          setTimeout(() => {
            if (fileRef.current) {
              fileRef.current.click();
            }
            setIsCapturingPhoto(false);
          }, 300);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 60000,
        }
      );
    } else {
      showToast("📷 Opening camera (location unavailable)");
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

  return (
    <div className="civic-form-section">
      <h3 className="civic-form-label">
        Photo Evidence *<span className="civic-required-badge">Required</span>
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
              <span className="civic-photo-status">📷 Photo captured</span>
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
  );
}

export default PhotoCapture;
