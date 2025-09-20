import React, { useState } from "react";
import { MapPin } from "lucide-react";

function LocationPicker({ lat, lng, setLat, setLng, showToast }) {
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState(null);

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

  return (
    <div className="civic-form-section">
      <h3 className="civic-form-label">Location Verification</h3>

      {lat && lng ? (
        <div className="civic-location-display">
          <div className="civic-location-info">
            <div className="civic-location-header">
              <span className="civic-location-icon">📍</span>
              <span className="civic-location-text">Location captured</span>
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
  );
}

export default LocationPicker;
