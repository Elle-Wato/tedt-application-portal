import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import logo from "../../assets/logo.png";
import "./StaffDashboard.css";

const API_BASE_URL = "https://api.elimishatrust.or.ke/";

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const printRef = useRef();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [filter, setFilter] = useState("all");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data);
      setError("");
    } catch {
      setError("You are not authorized to view this page");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetails = async (studentId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedStudent(res.data);
    } catch {
      alert("Failed to fetch student details");
    }
  };

  const updateStatus = async (studentId, status) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/staff/submission/${studentId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchStudents();
      setSelectedStudent(null);
    } catch {
      alert("Failed to update status");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const safeParseJSON = (details) => {
    if (!details) return {};
    try {
      return typeof details === "string" ? JSON.parse(details) : details;
    } catch {
      return {};
    }
  };

  const getDetailValue = (details, pathArray) => {
    if (!details) return null;
    let obj = safeParseJSON(details);
    return pathArray.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
  };

  const getStudentName = (student) => {
    return (
      student.name ||
      getDetailValue(student.details, ["personalDetails", "fullName"]) ||
      getDetailValue(student.details, ["studentName"]) ||
      "N/A"
    );
  };

  const getStudentCourse = (student) => {
    return student.course || student.loan_studyProgram || "N/A";
  };

  const getStudentInstitution = (student) => {
    return student.institution || student.loan_universityName || "N/A";
  };

  const getStudentProgram = (student) => {
    if (student.program) return student.program;
    const programValue = getDetailValue(student.details, ["program"]);
    if (programValue) {
      return programValue.charAt(0).toUpperCase() + programValue.slice(1);
    }
    return getDetailValue(student.details, ["loanDetails", "studyProgram"]) || "N/A";
  };

  const getStudentEmail = (student) => {
    return student.email || "N/A";
  };

  const filteredStudents = students.filter(s => {
    const matchesStatus = filter === "all" || s.status === filter;
    const name = getStudentName(s).toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (searchDate) {
      const submissionDate = s.submitted_at ? new Date(s.submitted_at).toISOString().split('T')[0] : "";
      matchesDate = submissionDate === searchDate;
    }
    
    return matchesStatus && matchesSearch && matchesDate;
  });

  return (
    <div className="staff-bg">
      <header className="staff-header">
        <img src={logo} alt="Logo" className="staff-logo" />
        <h2>📋 Staff Dashboard</h2>
        <button onClick={logout} className="staff-logout">Logout</button>
      </header>

      <div className="staff-container">
        {/* --- SEARCH BAR SECTION --- */}
        <div className="search-bar-container" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search by name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <label>Date Submitted:</label>
            <input 
              type="date" 
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="search-input"
            />
          </div>

          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <button 
            onClick={() => {setSearchTerm(""); setSearchDate(""); setFilter("all");}}
            className="reset-btn"
          >
            Reset Filters
          </button>
        </div>

        {loading && <p>Loading applications...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && filteredStudents.length === 0 && <p>No applications submitted yet.</p>}

        {!loading && filteredStudents.length > 0 && (
          <table className="staff-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student Name</th>
                <th>Program</th>
                <th>Status</th>
                <th>Submitted At</th>
                <th>Actions</th>
                <th>Full Application</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s, index) => (
  <tr key={s.submission_id || s.id || index}> 
    <td>{index + 1}</td>
    <td>{getStudentName(s)}</td>
    <td>{getStudentProgram(s)}</td>
    <td className={`status ${s.status}`}>
      {s.status ? s.status.toUpperCase() : 'PENDING'}
    </td>
                  <td>{s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : "N/A"}</td>
                  <td>
                    <button className="approve-btn" onClick={() => updateStatus(s.id, "approved")}>Approve</button>
                    <button className="reject-btn" onClick={() => updateStatus(s.id, "rejected")}>Reject</button>
                  </td>
                  <td>
                    <button onClick={() => fetchStudentDetails(s.id)}>
                      View Full Application
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* FULL APPLICATION MODAL */}
        {selectedStudent && (
          <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div ref={printRef} className="printable-application">
                <h1>Full Loan Application Review</h1>

                <p><strong>Name:</strong> {selectedStudent.name}</p>
                <p><strong>Email:</strong> {selectedStudent.email}</p>
                <p><strong>Program:</strong> {getDetailValue(selectedStudent.details, ["program"]) || "N/A"}</p>
                <p><strong>Status:</strong> {selectedStudent.status?.toUpperCase()}</p>
                <p><strong>Submitted At:</strong> {selectedStudent.submitted_at ? new Date(selectedStudent.submitted_at).toLocaleDateString() : "N/A"}</p>

                {/* ================= PERSONAL DETAILS ================= */}
                <div className="section">
                  <h2>1. Personal Details</h2>
                  <div className="grid-2">
                    <div className="field">
                      <span className="label">Full Name</span>
                      <span className="value">
                        {getDetailValue(selectedStudent.details, ["personalDetails", "fullName"]) || "N/A"}
                      </span>
                    </div>
                    <div className="field">
                      <span className="label">Nationality</span>
                      <span className="value">
                        {getDetailValue(selectedStudent.details, ["personalDetails", "nationality"]) || "N/A"}
                      </span>
                    </div>
                    <div className="field">
                      <span className="label">ID / Passport Number</span>
                      <span className="value">
                        {getDetailValue(selectedStudent.details, ["personalDetails", "idPassportNo"]) || "N/A"}
                      </span>
                    </div>
                    <div className="field">
                      <span className="label">Date of Birth</span>
                      <span className="value">
                        {getDetailValue(selectedStudent.details, ["personalDetails", "dateOfBirth"]) || "N/A"}
                      </span>
                    </div>
                    <div className="field">
                      <span className="label">Marital Status</span>
                      <span className="value">
                        {getDetailValue(selectedStudent.details, ["personalDetails", "maritalStatus"]) || "N/A"}
                      </span>
                    </div>
                    <div className="field">
                      <span className="label">Telephone Number</span>
                      <span className="value">
                        {getDetailValue(selectedStudent.details, ["personalDetails", "telephoneNo"]) || "N/A"}
                      </span>
                    </div>
                    <div className="field">
                      <span className="label">County</span>
                      <span className="value">
                        {getDetailValue(selectedStudent.details, ["personalDetails", "county"]) || "N/A"}
                      </span>
                    </div>
                    <div className="field">
                      <span className="label">Email Address</span>
                      <span className="value">
                        {getDetailValue(selectedStudent.details, ["personalDetails", "emailAddress"]) || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <h2>Educational Qualifications</h2>
                <h3>Primary School</h3>
                <p><strong>Level:</strong> {getDetailValue(selectedStudent.details, ["educationalQualifications", "primary", "level"]) || "N/A"}</p>
                <p><strong>School Name:</strong> {getDetailValue(selectedStudent.details, ["educationalQualifications", "primary", "schoolName"]) || "N/A"}</p>
                <p><strong>Period:</strong> {getDetailValue(selectedStudent.details, ["educationalQualifications", "primary", "period"]) || "N/A"}</p>
                <p><strong>Grade:</strong> {getDetailValue(selectedStudent.details, ["educationalQualifications", "primary", "grade"]) || "N/A"}</p>

                <h3>Secondary School</h3>
                <p><strong>Level:</strong> {getDetailValue(selectedStudent.details, ["educationalQualifications", "secondary", "level"]) || "N/A"}</p>
                <p><strong>School Name:</strong> {getDetailValue(selectedStudent.details, ["educationalQualifications", "secondary", "schoolName"]) || "N/A"}</p>
                <p><strong>Period:</strong> {getDetailValue(selectedStudent.details, ["educationalQualifications", "secondary", "period"]) || "N/A"}</p>
                <p><strong>Grade:</strong> {getDetailValue(selectedStudent.details, ["educationalQualifications", "secondary", "grade"]) || "N/A"}</p>

       {/* Tertiary / University (Postgraduate Applicants) */}
{getDetailValue(selectedStudent.details, ["educationalQualifications", "postSecondary"]) && (
  <div className="edu-block" style={{ marginTop: '15px', padding: '10px', borderLeft: '4px solid #007bff', backgroundColor: '#f0f7ff' }}>
    <h3>University / Tertiary (Last Education)</h3>
    <div className="grid-2">
      {/* Changed "tertiary" to "postSecondary" below */}
      <p><strong>Institution:</strong> {getDetailValue(selectedStudent.details, ["educationalQualifications", "postSecondary", "schoolName"]) || "N/A"}</p>
      <p><strong>Course/Level:</strong> {getDetailValue(selectedStudent.details, ["educationalQualifications", "postSecondary", "level"]) || "N/A"}</p>
      <p><strong>Period:</strong> {getDetailValue(selectedStudent.details, ["educationalQualifications", "postSecondary", "period"]) || "N/A"}</p>
      <p><strong>Grade/Class:</strong> {getDetailValue(selectedStudent.details, ["educationalQualifications", "postSecondary", "grade"]) || "N/A"}</p>
    </div>
  </div>
)}


                <h2>Parent / Guardian</h2>
                <p><strong>Name:</strong> {getDetailValue(selectedStudent.details, ["parentGuardian", "parentName"]) || "N/A"}</p>
                <p><strong>Relationship:</strong> {getDetailValue(selectedStudent.details, ["parentGuardian", "relationship"]) || "N/A"}</p>
                <p><strong>ID Number:</strong> {getDetailValue(selectedStudent.details, ["parentGuardian", "idNumber"]) || "N/A"}</p>
                <p><strong>Telephone:</strong> {getDetailValue(selectedStudent.details, ["parentGuardian", "telephone"]) || "N/A"}</p>
                <p><strong>Email:</strong> {getDetailValue(selectedStudent.details, ["parentGuardian", "emailAddress"]) || "N/A"}</p>
                <p><strong>Place of Work:</strong> {getDetailValue(selectedStudent.details, ["parentGuardian", "placeOfWork"]) || "N/A"}</p>

                <h3>📎 Parent/Guardian Documents</h3>
                {getDetailValue(selectedStudent.details, ["parentGuardianDocuments", "idCopy"]) && (
                  <p>
                    <strong>ID Copy:</strong>{" "}
                    <a href={getDetailValue(selectedStudent.details, ["parentGuardianDocuments", "idCopy"])} target="_blank" rel="noopener noreferrer">
                      View Document
                    </a>
                  </p>
                )}
                {getDetailValue(selectedStudent.details, ["parentGuardianDocuments", "kraPinCopy"]) && (
                  <p>
                    <strong>KRA PIN Copy:</strong>{" "}
                    <a href={getDetailValue(selectedStudent.details, ["parentGuardianDocuments", "kraPinCopy"])} target="_blank" rel="noopener noreferrer">
                      View Document
                    </a>
                  </p>
                )}
                {getDetailValue(selectedStudent.details, ["parentGuardianDocuments", "passportPhoto"]) && (
                  <p>
                    <strong>Passport Photo:</strong>{" "}
                    <a href={getDetailValue(selectedStudent.details, ["parentGuardianDocuments", "passportPhoto"])} target="_blank" rel="noopener noreferrer">
                      View Document
                    </a>
                  </p>
                )}

                <h2>Employment Details</h2>
                <p><strong>Name:</strong> {getDetailValue(selectedStudent.details, ["employmentDetails", "name"]) || "N/A"}</p>
                <p><strong>Employer:</strong> {getDetailValue(selectedStudent.details, ["employmentDetails", "employerName"]) || "N/A"}</p>
                <p><strong>Position:</strong> {getDetailValue(selectedStudent.details, ["employmentDetails", "employmentPosition"]) || "N/A"}</p>
                <p><strong>Address:</strong> {getDetailValue(selectedStudent.details, ["employmentDetails", "employerAddress"]) || "N/A"}</p>
                <p><strong>Telephone:</strong> {getDetailValue(selectedStudent.details, ["employmentDetails", "telephoneNumber"]) || "N/A"}</p>
                <p><strong>Contract Type:</strong> {getDetailValue(selectedStudent.details, ["employmentDetails", "typeOfContract"]) || "N/A"}</p>
                <p><strong>Years Worked:</strong> {getDetailValue(selectedStudent.details, ["employmentDetails", "yearsWorked"]) || "N/A"}</p>
                <p><strong>Net Pay:</strong> {getDetailValue(selectedStudent.details, ["employmentDetails", "netPay"]) || "N/A"}</p>

                <h2>Employment Documents</h2>
                {(() => {
                  const docs = getDetailValue(selectedStudent.details, ["employmentDocuments"]);
                  if (!docs) return <p>No employment documents uploaded.</p>;
                  
                  return (
                    <div>
                      {docs.employmentLetter && (
                        <p>
                          <strong>📜 Employment Letter:</strong>{" "}
                          <a href={docs.employmentLetter} target="_blank" rel="noopener noreferrer" download>
                            📥 View/Download
                          </a>
                        </p>
                      )}
                      
                      {docs.bankStatements && docs.bankStatements.length > 0 && (
                        <div>
                          <strong>🏦 Bank Statements:</strong>
                          <ul>
                            {docs.bankStatements.map((url, i) => (
                              <li key={i}>
                                <a href={url} target="_blank" rel="noopener noreferrer" download>
                                  📥 Statement {i + 1}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {docs.paySlips && docs.paySlips.length > 0 && (
                        <div>
                          <strong>💵 Pay Slips:</strong>
                          <ul>
                            {docs.paySlips.map((url, i) => (
                              <li key={i}>
                                <a href={url} target="_blank" rel="noopener noreferrer" download>
                                  📥 Pay Slip {i + 1}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {docs.hrStamp && (
                        <p>
                          <strong>✍️ HR Stamp & Signature:</strong>{" "}
                          <a href={docs.hrStamp} target="_blank" rel="noopener noreferrer" download>
                            📥 View/Download
                          </a>
                        </p>
                      )}
                      
                      {!docs.employmentLetter && !docs.bankStatements?.length && !docs.paySlips?.length && !docs.hrStamp && (
                        <p>No documents uploaded.</p>
                      )}
                    </div>
                  );
                })()}

                <h2>Financial Details</h2>
                <p><strong>Bank Name:</strong> {getDetailValue(selectedStudent.details, ["financialDetails", "bankName"]) || "N/A"}</p>
                <p><strong>Account Number:</strong> {getDetailValue(selectedStudent.details, ["financialDetails", "accountNumber"]) || "N/A"}</p>
                <p><strong>Has Loans:</strong> {getDetailValue(selectedStudent.details, ["financialDetails", "hasLoans"]) || "N/A"}</p>
                <p><strong>Loan Amount:</strong> {getDetailValue(selectedStudent.details, ["financialDetails", "loanAmount"]) || "N/A"}</p>

                <h2>Loan Details</h2>
                <p><strong>University:</strong> {getDetailValue(selectedStudent.details, ["loanDetails", "universityName"]) || "N/A"}</p>
                <p><strong>Study Program:</strong> {getDetailValue(selectedStudent.details, ["loanDetails", "studyProgram"]) || "N/A"}</p>
                <p><strong>Level of Study:</strong> {getDetailValue(selectedStudent.details, ["loanDetails", "levelOfStudy"]) || "N/A"}</p>
                <p><strong>Amount Applied:</strong> {getDetailValue(selectedStudent.details, ["loanDetails", "amountApplied"]) || "N/A"}</p>
                <p><strong>Repayment Period:</strong> {getDetailValue(selectedStudent.details, ["loanDetails", "repaymentPeriod"]) || "N/A"}</p>

                <h2>Referees</h2>
                <h3>1st Referee (Spouse)</h3>
                <p><strong>Name:</strong> {getDetailValue(selectedStudent.details, ["referees", "firstReferee", "name"]) || "N/A"}</p>
                <p><strong>Contacts:</strong> {getDetailValue(selectedStudent.details, ["referees", "firstReferee", "contacts"]) || "N/A"}</p>
                <p><strong>Email:</strong> {getDetailValue(selectedStudent.details, ["referees", "firstReferee", "email"]) || "N/A"}</p>
                <p><strong>Place of Work:</strong> {getDetailValue(selectedStudent.details, ["referees", "firstReferee", "placeOfWork"]) || "N/A"}</p>

                <h3>2nd Referee (Colleague)</h3>
                <p><strong>Name:</strong> {getDetailValue(selectedStudent.details, ["referees", "secondReferee", "name"]) || "N/A"}</p>
                <p><strong>Contacts:</strong> {getDetailValue(selectedStudent.details, ["referees", "secondReferee", "contacts"]) || "N/A"}</p>
                <p><strong>Email:</strong> {getDetailValue(selectedStudent.details, ["referees", "secondReferee", "email"]) || "N/A"}</p>
                <p><strong>Place of Work:</strong> {getDetailValue(selectedStudent.details, ["referees", "secondReferee", "placeOfWork"]) || "N/A"}</p>

                <h3>3rd Referee (Other)</h3>
                <p><strong>Name:</strong> {getDetailValue(selectedStudent.details, ["referees", "thirdReferee", "name"]) || "N/A"}</p>
                <p><strong>Contacts:</strong> {getDetailValue(selectedStudent.details, ["referees", "thirdReferee", "contacts"]) || "N/A"}</p>
                <p><strong>Email:</strong> {getDetailValue(selectedStudent.details, ["referees", "thirdReferee", "email"]) || "N/A"}</p>
                <p><strong>Place of Work:</strong> {getDetailValue(selectedStudent.details, ["referees", "thirdReferee", "placeOfWork"]) || "N/A"}</p>

                {/* ================= BUDGET PLANNER ================= */}
                <div className="section page-break">
                  <h2>2. Budget Planner & Financial Analysis</h2>
                  {(() => {
                    const netSalary = parseInt(getDetailValue(selectedStudent.details, ["budgetDetails", "netSalary"]) || 0);
                    const businessIncome = parseInt(getDetailValue(selectedStudent.details, ["budgetDetails", "businessIncome"]) || 0);
                    const otherIncome = parseInt(getDetailValue(selectedStudent.details, ["budgetDetails", "otherIncome"]) || 0);
                    const householdExpenses = parseInt(getDetailValue(selectedStudent.details, ["budgetDetails", "householdExpenses"]) || 0);
                    const rentalExpenses = parseInt(getDetailValue(selectedStudent.details, ["budgetDetails", "rentalExpenses"]) || 0);
                    const transportExpenses = parseInt(getDetailValue(selectedStudent.details, ["budgetDetails", "transportExpenses"]) || 0);
                    const otherExpenses = parseInt(getDetailValue(selectedStudent.details, ["budgetDetails", "otherExpenses"]) || 0);
                    const totalIncome = netSalary + businessIncome + otherIncome;
                    const totalExpenses = householdExpenses + rentalExpenses + transportExpenses + otherExpenses;
                    const netBalance = totalIncome - totalExpenses;

                    return (
                      <table className="print-table">
                        <thead>
                          <tr>
                            <th>Description</th>
                            <th>Amount (KSh)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan="2"><strong>Income</strong></td>
                          </tr>
                          <tr>
                            <td>Net Salary</td>
                            <td>{netSalary.toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td>Business Income</td>
                            <td>{businessIncome.toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td>Other Income</td>
                            <td>{otherIncome.toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td><strong>Total Income</strong></td>
                            <td><strong>{totalIncome.toLocaleString()}</strong></td>
                          </tr>
                          <tr>
                            <td colSpan="2"><strong>Expenses</strong></td>
                          </tr>
                          <tr>
                            <td>Household Expenses</td>
                            <td>{householdExpenses.toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td>Rental Expenses</td>
                            <td>{rentalExpenses.toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td>Transport Expenses</td>
                            <td>{transportExpenses.toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td>Other Expenses</td>
                            <td>{otherExpenses.toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td><strong>Total Expenses</strong></td>
                            <td><strong>{totalExpenses.toLocaleString()}</strong></td>
                          </tr>
                          <tr>
                            <td><strong>Net Monthly Balance</strong></td>
                            <td style={{ fontWeight: "bold", color: netBalance < 0 ? "red" : "green" }}>
                              {netBalance.toLocaleString()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    );
                  })()}
                </div>

                <h2>Student Requirements Documents</h2>
{(() => {
  const docs = getDetailValue(selectedStudent.details, ["documentsUploaded"]);
  if (!docs) return <p>No documents uploaded.</p>;
  
  const docLabels = {
    cv: "📄 Curriculum Vitae (CV)",
    form4Certificate: "📜 Form 4 Certificate",
    schoolLeavingCertificate: "🏫 School Leaving Certificate",
    admissionLetter: "🎓 University Admission Letter",
    nationalID: "🆔 National ID",
    kraPinDoc: "📋 KRA PIN Document",
    passportPhoto: "📸 Passport Size Photo",
    loanEssay: "✍️ Loan Justification Essay",
    // Postgraduate specific labels
    bachelorsDegree: "🎓 Bachelor's Degree Certificate",
    transcript: "📊 Academic Transcripts"
  };

  const uploadedDocs = Object.entries(docs).filter(([_, url]) => url);
  
  return uploadedDocs.length > 0 ? (
    <div className="doc-grid">
      {uploadedDocs.map(([key, url]) => (
        <p key={key}>
          <strong>{docLabels[key] || `📄 ${key.replace(/([A-Z])/g, ' $1').trim()}`}:</strong>{" "}
          <a href={url} target="_blank" rel="noopener noreferrer" download>
            📥 View/Download
          </a>
        </p>
      ))}
    </div>
  ) : (
    <p>No documents uploaded.</p>
  );
})()}

                
                
                <h2>Community Recommendations</h2>
                {getDetailValue(selectedStudent.details, ["recommendations", "chiefAndImamRecommendation"]) ? (
                  <p>
                    <strong>Chief & Imam Recommendation:</strong>{" "}
                    <a href={getDetailValue(selectedStudent.details, ["recommendations", "chiefAndImamRecommendation"])} target="_blank" rel="noopener noreferrer">
                      📄 View Document
                    </a>
                  </p>
                ) : (
                  <p>No recommendation uploaded.</p>
                )}

                <h2>Guarantors</h2>
                {selectedStudent.details?.guarantors && selectedStudent.details.guarantors.length > 0 ? (
                  selectedStudent.details.guarantors.map((guarantor, index) => (
                    <div key={index} style={{ marginBottom: "30px", borderBottom: "2px solid #ddd", paddingBottom: "20px" }}>
                      <h3>Guarantor {index + 1}</h3>
                      
                      <h4>Personal Details</h4>
                      <p><strong>Full Name:</strong> {guarantor.fullName || "N/A"}</p>
                      <p><strong>ID Number:</strong> {guarantor.idNumber || "N/A"}</p>
                      <p><strong>Phone Number:</strong> {guarantor.phoneNumber || "N/A"}</p>
                      <p><strong>Email:</strong> {guarantor.emailAddress || "N/A"}</p>
                      <p><strong>Marital Status:</strong> {guarantor.maritalStatus || "N/A"}</p>
                      <p><strong>No. of Children:</strong> {guarantor.noOfChildren || "N/A"}</p>
                      <p><strong>Permanent Address:</strong> {guarantor.permanentAddress || "N/A"}</p>
                      <p><strong>Physical Address:</strong> {guarantor.physicalAddress || "N/A"}</p>
                      <p><strong>Place of Work:</strong> {guarantor.placeOfWork || "N/A"}</p>
                      <p><strong>Position Held:</strong> {guarantor.positionHeld || "N/A"}</p>
                      <p><strong>Net Salary:</strong> {guarantor.netSalary || "N/A"}</p>

                      <h4>Loan Details</h4>
                      <p><strong>Applicant's Name:</strong> {guarantor.applicantName || "N/A"}</p>
                      <p><strong>Applicant's ID:</strong> {guarantor.applicantId || "N/A"}</p>
                      <p><strong>Loan Amount Guaranteed:</strong> {guarantor.loanAmount || "N/A"}</p>
                      <p><strong>Relationship with Borrower:</strong> {guarantor.relationship || "N/A"}</p>
                      <p><strong>Other Guarantee:</strong> {guarantor.otherGuarantee || "N/A"}</p>
                      {guarantor.otherGuarantee === "Yes" && (
                        <>
                          <p><strong>Other Guarantee Amount:</strong> {guarantor.otherGuaranteeAmount || "N/A"}</p>
                          <p><strong>Maturity Date:</strong> {guarantor.maturityDate || "N/A"}</p>
                        </>
                      )}
                      <p><strong>Current Loan:</strong> {guarantor.currentLoan || "N/A"}</p>

                      <h4>Referees</h4>
                      <p><strong>Referee 1 Name:</strong> {guarantor.referee1Name || "N/A"}</p>
                      <p><strong>Referee 1 Phone:</strong> {guarantor.referee1Phone || "N/A"}</p>
                      <p><strong>Referee 1 Email:</strong> {guarantor.referee1Email || "N/A"}</p>
                      <p><strong>Referee 2 Name:</strong> {guarantor.referee2Name || "N/A"}</p>
                      <p><strong>Referee 2 Phone:</strong> {guarantor.referee2Phone || "N/A"}</p>
                      <p><strong>Referee 2 Email:</strong> {guarantor.referee2Email || "N/A"}</p>

                      <h4>📎 Uploaded Documents</h4>
                      {guarantor.consentFileUrl && (
                        <p>
                          <strong>Consent Form:</strong>{" "}
                          <a href={guarantor.consentFileUrl} target="_blank" rel="noopener noreferrer" download>
                            📄 View/Download
                          </a>
                        </p>
                      )}
                      {guarantor.idFileUrl && (
                        <p>
                          <strong>ID Copy:</strong>{" "}
                          <a href={guarantor.idFileUrl} target="_blank" rel="noopener noreferrer" download>
                            🆔 View/Download
                          </a>
                        </p>
                      )}
                      {guarantor.photoFileUrl && (
                        <p>
                          <strong>Passport Photo:</strong>{" "}
                          <a href={guarantor.photoFileUrl} target="_blank" rel="noopener noreferrer" download>
                            📸 View/Download
                          </a>
                        </p>
                      )}
                      {!guarantor.consentFileUrl && !guarantor.idFileUrl && !guarantor.photoFileUrl && (
                        <p>No documents uploaded.</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p>No guarantors added.</p>
                )}

                <h2>Siblings / Children Still Studying</h2>
{selectedStudent.details?.siblings && selectedStudent.details.siblings.length > 0 ? (
  <table className="print-table" style={{ width: '100%', marginBottom: '20px' }}>
    <thead>
      <tr style={{ textAlign: 'left', backgroundColor: '#f9f9f9' }}>
        <th>Name</th>
        <th>Institution</th>
        <th>Level</th>
        <th>Yearly Fees (KSh)</th>
      </tr>
    </thead>
    <tbody>
      {selectedStudent.details.siblings.map((sib, i) => (
        <tr key={i}>
          <td>{sib.name || "N/A"}</td>
          <td>{sib.institution || "N/A"}</td>
          <td>{sib.level || "N/A"}</td>
          <td>{sib.yearlyFees ? parseInt(sib.yearlyFees).toLocaleString() : "0"}</td>
        </tr>
      ))}
      <tr style={{ fontWeight: 'bold', borderTop: '2px solid #eee' }}>
        <td colSpan="3" style={{ textAlign: 'right' }}>Total Sibling Fee Burden:</td>
        <td>
          {selectedStudent.details.siblings
            .reduce((sum, s) => sum + (parseInt(s.yearlyFees) || 0), 0)
            .toLocaleString()}
        </td>
      </tr>
    </tbody>
  </table>
) : (
  <p>No sibling details provided.</p>
)}

                <h2>Consent Form</h2>
                {getDetailValue(selectedStudent.details, ["consentForm"]) ? (
                  <div>
                    <p style={{ fontStyle: 'italic', marginBottom: '20px' }}>
                      <strong>Consent Declaration:</strong><br />
                      "I (We) consent to the collection, processing, transmission and storage by the Trust in any form whatsoever, of any data of a professional or personal nature that have been provided by the applicant as stipulated in page one of the requirements which is necessary for the purposes of the loan application."
                    </p>
                    <h3>Student Consent</h3>
                    <p><strong>Name:</strong> {getDetailValue(selectedStudent.details, ["consentForm", "studentName"]) || "N/A"}</p>
                    <p><strong>Date:</strong> {getDetailValue(selectedStudent.details, ["consentForm", "studentDate"]) || "N/A"}</p>
                    {getDetailValue(selectedStudent.details, ["consentForm", "studentSignature"]) && (
                      <div>
                        <p><strong>Signature:</strong></p>
                        <img 
                          src={getDetailValue(selectedStudent.details, ["consentForm", "studentSignature"])} 
                          alt="Student Signature" 
                          style={{ border: "1px solid #ccc", maxWidth: "400px", display: "block", marginTop: "10px", marginBottom: "10px" }}
                        />
                        <a href={getDetailValue(selectedStudent.details, ["consentForm", "studentSignature"])} download="student_signature.png" style={{ color: "#007bff", textDecoration: "none" }}>
                          📥 Download Student Signature
                        </a>
                      </div>
                    )}

                    <h3>Guardian Consent</h3>
                    <p><strong>Name:</strong> {getDetailValue(selectedStudent.details, ["consentForm", "guardianName"]) || "N/A"}</p>
                    <p><strong>Date:</strong> {getDetailValue(selectedStudent.details, ["consentForm", "guardianDate"]) || "N/A"}</p>
                    {getDetailValue(selectedStudent.details, ["consentForm", "guardianSignature"]) && (
                      <div>
                        <p><strong>Signature:</strong></p>
                        <img 
                          src={getDetailValue(selectedStudent.details, ["consentForm", "guardianSignature"])} 
                          alt="Guardian Signature" 
                          style={{ border: "1px solid #ccc", maxWidth: "400px", display: "block", marginTop: "10px", marginBottom: "10px" }}
                        />
                        <a href={getDetailValue(selectedStudent.details, ["consentForm", "guardianSignature"])} download="guardian_signature.png" style={{ color: "#007bff", textDecoration: "none" }}>
                          📥 Download Guardian Signature
                        </a>
                      </div>
                    )}

                    <p><strong>Submitted At:</strong> {
                      getDetailValue(selectedStudent.details, ["consentForm", "submittedAt"]) 
                        ? new Date(getDetailValue(selectedStudent.details, ["consentForm", "submittedAt"])).toLocaleString() 
                        : "N/A"
                    }</p>
                  </div>
                ) : (
                  <p>Consent form not submitted.</p>
                )}
              </div>

              <div className="modal-actions">
                <button onClick={handlePrint}>
                  📄 Download / Print PDF
                </button>
                <button className="approve-btn" onClick={() => updateStatus(selectedStudent.id, "approved")}>
                  Approve
                </button>
                <button className="reject-btn" onClick={() => updateStatus(selectedStudent.id, "rejected")}>
                  Reject
                </button>
                <button onClick={() => setSelectedStudent(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}