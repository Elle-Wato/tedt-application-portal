import { useState, useEffect } from "react";
import axios from "axios";
import Section from "../../components/Section";

const API_BASE_URL = "https://api.elimishatrust.or.ke/";

export default function RefereesSection({ onNext, onBack, formData, updateFormData }) {
  // 1. Define the structure
  const defaultReferees = {
    firstReferee: { name: "", contacts: "", email: "", placeOfWork: "" },
    secondReferee: { name: "", contacts: "", email: "", placeOfWork: "" },
    thirdReferee: { name: "", contacts: "", email: "", placeOfWork: "" }
  };

  // 2. Initialize State with cloud/form data
  const [referees, setReferees] = useState({
    ...defaultReferees,
    ...formData.referees 
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    updateFormData("referees", referees);
  }, [referees]);

  const handleChange = (referee, field, value) => {
    setReferees({
      ...referees,
      [referee]: {
        ...referees[referee],
        [field]: value
      }
    });
  };

  const handleNext = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to save data.");
      return;
    }

    // --- Validation Requirements ---
    const refereeKeys = [
      { key: "firstReferee", label: "1st Referee (Spouse)" },
      { key: "secondReferee", label: "2nd Referee (Colleague)" },
      { key: "thirdReferee", label: "3rd Referee (Other)" }
    ];

    const fields = [
      { id: "name", label: "Name" },
      { id: "contacts", label: "Contacts" },
      { id: "email", label: "Email Address" },
      { id: "placeOfWork", label: "Place of Work" }
    ];

    for (let ref of refereeKeys) {
      for (let field of fields) {
        if (!referees[ref.key][field.id] || referees[ref.key][field.id].trim() === "") {
          alert(`Required: Please provide the ${field.label} for ${ref.label}.`);
          return;
        }
      }
    }

    setSaving(true);

    try {
      await axios.patch(
        `${API_BASE_URL}/admin/students/update-details`,
        { referees },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      console.log("✅ REFEREES SAVED SUCCESSFULLY");
      onNext();
    } catch (error) {
      console.error("❌ ERROR SAVING REFEREES:", error.response?.data || error);
      alert("Failed to save data. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    onBack();
  };

  return (
    <Section title="G. Referees" className="ref-section">
      <div className="ref-group">
        <h4 className="ref-heading">👫 1st Referee (Spouse)</h4>
        <div className="ref-grid">
          <input
            placeholder="👤 Name *"
            className="ref-input"
            value={referees.firstReferee.name}
            onChange={(e) => handleChange("firstReferee", "name", e.target.value)}
          />
          <input
            placeholder="📞 Contacts *"
            className="ref-input"
            value={referees.firstReferee.contacts}
            onChange={(e) => handleChange("firstReferee", "contacts", e.target.value)}
          />
          <input
            type="email"
            placeholder="📧 Email Address *"
            className="ref-input"
            value={referees.firstReferee.email}
            onChange={(e) => handleChange("firstReferee", "email", e.target.value)}
          />
          <input
            placeholder="🏢 Place of Work *"
            className="ref-input"
            value={referees.firstReferee.placeOfWork}
            onChange={(e) => handleChange("firstReferee", "placeOfWork", e.target.value)}
          />
        </div>
      </div>

      <div className="ref-group">
        <h4 className="ref-heading">👔 2nd Referee (Colleague / Business)</h4>
        <div className="ref-grid">
          <input
            placeholder="👤 Name *"
            className="ref-input"
            value={referees.secondReferee.name}
            onChange={(e) => handleChange("secondReferee", "name", e.target.value)}
          />
          <input
            placeholder="📞 Contacts *"
            className="ref-input"
            value={referees.secondReferee.contacts}
            onChange={(e) => handleChange("secondReferee", "contacts", e.target.value)}
          />
          <input
            type="email"
            placeholder="📧 Email Address *"
            className="ref-input"
            value={referees.secondReferee.email}
            onChange={(e) => handleChange("secondReferee", "email", e.target.value)}
          />
          <input
            placeholder="🏢 Place of Work *"
            className="ref-input"
            value={referees.secondReferee.placeOfWork}
            onChange={(e) => handleChange("secondReferee", "placeOfWork", e.target.value)}
          />
        </div>
      </div>

      <div className="ref-group">
        <h4 className="ref-heading">👥 3rd Referee (Other)</h4>
        <div className="ref-grid">
          <input
            placeholder="👤 Name *"
            className="ref-input"
            value={referees.thirdReferee.name}
            onChange={(e) => handleChange("thirdReferee", "name", e.target.value)}
          />
          <input
            placeholder="📞 Contacts *"
            className="ref-input"
            value={referees.thirdReferee.contacts}
            onChange={(e) => handleChange("thirdReferee", "contacts", e.target.value)}
          />
          <input
            type="email"
            placeholder="📧 Email Address *"
            className="ref-input"
            value={referees.thirdReferee.email}
            onChange={(e) => handleChange("thirdReferee", "email", e.target.value)}
          />
          <input
            placeholder="🏢 Place of Work *"
            className="ref-input"
            value={referees.thirdReferee.placeOfWork}
            onChange={(e) => handleChange("thirdReferee", "placeOfWork", e.target.value)}
          />
        </div>
      </div>

      <div className="ref-buttons">
        <button
          onClick={handleBack}
          className="ref-button ref-button-back"
          disabled={saving}
        >
          ⬅️ Back
        </button>
        <button
          onClick={handleNext}
          className="ref-button ref-button-next"
          disabled={saving}
        >
          {saving ? "Saving..." : "➡️ Next"}
        </button>
      </div>
    </Section>
  );
}