import { useState, useEffect } from "react";
import axios from "axios";
import Section from "../../components/Section";

const API_BASE_URL = "https://api.elimishatrust.or.ke/";

export default function LoanDetailsSection({ onNext, onBack, formData, updateFormData }) {
  const [loanDetails, setLoanDetails] = useState(formData.loanDetails || {
    universityName: "",
    studyProgram: "",
    levelOfStudy: "",
    amountApplied: "",
    repaymentPeriod: "",
    loanSecurity: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    updateFormData("loanDetails", loanDetails);
  }, [loanDetails]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoanDetails({ ...loanDetails, [name]: value });
  };

  const handleNext = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to save data.");
      return;
    }

    // --- Validation Requirements ---
    const requiredFields = [
      { id: "universityName", label: "University / College Name" },
      { id: "studyProgram", label: "Study Program" },
      { id: "levelOfStudy", label: "Level of Study" },
      { id: "amountApplied", label: "Amount Applied" },
      { id: "repaymentPeriod", label: "Repayment Period" },
      { id: "loanSecurity", label: "Loan Security" },
    ];

    for (let field of requiredFields) {
      if (!loanDetails[field.id] || loanDetails[field.id].trim() === "") {
        alert(`Required: Please provide the ${field.label}.`);
        return;
      }
    }

    setSaving(true);

    try {
      await axios.patch(
        `${API_BASE_URL}/admin/students/update-details`,
        { loanDetails },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("✅ LOAN DETAILS SAVED");
      onNext();
    } catch (error) {
      console.error("Failed to save loan details:", error);
      alert("Failed to save loan details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    onBack();
  };

  return (
    <Section title="F. AEDT Loan Details" className="loan-section">
      <div className="loan-grid">
        <input
          name="universityName"
          placeholder="🎓 University / College Name *"
          value={loanDetails.universityName}
          onChange={handleChange}
          className="loan-input"
        />
        <input
          name="studyProgram"
          placeholder="📚 Study Program *"
          value={loanDetails.studyProgram}
          onChange={handleChange}
          className="loan-input"
        />
        <input
          name="levelOfStudy"
          placeholder="📖 Level of Study (Sem 1, Sem 2) *"
          value={loanDetails.levelOfStudy}
          onChange={handleChange}
          className="loan-input"
        />
        <input
          name="amountApplied"
          placeholder="💵 Amount Applied (Ksh) *"
          value={loanDetails.amountApplied}
          onChange={handleChange}
          className="loan-input"
        />
        <input
          name="repaymentPeriod"
          placeholder="⏰ Repayment Period *"
          value={loanDetails.repaymentPeriod}
          onChange={handleChange}
          className="loan-input"
        />
        <input
          name="loanSecurity"
          placeholder="🔒 Loan Security (Guarantor / Collateral) *"
          value={loanDetails.loanSecurity}
          onChange={handleChange}
          className="loan-input"
        />
      </div>

      <div className="loan-buttons">
        <button 
          onClick={handleBack} 
          className="loan-button loan-button-back"
          disabled={saving}
        >
          ⬅️ Back
        </button>
        <button 
          onClick={handleNext} 
          className="loan-button loan-button-next"
          disabled={saving}
        >
          {saving ? "Saving..." : "➡️ Next"}
        </button>
      </div>
    </Section>
  );
}