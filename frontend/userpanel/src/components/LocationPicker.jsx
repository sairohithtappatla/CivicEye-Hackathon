import React, { useState } from "react";
import { MapPin } from "lucide-react";

function LocationPicker({ lat, lng, onGetLocation, onCopy }) {
  const [locationLoading, setLocationLoading] = useState(false);

  const handleGetLocation = (e) => {
    e.preventDefault();

    if (!navigator.geolocation) {
      console.log("📍 Location not supported");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onGetLocation(position.coords.latitude, position.coords.longitude);
        console.log("📍 Location captured!");
        setLocationLoading(false);
      },
      (error) => {
        // Use default location (Bengaluru coordinates)
        onGetLocation(12.9716, 77.5946);
        console.log("📍 Using default location");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 }
    );
  };

  return (
    <div className="gov-field">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Location
      </label>
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleGetLocation}
          className="gov-loc-btn"
          disabled={locationLoading}
        >
          {locationLoading ? (
            <>🔄 Getting Location...</>
          ) : (
            <>📍 Get My Location</>
          )}
        </button>

        {lat && lng && (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              📍 Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}
            </div>
            {onCopy && (
              <button
                type="button"
                onClick={onCopy}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                📋 Copy Coordinates
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationPicker;
