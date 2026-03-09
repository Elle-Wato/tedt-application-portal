import { useState, useEffect } from "react";
import axios from "axios";
import Section from "../../components/Section";

const API_BASE_URL = "https://api.elimishatrust.or.ke/";

export default function SiblingsSection({ onNext, onBack, formData, updateFormData }) {
  // Initialize state from formData if it exists, otherwise start with one empty row
  const [siblings, setSiblings] = useState(
    formData.siblings && formData.siblings.length > 0
      ? formData.siblings
      : [{ name: "", institution: "", level: "", yearlyFees: "" }]
  );

  const [saving, setSaving] = useState(false);

  // Sync with parent state whenever local siblings list changes
  useEffect(() => {
    updateFormData("siblings", siblings);
  }, [siblings]);

  const handleChange = (index, field, value) => {
    const updatedSiblings = [...siblings];
    updatedSiblings[index][field] = value;
    setSiblings(updatedSiblings);
  };

  const addSibling = () => {
    setSiblings([...siblings, { name: "", institution: "", level: "", yearlyFees: "" }]);
  };

  const removeSibling = (index) => {
    if (siblings.length > 1) {
      const updatedSiblings = siblings.filter((_, i) => i !== index);
      setSiblings(updatedSiblings);
    } else {
      // If it's the last row, just clear it instead of removing
      setSiblings([{ name: "", institution: "", level: "", yearlyFees: "" }]);
    }
  };

  const handleNext = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      return;
    }

    setSaving(true);
    try {
      // Patch the data to the backend
      await axios.patch(
        `${API_BASE_URL}/admin/students/update-details`,
        { siblings },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("✅ SIBLINGS SAVED");
      onNext();
    } catch (error) {
      console.error("❌ ERROR SAVING SIBLINGS:", error);
      alert("Failed to save sibling details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="Details of Siblings / Children" className="siblings-section">
      <div className="sib-instructions" style={{ marginBottom: "20px" }}>
        <p>
          <strong>I. Details of Siblings/Children:</strong> Provide information of siblings or children 
          who are still studying whom you support or who are supported by your family.
        </p>
      </div>

      <div className="sib-table-container" style={{ overflowX: "auto" }}>
        <table className="sib-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f4f4f4", textAlign: "left" }}>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Name</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Institution / School</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Level of Study</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Yearly Fees (KSh)</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {siblings.map((sib, index) => (
              <tr key={index}>
                <td style={{ border: "1px solid #ddd" }}>
                  <input
                    type="text"
                    value={sib.name}
                    onChange={(e) => handleChange(index, "name", e.target.value)}
                    placeholder="Enter Name"
                    className="sib-input"
                    style={{ width: "100%", padding: "8px", border: "none" }}
                  />
                </td>
                <td style={{ border: "1px solid #ddd" }}>
                  <input
                    type="text"
                    value={sib.institution}
                    onChange={(e) => handleChange(index, "institution", e.target.value)}
                    placeholder="School Name"
                    className="sib-input"
                    style={{ width: "100%", padding: "8px", border: "none" }}
                  />
                </td>
                <td style={{ border: "1px solid #ddd" }}>
                  <input
                    type="text"
                    value={sib.level}
                    onChange={(e) => handleChange(index, "level", e.target.value)}
                    placeholder="e.g. Form 2 / Grade 4"
                    className="sib-input"
                    style={{ width: "100%", padding: "8px", border: "none" }}
                  />
                </td>
                <td style={{ border: "1px solid #ddd" }}>
                  <input
                    type="number"
                    value={sib.yearlyFees}
                    onChange={(e) => handleChange(index, "yearlyFees", e.target.value)}
                    placeholder="Amount"
                    className="sib-input"
                    style={{ width: "100%", padding: "8px", border: "none" }}
                  />
                </td>
                <td style={{ border: "1px solid #ddd", textAlign: "center" }}>
                  <button 
                    onClick={() => removeSibling(index)} 
                    style={{ background: "none", border: "none", cursor: "pointer", color: "red" }}
                    title="Remove Row"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button 
        onClick={addSibling} 
        style={{ 
          marginTop: "15px", 
          padding: "8px 15px", 
          backgroundColor: "#28a745", 
          color: "white", 
          border: "none", 
          borderRadius: "4px", 
          cursor: "pointer" 
        }}
      >
        + Add Sibling/Child
      </button>

      <div className="guar-buttons" style={{ marginTop: "30px", display: "flex", gap: "10px" }}>
        <button onClick={onBack} className="guar-button guar-button-back" disabled={saving}>
          ⬅️ Back
        </button>
        <button onClick={handleNext} className="guar-button guar-button-next" disabled={saving}>
          {saving ? "Saving..." : "➡️ Next"}
        </button>
      </div>
    </Section>
  );
}