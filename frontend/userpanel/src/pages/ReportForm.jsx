import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Upload, X } from "lucide-react";
import DescriptionBox from "../components/DescriptionBox";
import LocationPicker from "../components/LocationPicker";
import { reportAPI } from "../services/api";

function ReportForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");

  const [formData, setFormData] = useState({
    issueType: categoryFromUrl || "",
    description: "",
    photo: null,
    latitude: null,
    longitude: null,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);

  const issueTypes = [
    { id: "garbage", name: "Garbage Collection", icon: "🗑️" },
    { id: "streetlight", name: "Street Light", icon: "💡" },
    { id: "pothole", name: "Road Damage/Pothole", icon: "🕳️" },
    { id: "water", name: "Water Supply", icon: "💧" },
    { id: "electricity", name: "Electricity", icon: "⚡" },
    { id: "traffic", name: "Traffic Issues", icon: "🚦" },
    { id: "drainage", name: "Drainage", icon: "🌊" },
    { id: "parks", name: "Parks & Recreation", icon: "🌳" },
    { id: "construction", name: "Construction Issues", icon: "🏗️" },
    { id: "safety", name: "Safety Concerns", icon: "🚨" },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        setMessage("File too large. Maximum size is 10MB.");
        return;
      }

      if (!file.type.startsWith("image/")) {
        setMessage("Please select an image file.");
        return;
      }

      setFormData((prev) => ({ ...prev, photo: file }));

      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleLocationGet = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleLocationCopy = () => {
    if (formData.latitude && formData.longitude) {
      navigator.clipboard.writeText(
        `${formData.latitude}, ${formData.longitude}`
      );
      setMessage("Coordinates copied to clipboard!");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const removePhoto = () => {
    setFormData((prev) => ({ ...prev, photo: null }));
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.issueType || !formData.description) {
      setMessage("Please fill in all required fields.");
      return;
    }

    if (formData.description.length < 10) {
      setMessage("Description must be at least 10 characters long.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await reportAPI.submit(formData);

      if (response.success) {
        setMessage("Report submitted successfully! 🎉");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setMessage(response.message || "Failed to submit report.");
      }
    } catch (error) {
      console.error("Report submission error:", error);
      setMessage(error.message || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="civic-report-form">
      {/* Header */}
      <div className="civic-form-header">
        <button onClick={() => navigate(-1)} className="civic-back-button">
          <ArrowLeft size={24} />
        </button>
        <h1 className="civic-form-title">Report Issue</h1>
        <div className="civic-form-progress">Step 1/1</div>
      </div>

      <div className="civic-form-container">
        <form onSubmit={handleSubmit} className="civic-form">
          {/* Issue Type Selection */}
          <div className="gov-field">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Issue Type *
            </label>
            <select
              value={formData.issueType}
              onChange={(e) => handleInputChange("issueType", e.target.value)}
              className="gov-input"
              required
            >
              <option value="">Select an issue type</option>
              {issueTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.icon} {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <DescriptionBox
            value={formData.description}
            onChange={(value) => handleInputChange("description", value)}
          />

          {/* Photo Upload */}
          <div className="gov-field">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Photo (Optional)
            </label>
            <div className="space-y-3">
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <label
                htmlFor="photo-upload"
                className="gov-file-btn block text-center"
              >
                <Upload size={16} className="inline mr-2" />
                Choose Photo
              </label>

              {photoPreview && (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                  <div className="mt-2 text-sm text-gray-600">
                    📸 {formData.photo?.name} (
                    {(formData.photo?.size / 1024 / 1024).toFixed(2)}MB)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <LocationPicker
            lat={formData.latitude}
            lng={formData.longitude}
            onGetLocation={handleLocationGet}
            onCopy={handleLocationCopy}
          />

          {/* Message */}
          {message && (
            <div
              className={`p-3 rounded-lg text-sm text-center ${
                message.includes("success") || message.includes("copied")
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {message}
            </div>
          )}

          {/* Submit */}
          <div className="civic-submit-section">
            <button
              type="submit"
              className="civic-submit-button"
              disabled={loading}
            >
              {loading ? (
                <div className="civic-spinner-small"></div>
              ) : (
                <>📤 Submit Report</>
              )}
            </button>
            <p className="civic-submit-footer">
              🔒 Secure submission • 🇮🇳 Government verified
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportForm;
