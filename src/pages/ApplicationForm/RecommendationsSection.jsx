import { useState, useEffect } from "react";
import axios from "axios";
import Section from "../../components/Section";

const API_BASE_URL = "https://api.elimishatrust.or.ke/";

export default function RecommendationsSection({ onNext, onBack, formData, updateFormData }) {
  // Logic to skip for postgraduates
  useEffect(() => {
    const level = formData.personalDetails?.levelOfStudy || "";
    if (level.toLowerCase().includes("postgraduate") || level.toLowerCase().includes("masters") || level.toLowerCase().includes("phd")) {
      onNext(); 
    }
  }, [formData.personalDetails?.levelOfStudy, onNext]);

  // Initialize uploaded URL from formData for persistence
  const [uploadedUrl, setUploadedUrl] = useState(formData.recommendations?.chiefAndImamRecommendation || "");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Sync uploaded URL with parent state
    updateFormData("recommendations", { chiefAndImamRecommendation: uploadedUrl });
  }, [uploadedUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadFile(file);
    }
  };

  const uploadFile = async (file) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to upload files.");
      return;
    }

    setUploading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const res = await axios.post(
        `${API_BASE_URL}/uploads/upload`,
        formDataUpload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const fileUrl = res.data.file_url;
      setUploadedUrl(fileUrl);
      console.log("✅ Recommendation uploaded:", fileUrl);
    } catch (error) {
      console.error("❌ Error uploading recommendation:", error);
      alert("Failed to upload recommendation");
    } finally {
      setUploading(false);
    }
  };

  const handleNext = async () => {
    // Strictly required for non-postgraduates
    if (!uploadedUrl) {
      alert("Required: Please upload the Chief & Imam recommendation document.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to save data.");
      return;
    }

    try {
      await axios.patch(
        `${API_BASE_URL}/admin/students/update-details`,
        { recommendations: { chiefAndImamRecommendation: uploadedUrl } },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("✅ RECOMMENDATION SAVED TO CLOUD");
      onNext();
    } catch (error) {
      console.error("❌ ERROR SAVING RECOMMENDATION:", error);
      alert("Failed to save data. Please try again.");
    }
  };

  const handleBack = () => {
    onBack();
  };

  return (
    <Section title="J & K. Community Recommendations" className="rec-section">
      <p className="rec-text">
        📝 Upload the stamped and signed Chief and Imam recommendation. 
        <br />
        <small>(Required for undergraduate/diploma applicants)</small>
      </p>

      <div className="rec-grid">
        <div className="rec-item">
          <label className="rec-label">
            📄 Chief & Imam Recommendation (PDF/Image) <span style={{color: 'red'}}>*</span>
          </label>
          <input
            type="file"
            className="rec-file"
            onChange={handleFileChange}
            accept=".pdf,.jpg,.png"
          />
          {uploading && (
            <p style={{ color: "blue", fontSize: "12px", marginTop: "5px" }}>
              ⏳ Syncing with cloud...
            </p>
          )}
          {uploadedUrl && !uploading && (
            <p style={{ color: "green", fontSize: "12px", marginTop: "5px" }}>
              ✅ Retrieved from cloud | <a href={uploadedUrl} target="_blank" rel="noreferrer" style={{color: '#2d6a9f', fontWeight: 'bold', textDecoration: 'underline'}}>View File</a>
            </p>
          )}
        </div>
      </div>

      <div className="rec-buttons">
        <button
          onClick={handleBack}
          className="rec-button rec-button-back"
          disabled={uploading}
        >
          ⬅️ Back
        </button>
        <button
          onClick={handleNext}
          className="rec-button rec-button-next"
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "➡️ Next"}
        </button>
      </div>
    </Section>
  );
}