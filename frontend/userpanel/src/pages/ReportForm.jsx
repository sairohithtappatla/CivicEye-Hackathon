import { useState, useRef } from "react";
import axios from "axios";
import "../index.css";

import IssueDropdown from "../components/IssueDropdown";
import DescriptionBox from "../components/DescriptionBox";
import FileUpload from "../components/FileUpload";
import LocationPicker from "../components/LocationPicker";
import Toast from "../components/Toast";

function ReportForm() {
  // ------------------- State -------------------
  const [issueType, setIssueType] = useState("");
  const [desc, setDesc] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoURL, setPhotoURL] = useState(null);
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [toast, setToast] = useState("");
  const fileRef = useRef();

  // ------------------- Toast -------------------
  const showToast = (msg, ms = 2500) => {
    setToast(msg);
    setTimeout(() => setToast(""), ms);
  };

  // ------------------- Reset Form -------------------
  const resetForm = () => {
    setIssueType("");
    setDesc("");
    removePhoto();
    setLat(null);
    setLng(null);
  };

  // ------------------- File Upload -------------------
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setPhoto(f);
      setPhotoURL(URL.createObjectURL(f));
    }
  };

  const removePhoto = () => {
    if (photoURL) URL.revokeObjectURL(photoURL);
    setPhoto(null);
    setPhotoURL(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // ------------------- Location -------------------
  const getLocation = () => {
    if (!navigator.geolocation) return showToast("Geolocation not supported.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        showToast("Location captured");
      },
      () => showToast("Unable to fetch location."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const copyLocation = async () => {
    if (!lat || !lng) return showToast("No coordinates yet.");
    const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    try {
      await navigator.clipboard.writeText(coords);
      showToast(`Copied: ${coords}`);
    } catch {
      showToast("Clipboard copy failed.");
    }
  };

  // ------------------- Submit -------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!issueType) return showToast("Please select an issue type.");
    if (!desc.trim()) return showToast("Please enter a description.");

    try {
      const form = new FormData();
      form.append("issueType", issueType);
      form.append("description", desc);
      if (photo) form.append("photo", photo);
      if (lat && lng) {
        form.append("latitude", lat);
        form.append("longitude", lng);
      }

      await axios.post("http://localhost:5000/report/submit", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("Report submitted — thank you 🇮🇳");
      resetForm();
    } catch (err) {
      console.error(err);
      showToast("Failed to submit — please try again later.");
    }
  };

  // ------------------- JSX -------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-10 px-4">
      <div className="gov-card">
        {/* Header */}
        <div className="gov-hero">
          <div className="gov-badge">Civic Service • Secure • Verified</div>
          <h1 className="gov-title mt-4">
            Serve Bharat — Report. Resolve. Rise.
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <IssueDropdown value={issueType} onChange={setIssueType} />
          <DescriptionBox value={desc} onChange={setDesc} />
          <FileUpload
            fileRef={fileRef}
            photo={photo}
            photoURL={photoURL}
            onFileChange={handleFileChange}
            onRemove={removePhoto}
          />
          <LocationPicker
            lat={lat}
            lng={lng}
            onGetLocation={getLocation}
            onCopy={copyLocation}
          />
          <button type="submit" className="gov-submit w-full">
            Submit Report
          </button>
          <div className="gov-footer">
            By submitting you confirm the information is accurate to the best of
            your knowledge.
          </div>
        </form>
      </div>

      <Toast message={toast} />
    </div>
  );
}

export default ReportForm;
