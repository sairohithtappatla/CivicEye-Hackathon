import { useState, useRef } from "react";
import axios from "axios";
import "./index.css"; // loads Tailwind + custom classes

function App() {
  const [desc, setDesc] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoURL, setPhotoURL] = useState(null);
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [toast, setToast] = useState("");
  const fileRef = useRef();

  // get GPS
  const getLocation = () => {
    if (!navigator.geolocation) {
      setToast("Geolocation is not supported by your browser.");
      clearToastLater();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setToast("Location captured");
        clearToastLater();
      },
      () => {
        setToast("Could not get location — permission denied or timeout.");
        clearToastLater();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // copy coords to clipboard (fixed)
  const copyLocation = async () => {
    if (lat == null || lng == null) {
      setToast("No coordinates to copy — click Get Location first.");
      clearToastLater();
      return;
    }
    const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    try {
      await navigator.clipboard.writeText(coords);
      setToast(`Coordinates copied: ${coords}`);
      clearToastLater();
    } catch {
      setToast("Unable to copy coordinates. Please copy manually.");
      clearToastLater();
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhoto(f);
    setPhotoURL(URL.createObjectURL(f));
  };

  const removePhoto = () => {
    setPhoto(null);
    if (photoURL) {
      URL.revokeObjectURL(photoURL);
      setPhotoURL(null);
    }
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const clearToastLater = (ms = 2500) => {
    setTimeout(() => setToast(""), ms);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!desc.trim()) {
      setToast("Please describe the issue before submitting.");
      clearToastLater();
      return;
    }
    // example submission structure (adjust server/form-data as needed)
    try {
      const form = new FormData();
      form.append("description", desc);
      if (photo) form.append("photo", photo);
      if (lat && lng) form.append("latitude", lat);
      if (lat && lng) form.append("longitude", lng);

      await axios.post("http://localhost:5000/report/submit", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setToast("Report submitted — thank you for serving the nation 🇮🇳");
      clearToastLater();
      // reset
      setDesc("");
      removePhoto();
      setLat(null);
      setLng(null);
    } catch (err) {
      console.error(err);
      setToast("Failed to submit — please try again later.");
      clearToastLater();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-10 px-4">
      <div className="gov-card">
        <div className="gov-hero">
          <div className="gov-badge">Civic Service • Secure • Verified</div>
          <h1 className="gov-title mt-4">
            Serve Bharat — Report. Resolve. Rise.
          </h1>
          {/* <p className="gov-tag">
            One click to share problems, one step closer to solutions.
          </p> */}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Describe first */}
          <div className="gov-field">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Describe the issue
            </label>
            <textarea
              className="gov-input"
              placeholder="Give a clear, concise description — what happened, where, and when."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
            />
          </div>

          {/* File upload after description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Upload photo / proof (optional)
            </label>

            <label className="gov-file" htmlFor="photo-upload">
              <div>
                <div className="gov-file-info">
                  {photo ? (
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">{photo.name}</div>
                      <div className="text-xs text-slate-500">{(photo.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-600">
                      Click to choose photo or drag & drop (jpg, png). Max 10MB.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <button type="button" className="gov-file-btn" onClick={() => fileRef.current?.click()}>
                  📷 Upload Photo
                </button>
              </div>

              <input
                id="photo-upload"
                ref={fileRef}
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </label>

            {photoURL && (
              <div className="mt-3 flex items-start gap-3">
                <img src={photoURL} alt="preview" className="gov-preview w-28 h-28 object-cover" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{photo.name}</div>
                  <div className="text-xs text-slate-500 mt-2">{photo.type || ""}</div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={removePhoto} className="gov-loc-btn" aria-label="Remove photo">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Location / controls */}
          <div className="gov-field">
            <label className="block text-sm font-medium text-slate-700 mb-2">Location (geotag)</label>
            <div className="gov-controls">
              <button type="button" onClick={getLocation} className="gov-loc-btn" aria-label="Get location">
                📍 Get Location
              </button>
              <button type="button" onClick={copyLocation} className="gov-copy" aria-label="Copy coordinates">
                Copy coords
              </button>

              <div className="ml-auto text-sm text-slate-600">
                {lat != null ? (
                  <div>
                    {lat.toFixed(6)}, {lng.toFixed(6)}
                  </div>
                ) : (
                  <div className="text-slate-400">No location yet</div>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div>
            <button type="submit" className="gov-submit">
               Submit Report
            </button>
          </div>

          <div className="gov-footer">
            By submitting you confirm the information is accurate to the best of
            your knowledge. Reports are routed to the relevant civic department.
          </div>
        </form>
      </div>

      {/* toast */}
      {toast && <div className="gov-toast" role="status">{toast}</div>}
    </div>
  );
}

export default App;
