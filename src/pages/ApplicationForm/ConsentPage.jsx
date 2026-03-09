import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SignaturePad from "signature_pad";

const API_BASE_URL = "https://api.elimishatrust.or.ke/";

const ConsentPage = ({ onBack, formData, updateFormData }) => {
  const navigate = useNavigate();
  
  // Initialize local state from formData.consentForm or defaults
  const [formDataLocal, setFormDataLocal] = useState({
    studentName: formData.consentForm?.studentName || "",
    studentDate: formData.consentForm?.studentDate || "",
    guardianName: formData.consentForm?.guardianName || "",
    guardianDate: formData.consentForm?.guardianDate || "",
  });

  const [submitting, setSubmitting] = useState(false);

  // Refs for signature pads
  const studentCanvasRef = useRef(null);
  const guardianCanvasRef = useRef(null);
  const studentSigPad = useRef(null);
  const guardianSigPad = useRef(null);

  // Function to handle canvas resizing (prevents signature distortion)
  const resizeCanvas = () => {
    [studentCanvasRef, guardianCanvasRef].forEach((ref) => {
      const canvas = ref.current;
      if (canvas) { // Check added to prevent the null scale error
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        const ctx = canvas.getContext("2d"); // Fixed character error from "鏡" to "2d"
        if (ctx) ctx.scale(ratio, ratio);
      }
    });
  };

  // Initialize signature pads on mount
  useEffect(() => {
    if (studentCanvasRef.current) {
      studentSigPad.current = new SignaturePad(studentCanvasRef.current);
      if (formData.consentForm?.studentSignature) {
        studentSigPad.current.fromDataURL(formData.consentForm.studentSignature);
      }
    }
    if (guardianCanvasRef.current) {
      guardianSigPad.current = new SignaturePad(guardianCanvasRef.current);
      if (formData.consentForm?.guardianSignature) {
        guardianSigPad.current.fromDataURL(formData.consentForm.guardianSignature);
      }
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    return () => {
      studentSigPad.current?.off();
      guardianSigPad.current?.off();
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []); 

  // Sync local form inputs with parent state
  useEffect(() => {
    updateFormData("consentForm", {
      ...formData.consentForm,
      ...formDataLocal,
    });
  }, [formDataLocal]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormDataLocal((prev) => ({ ...prev, [name]: value }));
  };

  const clearSignature = (sigPad) => {
    sigPad.current?.clear();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const studentSignature = studentSigPad.current?.isEmpty()
      ? null
      : studentSigPad.current.toDataURL("image/png");
    const guardianSignature = guardianSigPad.current?.isEmpty()
      ? null
      : guardianSigPad.current.toDataURL("image/png");

    if (!studentSignature || !guardianSignature) {
      alert("Please provide both student and guardian signatures before submitting.");
      return;
    }

    const consentData = {
      ...formData.consentForm,
      ...formDataLocal,
      studentSignature,
      guardianSignature,
      submittedAt: new Date().toISOString(),
    };

    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to submit.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Save final details
      await axios.patch(
        `${API_BASE_URL}/admin/students/update-details`,
        { consentForm: consentData },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // 2. Final Submission
      await axios.post(
        `${API_BASE_URL}/submissions/submit`,
        { ...formData, ...formDataLocal, studentSignature, guardianSignature }, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Application submitted successfully!");
      localStorage.removeItem("currentStep");
      window.location.reload(); // This forces the Parent to run 'checkLockStatus' again
    } catch (error) {
      console.error("❌ Submission error:", error.response?.data || error);
      alert(error.response?.data?.error || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="consent-bg">
      <div className="consent-container">
        <h1 className="consent-title">Consent Form for Loan Application</h1>
        <p className="consent-intro">
          I (We) consent to the collection, processing, transmission and storage by the Trust in any form whatsoever, of any data of a professional or personal nature that have been provided by the applicant as stipulated in page one of the requirements which is necessary for the purposes of the loan application.
        </p>

        <form onSubmit={handleSubmit} className="consent-form">
          {/* Student Section */}
          <div className="consent-section">
            <h2>Student Consent</h2>
            <div className="form-group">
              <label>Student Name:</label>
              <input
                type="text"
                name="studentName"
                value={formDataLocal.studentName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Signature:</label>
              <div className="signature-container">
                {/* Added touch-action: none for mobile support */}
                <canvas ref={studentCanvasRef} className="signature-canvas" style={{ touchAction: 'none' }} />
                <button type="button" onClick={() => clearSignature(studentSigPad)} className="clear-btn">
                  Clear
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Date:</label>
              <input type="date" name="studentDate" value={formDataLocal.studentDate} onChange={handleInputChange} required />
            </div>
          </div>

          {/* Guardian Section */}
          <div className="consent-section">
            <h2>Guardian Consent</h2>
            <div className="form-group">
              <label>Guardian Name:</label>
              <input
                type="text"
                name="guardianName"
                value={formDataLocal.guardianName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Signature:</label>
              <div className="signature-container">
                {/* Added touch-action: none for mobile support */}
                <canvas ref={guardianCanvasRef} className="signature-canvas" style={{ touchAction: 'none' }} />
                <button type="button" onClick={() => clearSignature(guardianSigPad)} className="clear-btn">
                  Clear
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Date:</label>
              <input type="date" name="guardianDate" value={formDataLocal.guardianDate} onChange={handleInputChange} required />
            </div>
          </div>

          <div className="consent-buttons">
            <button type="button" onClick={onBack} className="consent-button consent-button-back" disabled={submitting}>
              ⬅️ Back
            </button>
            <button type="submit" className="consent-button consent-button-submit" disabled={submitting}>
              {submitting ? "Submitting..." : "✅ Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsentPage;