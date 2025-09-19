function LocationPicker({ lat, lng, onGetLocation, onCopy }) {
  return (
    <div className="gov-field">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Location (geotag)
      </label>
      <div className="gov-controls">
        <button type="button" onClick={onGetLocation} className="gov-loc-btn">
          📍 Get Location
        </button>
        <button type="button" onClick={onCopy} className="gov-copy">
          Copy coords
        </button>
        <div className="ml-auto text-sm text-slate-600">
          {lat ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "No location yet"}
        </div>
      </div>
    </div>
  );
}
export default LocationPicker;
