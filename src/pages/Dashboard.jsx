import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="dash-bg">
      <div className="dash-card">
        <img src={logo} alt="Company Logo" className="login-logo" />
        <h2 className="dash-title">
          🎓 Welcome to Study Loan Portal
        </h2>
        <p className="dash-text">
          Ready to apply for your student loan? Review the required documents below and download any necessary forms. Click "Apply for Loan" to get started!
        </p>

        <div className="dash-requirements">
          <h3>📋 Required Documents and Forms</h3>
          
          <div className="req-section">
            <h4>A. Students</h4>
            <ol>
              <li>Curriculum Vitae (CV)</li>
              <li>Copy of your Form 4 certificate/ other relevant certificates</li>
              <li>School leaving certificate</li>
              <li>University Admission letter for your Bachelors program and Fee structure.</li>
              <li>Copy of ID</li>
              <li>Copy of KRA pin</li>
              <li>Colored passport size photo</li>
              <li>Write 300 words about yourself and justification for the soft loan (Hand written)</li>
            </ol>
          </div>

          <div className="req-section">
            <h4>B. Parent/Guardian</h4>
            <ol>
              <li>Copy of ID, Copy of KRA pin & One colored passport size photo</li>
            </ol>
            <p><strong>In addition to the above, the person paying the loan must provide:</strong></p>
            <ol>
              <li>Employment letter (if employed) or Business Registration Documents (if self-employed)</li>
              <li>Bank statement for the last 6 months</li>
              <li>Three recent Pay Slips</li>
              <li>Loan Security: 2 Guarantors for Undergraduate, UUSSP & Diploma. 1 Guarantor for Postgraduate .</li>
            </ol>
          </div>

          <div className="req-section">
            <h4>📥 Downloadable Forms</h4>
            <ul>
              <li>
                <a href="/HR Stamp Form.pdf" download className="dash-link">
                  ⬇️ Download HR Stamp Form (for Employed)
                </a>
              </li>
              <li>
                <a href="/Chief and Imam Stamp form.pdf" download className="dash-link">
                  ⬇️ Download Chief & Imam Recommendation Form (for Undergraduate, UUSSP, and Diploma)
                </a>
              </li>
              
              <li>
                <a href="/Guarantor Application Form Consent.pdf" download className="dash-link">
                  ⬇️ Download Guarantor Application Form Consent
                </a>
              </li>
            </ul>
            <p className="dash-note">
              <strong>Note:</strong> Download, print, fill, stamp, sign, and scan these forms for upload during the application process.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/apply")}
          className="dash-button"
        >
          📝 Apply for Loan
        </button>
      </div>
    </div>
  );
}