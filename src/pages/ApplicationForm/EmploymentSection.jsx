import { useState, useEffect } from "react";
import axios from "axios";
import Section from "../../components/Section";

const API_BASE_URL = "https://api.elimishatrust.or.ke/";

export default function EmploymentDetails({ onNext, onBack, formData, updateFormData }) {
  const [employmentDetails, setEmploymentDetails] = useState(formData.employmentDetails || {
    name: "",
    employerName: "",
    employmentPosition: "",
    employerAddress: "",
    telephoneNumber: "",
    typeOfContract: "",
    yearsWorked: "",
    netPay: "",
    immediateSupervisorName: "",
  });

  // State to hold retrieved cloud URLs
  const [uploadedUrls, setUploadedUrls] = useState(() => {
    const docs = formData.employmentDocuments || {};
    return {
      employmentLetter: docs.employmentLetter || "",
      bankStatements: docs.bankStatements || [],
      paySlips: docs.paySlips || [],
      hrStamp: docs.hrStamp || "",
    };
  });

  // Track uploading status per field (like Parent section)
  const [uploadingStatus, setUploadingStatus] = useState({});

  useEffect(() => {
    updateFormData("employmentDetails", employmentDetails);
  }, [employmentDetails]);

  useEffect(() => {
    updateFormData("employmentDocuments", uploadedUrls);
  }, [uploadedUrls]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmploymentDetails({ ...employmentDetails, [name]: value });
  };

  // Immediate upload logic to ensure files "stay" in the cloud/state
  const handleFileChange = async (e, fieldName) => {
    const { files: selectedFiles } = e.target;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const token = localStorage.getItem("token");
    setUploadingStatus((prev) => ({ ...prev, [fieldName]: true }));

    try {
      if (fieldName === "bankStatements" || fieldName === "paySlips") {
        // Multi-file upload
        const uploadPromises = Array.from(selectedFiles).map(async (file) => {
          const data = new FormData();
          data.append("file", file);
          const res = await axios.post(`${API_BASE_URL}/uploads/upload`, data, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
          });
          return res.data.file_url;
        });

        const newUrls = await Promise.all(uploadPromises);
        setUploadedUrls((prev) => ({
          ...prev,
          [fieldName]: [...(prev[fieldName] || []), ...newUrls],
        }));
      } else {
        // Single file upload
        const data = new FormData();
        data.append("file", selectedFiles[0]);
        const res = await axios.post(`${API_BASE_URL}/uploads/upload`, data, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        setUploadedUrls((prev) => ({ ...prev, [fieldName]: res.data.file_url }));
      }
    } catch (error) {
      console.error(`❌ Upload error for ${fieldName}:`, error);
      alert(`Failed to upload ${fieldName}. Please try again.`);
    } finally {
      setUploadingStatus((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleNext = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to save data.");
      return;
    }

    // 1. Validate Text Fields
    const requiredFields = [
      { id: "name", label: "Full Name" },
      { id: "employerName", label: "Employer Name" },
      { id: "employmentPosition", label: "Employment Position" },
      { id: "employerAddress", label: "Employer Address" },
      { id: "telephoneNumber", label: "Telephone Number" },
      { id: "typeOfContract", label: "Type of Contract" },
      { id: "yearsWorked", label: "Years Worked" },
      { id: "netPay", label: "Net Pay" },
      { id: "immediateSupervisorName", label: "Supervisor Name" },
    ];

    for (let field of requiredFields) {
      if (!employmentDetails[field.id]) {
        alert(`Required: Please fill in the ${field.label} for the person paying the loan.`);
        return;
      }
    }

    // 2. Validate Documents (retrieved from cloud/state)
    if (!uploadedUrls.employmentLetter) {
      alert("Required: Please upload the Employment Letter / Business Registration.");
      return;
    }
    if ((uploadedUrls.bankStatements?.length || 0) === 0) {
      alert("Required: Please upload Bank Statements (Last 6 Months).");
      return;
    }
    if ((uploadedUrls.paySlips?.length || 0) === 0) {
      alert("Required: Please upload 3 Recent Pay Slips.");
      return;
    }
    if (!uploadedUrls.hrStamp) {
      alert("Required: Please upload the HR Stamp & Supervisor Signature.");
      return;
    }

    try {
      // Save full details to database
      await axios.patch(
        `${API_BASE_URL}/admin/students/update-details`,
        { employmentDetails, employmentDocuments: uploadedUrls },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      onNext();
    } catch (error) {
      console.error("❌ Error saving employment details:", error);
      alert("Failed to save employment details. Please try again.");
    }
  };

  // Helper to render the cloud status and view link
  const renderFileStatus = (name) => {
    if (uploadingStatus[name]) return <p style={{ color: "#2d6a9f", fontSize: "12px" }}>⏳ Uploading to cloud...</p>;
    
    const urlData = uploadedUrls[name];
    const hasData = Array.isArray(urlData) ? urlData.length > 0 : !!urlData;

    if (hasData) {
      const viewUrl = Array.isArray(urlData) ? urlData[0] : urlData;
      return (
        <p style={{ color: "#27ae60", fontSize: "12px", marginTop: "4px" }}>
          ✅ Uploaded | <a href={viewUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#2d6a9f", fontWeight: "600", textDecoration: "underline" }}>
            View {Array.isArray(urlData) ? `(${urlData.length} files)` : "File"}
          </a>
        </p>
      );
    }
    return null;
  };

  return (
    <Section title="D. Employment Details (Person Paying Loan)" className="emp-section">
      <div className="emp-grid">
        <input name="name" placeholder="👤 Full Name *" value={employmentDetails.name} onChange={handleChange} className="emp-input" />
        <input name="employerName" placeholder="🏢 Name of Employer *" value={employmentDetails.employerName} onChange={handleChange} className="emp-input" />
        <input name="employmentPosition" placeholder="💼 Employment Position *" value={employmentDetails.employmentPosition} onChange={handleChange} className="emp-input" />
        <input name="employerAddress" placeholder="🏠 Employer Address *" value={employmentDetails.employerAddress} onChange={handleChange} className="emp-input" />
        <input name="telephoneNumber" placeholder="📞 Telephone Number *" value={employmentDetails.telephoneNumber} onChange={handleChange} className="emp-input" />
        <input name="typeOfContract" placeholder="📝 Type of Contract *" value={employmentDetails.typeOfContract} onChange={handleChange} className="emp-input" />
        <input name="yearsWorked" placeholder="📅 Years Worked *" value={employmentDetails.yearsWorked} onChange={handleChange} className="emp-input" />
        <input name="netPay" placeholder="💰 Net Pay *" value={employmentDetails.netPay} onChange={handleChange} className="emp-input" />
        <input name="immediateSupervisorName" placeholder="👔 Immediate Supervisor Name *" value={employmentDetails.immediateSupervisorName} onChange={handleChange} className="emp-input" />
      </div>

      <h4 className="emp-subtitle">📎 Attachments (Retrieved from Cloud)</h4>
      <div className="emp-grid">
        <div className="emp-field">
          <label className="emp-label">📜 Employment Letter <span style={{color: 'red'}}>*</span></label>
          <input type="file" className="emp-file" onChange={(e) => handleFileChange(e, "employmentLetter")} accept=".pdf,.jpg,.png" />
          {renderFileStatus("employmentLetter")}
        </div>

        <div className="emp-field">
          <label className="emp-label">🏦 Bank Statements <span style={{color: 'red'}}>*</span></label>
          <input type="file" multiple className="emp-file" onChange={(e) => handleFileChange(e, "bankStatements")} accept=".pdf,.jpg,.png" />
          {renderFileStatus("bankStatements")}
        </div>

        <div className="emp-field">
          <label className="emp-label">💵 3 Recent Pay Slips <span style={{color: 'red'}}>*</span></label>
          <input type="file" multiple className="emp-file" onChange={(e) => handleFileChange(e, "paySlips")} accept=".pdf,.jpg,.png" />
          {renderFileStatus("paySlips")}
        </div>

        <div className="emp-field">
          <label className="emp-label">✍️ HR Stamp & Signature <span style={{color: 'red'}}>*</span></label>
          <input type="file" className="emp-file" onChange={(e) => handleFileChange(e, "hrStamp")} accept=".pdf,.jpg,.png" />
          {renderFileStatus("hrStamp")}
        </div>
      </div>

      <div className="emp-buttons">
        <button onClick={onBack} className="emp-button emp-button-back">⬅️ Back</button>
        <button 
          onClick={handleNext} 
          className="emp-button emp-button-next" 
          disabled={Object.values(uploadingStatus).some(Boolean)}
        >
          {Object.values(uploadingStatus).some(Boolean) ? "⏳ Uploading..." : "➡️ Next"}
        </button>
      </div>
    </Section>
  );
}