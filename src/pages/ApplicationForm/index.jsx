import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { studentAPI } from "../../api/api";
import StudentRequirements from "./StudentRequirements";
import ParentGuardianSection from "./ParentGuardianSection";
import EmploymentSection from "./EmploymentSection";
import FinancialSection from "./FinancialSection";
import LoanDetailsSection from "./LoanDetailsSection";
import BudgetPlannerSection from "./BudgetPlannerSection";
import RefereesSection from "./RefereesSection";
import RecommendationsSection from "./RecommendationsSection";
import GuarantorSection from "./GuarantorSection";
import ConsentPage from "./ConsentPage";
import SiblingsSection from "./SiblingsSection";


export default function ApplicationForm() {
  const navigate = useNavigate();
  // 1. Initialize step from localStorage so refreshes don't reset to Step 1
  const [step, setStep] = useState(() => {
    const savedStep = localStorage.getItem("currentStep");
    return savedStep ? parseInt(savedStep, 10) : 1;
  });

  const [isLocked, setIsLocked] = useState(false);
  const [lockChecked, setLockChecked] = useState(false);

  const [formData, setFormData] = useState({
    program: "",
    personalDetails: {},
    educationalQualifications: {},
    documentsUploaded: {},
    parentGuardian: {},
    parentGuardianDocuments: {},
    employmentDetails: {},
    employmentDocuments: {},
    financialDetails: {},
    loanDetails: {},
    referees: {},
    budgetDetails: {},
    recommendations: {},
    guarantors: [],
    consentForm: {},
    siblings: {},
    student: {},
  });

  // 2. Persist step change to localStorage
  useEffect(() => {
    localStorage.setItem("currentStep", step);
  }, [step]);

  // 3. Check lock status and "Hydrate" (Auto-Resume) logic
  useEffect(() => {
    const checkLockStatus = async () => {
      const token = localStorage.getItem("token");
      if (!token) return; // 👈 Add this: Stops the error if logged out
      try {
        const res = await studentAPI.checkSubmissionStatus();
        const data = res.data;

        setIsLocked(data.is_locked || false);

        if (data.details) {
          setFormData((prev) => ({ ...prev, ...data.details }));
        

          // --- AUTO-RESUME LOGIC ---
          // If the user hasn't manually moved past step 1, 
          // we jump them to the last saved section found in the DB.
          const currentSavedStep = localStorage.getItem("currentStep");
          
          if (!currentSavedStep || currentSavedStep === "1") {
            if (data.details.referees && Object.keys(data.details.referees).length > 0) {
              setStep(7); // Move to Budget if Referees exist
            } else if (data.details.loanDetails && Object.keys(data.details.loanDetails).length > 0) {
              setStep(6); // Move to Referees if Loan exists
            } else if (data.details.employmentDetails && Object.keys(data.details.employmentDetails).length > 0) {
              setStep(4); // Example: Move to Financial
            }
          }
        }
      } catch (err) {
        if (err.response?.status !== 401) { // 👈 Don't log if it's just a logout 401
        console.error("Could not check lock status:", err);
      }
      } finally {
        setLockChecked(true);
      }
    };
    checkLockStatus();
  }, []);

  const updateFormData = (section, data) => {
    setFormData((prev) => ({ ...prev, [section]: data }));
  };

  const isPostgrad = 
    formData.program?.toLowerCase().includes("postgraduate") || 
    formData.program?.toLowerCase().includes("masters") || 
    formData.program?.toLowerCase().includes("phd");

  const nextStep = () => {
    setStep((prev) => {
      // If we are at Step 7 (Budget) and moving forward, skip 8 if Postgrad
      if (prev === 7 && isPostgrad) {
        return 9; 
      }
      return Math.min(prev + 1, 11);
    });
  };
  const prevStep = () => {
    setStep((prev) => {
      // If we are at Step 9 (Guarantor) and moving back, skip 8 if Postgrad
      if (prev === 9 && isPostgrad) {
        return 7;
      }
      return Math.max(prev - 1, 1);
    });
  };

  const sharedProps = {
    formData,
    updateFormData,
    isLocked,
    onNext: nextStep,
    onBack: prevStep,
  };

  if (!lockChecked) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px", fontSize: "16px", color: "#2d6a9f", fontWeight: "600" }}>
        ⏳ Loading your application...
      </div>
    );
  }

  // 2. If Locked, show the Success/Receipt screen ONLY
 if (isLocked) {
    const pDetails = formData?.personalDetails || {};
    const sDetails = formData?.student || {};

    const studentName = 
      formData.personalDetails?.fullName || 
      formData.details?.personalDetails?.fullName || 
      formData.student?.name || 
      "N/A";

    const idNo = 
      pDetails?.idNumber || 
      pDetails?.idPassportNo || 
      sDetails?.id_number || 
      "N/A";

    const programName = formData?.program || "Loan Application";

    return (
      <div style={{ maxWidth: "800px", margin: "50px auto", padding: "20px" }}>
        
        <div className="no-print" style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: "48px", margin: "0" }}>🎉</h1>
          <h2 style={{ color: "#2d6a9f", marginTop: "10px" }}>Application Submitted!</h2>
          <p>Please download your receipt for your records.</p>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
            <button 
              onClick={() => window.print()}
              style={{ padding: "10px 20px", cursor: "pointer", borderRadius: "8px", border: "1px solid #ccc", fontWeight: "bold" }}
            >
              📥 Download/Print Receipt
            </button>
            <button 
              onClick={() => { localStorage.clear(); navigate("/", { replace: true }); }}
              style={{ padding: "10px 20px", backgroundColor: "#2d6a9f", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
            >
              Logout & Exit
            </button>
          </div>
        </div>
        
        {/* THE RECEIPT */}
        <div style={{ border: "2px solid #333", padding: "40px", borderRadius: "0", backgroundColor: "#fff" }}>
          <div style={{ textAlign: 'center', borderBottom: "2px solid #333", paddingBottom: "20px" }}>
            <h1 style={{ margin: 0, color: "#000" }}>ELIMISHA TRUST</h1>
            <p style={{ margin: 5, fontSize: "14px" }}>OFFICIAL LOAN APPLICATION RECEIPT</p>
          </div>

          <div style={{ margin: "30px 0", lineHeight: "2" }}>
            <p style={{ borderBottom: "1px solid #eee" }}><strong>Submission Date:</strong> {new Date().toLocaleDateString()}</p>
           <p style={{ borderBottom: "1px solid #eee" }}><strong>Student Name:</strong> {studentName}</p>
           <p style={{ borderBottom: "1px solid #eee" }}><strong>ID/Passport Number:</strong> {idNo}</p>
           <p style={{ borderBottom: "1px solid #eee" }}><strong>Academic Program:</strong> {programName}</p>
          </div>
          
          <table style={{ width: "100%", marginTop: "20px", borderCollapse: "collapse", border: "1px solid #000" }}>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th style={{ border: "1px solid #000", padding: "12px", textAlign: 'left' }}>Section</th>
                <th style={{ border: "1px solid #000", padding: "12px", textAlign: 'left' }}>Submission Status</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ border: "1px solid #000", padding: "10px" }}>Student Documents & Profile</td><td style={{ border: "1px solid #000", padding: "10px" }}>RECEIVED</td></tr>
              <tr><td style={{ border: "1px solid #000", padding: "10px" }}>Guarantor & Referee Info</td><td style={{ border: "1px solid #000", padding: "10px" }}>RECEIVED</td></tr>
              <tr><td style={{ border: "1px solid #000", padding: "10px" }}>Financial Assessment Data</td><td style={{ border: "1px solid #000", padding: "10px" }}>RECEIVED</td></tr>
              <tr><td style={{ border: "1px solid #000", padding: "10px" }}>Final Consent & Declaration</td><td style={{ border: "1px solid #000", padding: "10px" }}>SIGNED</td></tr>
            </tbody>
          </table>
          
          <div style={{ marginTop: "50px", textAlign: 'center', fontSize: "11px", color: "#555" }}>
            <p>This is a computer-generated receipt for the Elimisha Trust Loan Application System.</p>
            <p>Reference ID: {idNo}-{new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    );
}

  // 3. If NOT Locked, show the step-by-step form
  return (
    <div>
      {/* Steps mapping */}
      {step === 1 && <StudentRequirements {...sharedProps} />}
      {step === 2 && <ParentGuardianSection {...sharedProps} />}
      {step === 3 && <EmploymentSection {...sharedProps} />}
      {step === 4 && <FinancialSection {...sharedProps} />}
      {step === 5 && <LoanDetailsSection {...sharedProps} />}
      {step === 6 && <RefereesSection {...sharedProps} />}
      {step === 7 && <BudgetPlannerSection {...sharedProps} />}
      {step === 8 && !isPostgrad && <RecommendationsSection {...sharedProps} />}
      {step === 9 && <GuarantorSection {...sharedProps} program={formData.program} />}
      {step === 10 && <SiblingsSection {...sharedProps} />}
      {step === 11 && <ConsentPage {...sharedProps} />}
    </div>
  );
}
