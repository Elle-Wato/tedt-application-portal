import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios"; 
import logo from "../assets/logo.png";

const API_BASE_URL = "https://api.elimishatrust.or.ke/"; 

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: formData.email,
        password: formData.password,
        role: "student"
      });

      // Show the actual message from your Flask backend 
      // ("Registration successful! Check your email...")
      setSuccess(response.data.message);
      
      // We give them 5 seconds to read the "Check your email" instruction
      setTimeout(() => navigate("/"), 5000); 
    } catch (err) {
      // Logic: Look for 'error' first, then 'message', then fallback to default
      const backendError = err.response?.data?.error || err.response?.data?.message;
      setError(backendError || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-bg">
      <div className="reg-card">
        <img src={logo} alt="Company Logo" className="reg-logo" /> 
        <h2 className="reg-title">📝 Create Student Account</h2>

        {error && <p className="error-message" style={{ color: "red", backgroundColor: "#ffe6e6", padding: "10px", borderRadius: "5px" }}>{error}</p>}
        {success && <p className="success-message" style={{ color: "green", backgroundColor: "#e6ffed", padding: "10px", borderRadius: "5px" }}>{success}</p>}

        <form onSubmit={handleSubmit} className="reg-form">
          {/* ... inputs remain the same ... */}
          <div>
            <label className="reg-label">👤 Full Name</label>
            <input name="fullName" placeholder="Enter your full name" value={formData.fullName} onChange={handleChange} required className="reg-input" />
          </div>
          <div>
            <label className="reg-label">📧 Email Address</label>
            <input name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required className="reg-input" />
          </div>
          <div>
            <label className="reg-label">🔒 Password</label>
            <input name="password" type="password" placeholder="********" value={formData.password} onChange={handleChange} required className="reg-input" />
          </div>
          <div>
            <label className="reg-label">🔒 Confirm Password</label>
            <input name="confirmPassword" type="password" placeholder="********" value={formData.confirmPassword} onChange={handleChange} required className="reg-input" />
          </div>

          <button type="submit" className="reg-button" disabled={loading}>
            {loading ? "📝 Creating Account..." : "📝 Create Account"}
          </button>
        </form>

        <p className="reg-footer">
          Already have an account? <span className="reg-link" onClick={() => navigate("/")}>🔐 Login</span>
        </p>
      </div>
    </div>
  );
}