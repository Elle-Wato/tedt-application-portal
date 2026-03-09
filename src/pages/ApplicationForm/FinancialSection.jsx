import { useState, useEffect } from "react";
import axios from "axios";
import Section from "../../components/Section";

const API_BASE_URL = "https://api.elimishatrust.or.ke/";

export default function FinancialSection({ onNext, onBack, formData, updateFormData }) {
  const [financialDetails, setFinancialDetails] = useState(formData.financialDetails || {
    bankName: "",
    accountNumber: "",
    hasLoans: "",
    loanAmount: "",
    outstandingBalance: "",
    monthlyRepayment: "",
  });

  useEffect(() => {
    updateFormData("financialDetails", financialDetails);
  }, [financialDetails]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFinancialDetails({ ...financialDetails, [name]: value });
  };

  const handleNext = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to save data.");
      return;
    }

    // --- Validation Logic ---
    // Core requirements
    if (!financialDetails.bankName) {
      alert("Required: Please enter the Bank Name.");
      return;
    }
    if (!financialDetails.accountNumber) {
      alert("Required: Please enter the Account Number.");
      return;
    }
    if (!financialDetails.hasLoans) {
      alert("Required: Please indicate if you have any bank loans.");
      return;
    }

    // Conditional requirements if "Yes" is selected for loans
    if (financialDetails.hasLoans === "yes") {
      if (!financialDetails.loanAmount) {
        alert("Required: Please enter the Loan Amount.");
        return;
      }
      if (!financialDetails.outstandingBalance) {
        alert("Required: Please enter the Outstanding Balance.");
        return;
      }
      if (!financialDetails.monthlyRepayment) {
        alert("Required: Please enter the Monthly Repayment amount.");
        return;
      }
    }

    try {
      await axios.patch(
        `${API_BASE_URL}/admin/students/update-details`,
        { financialDetails },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      onNext();
    } catch (error) {
      console.error("Failed to save financial details:", error);
      alert("Failed to save financial details. Please try again.");
    }
  };

  const handleBack = () => {
    onBack();
  };

  return (
    <Section title="E. Financial Details" className="fin-section">
      <div className="fin-grid">
        <input
          name="bankName"
          placeholder="🏦 Bank Name *"
          value={financialDetails.bankName}
          onChange={handleChange}
          className="fin-input"
        />
        <input
          name="accountNumber"
          placeholder="🔢 Account Number *"
          value={financialDetails.accountNumber}
          onChange={handleChange}
          className="fin-input"
        />
        <select
          name="hasLoans"
          value={financialDetails.hasLoans}
          onChange={handleChange}
          className="fin-select"
          style={{ border: !financialDetails.hasLoans ? "1px solid #ccc" : "" }}
        >
          <option value="">❓ Any Bank Loans? *</option>
          <option value="yes">✅ Yes</option>
          <option value="no">❌ No</option>
        </select>
        
        {financialDetails.hasLoans === "yes" && (
          <>
            <input
              name="loanAmount"
              placeholder="💰 Loan Amount *"
              value={financialDetails.loanAmount}
              onChange={handleChange}
              className="fin-input"
            />
            <input
              name="outstandingBalance"
              placeholder="📊 Outstanding Balance *"
              value={financialDetails.outstandingBalance}
              onChange={handleChange}
              className="fin-input"
            />
            <input
              name="monthlyRepayment"
              placeholder="📅 Monthly Repayment *"
              value={financialDetails.monthlyRepayment}
              onChange={handleChange}
              className="fin-input"
            />
          </>
        )}
      </div>

      <div className="fin-buttons">
        <button onClick={handleBack} className="fin-button fin-button-back">
          ⬅️ Back
        </button>
        <button onClick={handleNext} className="fin-button fin-button-next">
          ➡️ Next
        </button>
      </div>
    </Section>
  );
}