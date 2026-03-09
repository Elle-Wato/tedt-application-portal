import { useState } from "react";
import ProgramSelect from "../../components/ProgramSelect";
import DocumentUpload from "../../components/DocumentUpload";
import { useNavigate } from "react-router-dom";

export default function ApplicationForm() {
  const navigate = useNavigate();
  const [program, setProgram] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    idNumber: "",
    phone: "",
    email: "",
    university: "",
    amount: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ program, formData });
    // TODO: Add logic to save form data to backend or database
    navigate("/success");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Loan Application Form</h2>

      <ProgramSelect
        value={program}
        onChange={(e) => setProgram(e.target.value)}
      />

      <input
        placeholder="Full Name"
        value={formData.fullName}
        onChange={(e) =>
          setFormData({ ...formData, fullName: e.target.value })
        }
        required
      />

      <input
        placeholder="ID Number"
        value={formData.idNumber}
        onChange={(e) =>
          setFormData({ ...formData, idNumber: e.target.value })
        }
        required
      />

      <input
        placeholder="Phone Number"
        value={formData.phone}
        onChange={(e) =>
          setFormData({ ...formData, phone: e.target.value })
        }
        required
      />

      <input
        placeholder="Email Address"
        type="email"
        value={formData.email}
        onChange={(e) =>
          setFormData({ ...formData, email: e.target.value })
        }
        required
      />

      <input
        placeholder="University / College"
        value={formData.university}
        onChange={(e) =>
          setFormData({ ...formData, university: e.target.value })
        }
        required
      />

      <input
        placeholder="Amount Applied (Ksh)"
        type="number"
        value={formData.amount}
        onChange={(e) =>
          setFormData({ ...formData, amount: e.target.value })
        }
        required
      />

      <DocumentUpload />

      <button type="submit">Submit Application</button>
    </form>
  );
}