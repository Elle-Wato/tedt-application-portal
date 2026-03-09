import { useState, useEffect } from "react";
import { studentAPI } from "../../api/api";
import Section from "../../components/Section";
import ProgramSelect from "../../components/ProgramSelect";

export default function StudentRequirements({ onNext, formData, updateFormData }) {
  const defaultEducationalQualifications = {
    primary: { level: "", schoolName: "", period: "", grade: "" },
    secondary: { level: "", schoolName: "", period: "", grade: "" },
    postSecondary: { level: "", schoolName: "", period: "", grade: "" },
  };

  const [program, setProgram] = useState(formData.program || "");
  const [personalDetails, setPersonalDetails] = useState(formData.personalDetails || {});
  const [educationalQualifications, setEducationalQualifications] = useState(
    formData.educationalQualifications && Object.keys(formData.educationalQualifications).length > 0
      ? formData.educationalQualifications
      : defaultEducationalQualifications
  );

  const [files, setFiles] = useState({
    cv: null,
    form4Certificate: null,
    schoolLeavingCertificate: null,
    admissionLetter: null,
    nationalID: null,
    kraPinDoc: null,
    passportPhoto: null,
    loanEssay: null,
  });

  const [uploadedUrls, setUploadedUrls] = useState(() => formData.documentsUploaded || {});

  // Helper to identify Postgraduate status
  const isPostgraduate = 
    program.toLowerCase().includes("postgraduate") || 
    program.toLowerCase().includes("masters") || 
    program.toLowerCase().includes("phd");

  // Cleanup effect: Reset restricted data when switching to Postgraduate
  useEffect(() => {
    if (isPostgraduate) {
      setEducationalQualifications(prev => ({
        ...prev,
        primary: { level: "", schoolName: "", period: "", grade: "" },
        secondary: { level: "", schoolName: "", period: "", grade: "" },
      }));

      setUploadedUrls(prev => {
        const updated = { ...prev };
        delete updated.schoolLeavingCertificate;
        delete updated.loanEssay;
        return updated;
      });

      setFiles(prev => ({
        ...prev,
        schoolLeavingCertificate: null,
        loanEssay: null,
      }));
    }
  }, [isPostgraduate]);

  // Sync state with parent formData
  useEffect(() => { updateFormData("program", program); }, [program]);
  useEffect(() => { updateFormData("personalDetails", personalDetails); }, [personalDetails]);
  useEffect(() => { updateFormData("educationalQualifications", educationalQualifications); }, [educationalQualifications]);
  useEffect(() => { updateFormData("documentsUploaded", uploadedUrls); }, [uploadedUrls]);

  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalDetails({ ...personalDetails, [name]: value });
  };

  const handleEducationChange = (section, field, value) => {
    setEducationalQualifications({
      ...educationalQualifications,
      [section]: { ...educationalQualifications[section], [field]: value },
    });
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
      uploadFile(selectedFiles[0]).then(url => {
        setUploadedUrls(prev => ({ ...prev, [name]: url }));
      });
    }
  };

  const uploadFile = async (file) => {
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    const res = await studentAPI.uploadFile(formDataUpload);
    return res.data.file_url;
  };

  const handleNext = async () => {
    if (!program) {
      alert("Please select a program before proceeding.");
      return;
    }

    // --- Specific Validation Logic ---
    
    // 1. Validate Required Personal Details
    const requiredPersonalFields = [
      { id: "fullName", label: "Full Name" },
      { id: "nationality", label: "Nationality" },
      { id: "idPassportNo", label: "ID/Passport No." },
      { id: "dateOfBirth", label: "Date of Birth" },
      { id: "maritalStatus", label: "Marital Status" },
      { id: "telephoneNo", label: "Telephone No." },
      { id: "kraPin", label: "KRA PIN" },
      { id: "county", label: "County" },
      { id: "postalAddress", label: "Postal Address" },
      { id: "residentialAddress", label: "Residential Address" },
      { id: "permanentHomeAddress", label: "Permanent Home Address" },
      { id: "emailAddress", label: "Email Address" }
    ];

    for (let field of requiredPersonalFields) {
      if (!personalDetails[field.id]) {
        alert(`Required: Please enter your ${field.label}.`);
        return;
      }
    }

    // 2. Validate Education (Check Institution name for the visible section)
    if (isPostgraduate) {
        if (!educationalQualifications.postSecondary.schoolName) {
            alert("Required: Please enter your Previous University/College name.");
            return;
        }
    } else {
        if (!educationalQualifications.primary.schoolName || !educationalQualifications.secondary.schoolName) {
            alert("Required: Please enter your Primary and Secondary school names.");
            return;
        }
    }

    // 3. Validate Required Document Uploads
    const requiredDocs = [
      { id: "cv", label: "Curriculum Vitae (CV)" },
      { id: "form4Certificate", label: isPostgraduate ? "Last Educational Certificate" : "Form 4 Certificate" },
      { id: "admissionLetter", label: "University Admission Letter" },
      { id: "nationalID", label: "National ID" },
      { id: "kraPinDoc", label: "KRA PIN" },
      { id: "passportPhoto", label: "Passport Size Photo" }
    ];

    if (!isPostgraduate) {
      requiredDocs.push({ id: "schoolLeavingCertificate", label: "School Leaving Certificate" });
      requiredDocs.push({ id: "loanEssay", label: "300-word Loan Essay" });
    }

    for (let doc of requiredDocs) {
      if (!uploadedUrls[doc.id]) {
        alert(`Required: Please upload your ${doc.label}.`);
        return;
      }
    }

    try {
      const payload = {
        program,
        personalDetails,
        educationalQualifications,
        documentsUploaded: uploadedUrls,
      };
      await studentAPI.updateDetails(payload);
      onNext();
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Failed to save data.");
    }
  };

  return (
    <Section title="Student Requirements" className="req-section">
      <div className="req-grid">
        <div className="req-field">
          <label className="req-label">🎓 Choose Program <span style={{color: 'red'}}>*</span></label>
          <ProgramSelect
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            className="req-select"
          />
        </div>
      </div>

      {/* A. Personal Details */}
      <div className="req-section">
        <h3>A. Student Personal Details</h3>
        <div className="req-grid">
          <input name="fullName" placeholder="1. Full Name as per ID *" value={personalDetails.fullName || ""} onChange={handlePersonalChange} className="req-input" />
          <input name="nationality" placeholder="2. Nationality *" value={personalDetails.nationality || ""} onChange={handlePersonalChange} className="req-input" />
          <input name="idPassportNo" placeholder="3. ID/Passport No. *" value={personalDetails.idPassportNo || ""} onChange={handlePersonalChange} className="req-input" />
          <input type="date" name="dateOfBirth" value={personalDetails.dateOfBirth || ""} onChange={handlePersonalChange} className="req-input" />
          <input name="maritalStatus" placeholder="5. Marital Status *" value={personalDetails.maritalStatus || ""} onChange={handlePersonalChange} className="req-input" />
          <input type="number" name="noOfChildren" placeholder="6. No. of Children" value={personalDetails.noOfChildren || ""} onChange={handlePersonalChange} className="req-input" />
          <input type="tel" name="telephoneNo" placeholder="7. Telephone No. *" value={personalDetails.telephoneNo || ""} onChange={handlePersonalChange} className="req-input" />
          <input name="kraPin" placeholder="8. KRA PIN *" value={personalDetails.kraPin || ""} onChange={handlePersonalChange} className="req-input" />
          <input name="county" placeholder="9. County *" value={personalDetails.county || ""} onChange={handlePersonalChange} className="req-input" />
          <input name="postalAddress" placeholder="10. Postal Address *" value={personalDetails.postalAddress || ""} onChange={handlePersonalChange} className="req-input" />
          <input name="poBox" placeholder="P. O. Box" value={personalDetails.poBox || ""} onChange={handlePersonalChange} className="req-input" />
          <input name="socialMedia" placeholder="12. Social media accounts" value={personalDetails.socialMedia || ""} onChange={handlePersonalChange} className="req-input" />
          <input name="residentialAddress" placeholder="13. Residential Address *" value={personalDetails.residentialAddress || ""} onChange={handlePersonalChange} className="req-input" />
          <input name="permanentHomeAddress" placeholder="14. Permanent Home Address *" value={personalDetails.permanentHomeAddress || ""} onChange={handlePersonalChange} className="req-input" />
          <input type="email" name="emailAddress" placeholder="15. Email Address *" value={personalDetails.emailAddress || ""} onChange={handlePersonalChange} className="req-input" />
        </div>
      </div>

      {/* B. Educational Qualification */}
      <div className="req-section">
        <h3>B. Educational Qualification</h3>
        
        {!isPostgraduate && (
          <>
            <div className="education-section">
              <h4>a. Primary School</h4>
              <div className="req-grid">
                <input placeholder="Level" value={educationalQualifications.primary.level} onChange={e => handleEducationChange("primary", "level", e.target.value)} className="req-input" />
                <input placeholder="Name of school *" value={educationalQualifications.primary.schoolName} onChange={e => handleEducationChange("primary", "schoolName", e.target.value)} className="req-input" />
                <input placeholder="Period" value={educationalQualifications.primary.period} onChange={e => handleEducationChange("primary", "period", e.target.value)} className="req-input" />
                <input placeholder="Grade attained" value={educationalQualifications.primary.grade} onChange={e => handleEducationChange("primary", "grade", e.target.value)} className="req-input" />
              </div>
            </div>

            <div className="education-section">
              <h4>b. Secondary School</h4>
              <div className="req-grid">
                <input placeholder="Level" value={educationalQualifications.secondary.level} onChange={e => handleEducationChange("secondary", "level", e.target.value)} className="req-input" />
                <input placeholder="Name of school *" value={educationalQualifications.secondary.schoolName} onChange={e => handleEducationChange("secondary", "schoolName", e.target.value)} className="req-input" />
                <input placeholder="Period" value={educationalQualifications.secondary.period} onChange={e => handleEducationChange("secondary", "period", e.target.value)} className="req-input" />
                <input placeholder="Grade attained" value={educationalQualifications.secondary.grade} onChange={e => handleEducationChange("secondary", "grade", e.target.value)} className="req-input" />
              </div>
            </div>
          </>
        )}

        <div className="education-section">
          <h4>{isPostgraduate ? "a. Previous University/College *" : "c. Post-Secondary"}</h4>
          <div className="req-grid">
            <input placeholder="Level (e.g. Bachelors)" value={educationalQualifications.postSecondary.level} onChange={e => handleEducationChange("postSecondary", "level", e.target.value)} className="req-input" />
            <input placeholder="Name of institution *" value={educationalQualifications.postSecondary.schoolName} onChange={e => handleEducationChange("postSecondary", "schoolName", e.target.value)} className="req-input" />
            <input placeholder="Period" value={educationalQualifications.postSecondary.period} onChange={e => handleEducationChange("postSecondary", "period", e.target.value)} className="req-input" />
            <input placeholder="Grade/GPA attained" value={educationalQualifications.postSecondary.grade} onChange={e => handleEducationChange("postSecondary", "grade", e.target.value)} className="req-input" />
          </div>
        </div>
      </div>

      {/* C. Document Uploads */}
      <div className="req-section">
        <h3>Document Uploads</h3>
        <div className="req-grid">
          <div className="req-field">
            <label className="req-label">📄 Curriculum Vitae (CV) <span style={{color: 'red'}}>*</span></label>
            <input type="file" name="cv" className="req-file" onChange={handleFileChange} />
            {uploadedUrls.cv && <div className="upload-status">✅ Uploaded | <a href={uploadedUrls.cv} target="_blank" rel="noreferrer">View</a></div>}
          </div>

          <div className="req-field">
            <label className="req-label">{isPostgraduate ? "📜 Last Educational Certificate" : "📜 Form 4 Certificate"} <span style={{color: 'red'}}>*</span></label>
            <input type="file" name="form4Certificate" className="req-file" onChange={handleFileChange} />
            {uploadedUrls.form4Certificate && <div className="upload-status">✅ Uploaded | <a href={uploadedUrls.form4Certificate} target="_blank" rel="noreferrer">View</a></div>}
          </div>

          {!isPostgraduate && (
            <>
              <div className="req-field">
                <label className="req-label">🏫 School Leaving Certificate <span style={{color: 'red'}}>*</span></label>
                <input type="file" name="schoolLeavingCertificate" className="req-file" onChange={handleFileChange} />
                {uploadedUrls.schoolLeavingCertificate && <div className="upload-status">✅ Uploaded | <a href={uploadedUrls.schoolLeavingCertificate} target="_blank" rel="noreferrer">View</a></div>}
              </div>
              <div className="req-field">
                <label className="req-label">✍️ 300-word Loan Essay <span style={{color: 'red'}}>*</span></label>
                <input type="file" name="loanEssay" className="req-file" onChange={handleFileChange} />
                {uploadedUrls.loanEssay && <div className="upload-status">✅ Uploaded | <a href={uploadedUrls.loanEssay} target="_blank" rel="noreferrer">View</a></div>}
              </div>
            </>
          )}

          <div className="req-field">
            <label className="req-label">🎓 University Admission Letter <span style={{color: 'red'}}>*</span></label>
            <input type="file" name="admissionLetter" className="req-file" onChange={handleFileChange} />
            {uploadedUrls.admissionLetter && <div className="upload-status">✅ Uploaded | <a href={uploadedUrls.admissionLetter} target="_blank" rel="noreferrer">View</a></div>}
          </div>
          <div className="req-field">
            <label className="req-label">🆔 National ID <span style={{color: 'red'}}>*</span></label>
            <input type="file" name="nationalID" className="req-file" onChange={handleFileChange} />
            {uploadedUrls.nationalID && <div className="upload-status">✅ Uploaded | <a href={uploadedUrls.nationalID} target="_blank" rel="noreferrer">View</a></div>}
          </div>
          <div className="req-field">
            <label className="req-label">📋 KRA PIN <span style={{color: 'red'}}>*</span></label>
            <input type="file" name="kraPinDoc" className="req-file" onChange={handleFileChange} />
            {uploadedUrls.kraPinDoc && <div className="upload-status">✅ Uploaded | <a href={uploadedUrls.kraPinDoc} target="_blank" rel="noreferrer">View</a></div>}
          </div>
          <div className="req-field">
            <label className="req-label">📸 Passport Size Photo <span style={{color: 'red'}}>*</span></label>
            <input type="file" name="passportPhoto" className="req-file" onChange={handleFileChange} />
            {uploadedUrls.passportPhoto && <div className="upload-status">✅ Uploaded | <a href={uploadedUrls.passportPhoto} target="_blank" rel="noreferrer">View</a></div>}
          </div>
        </div>
      </div>

      <button onClick={handleNext} className="req-button">➡️ Next</button>
    </Section>
  );
}