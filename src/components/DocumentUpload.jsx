export default function DocumentUpload() {
  const docs = [
    "CV",
    "Form 4 Certificate",
    "School Leaving Certificate",
    "Admission Letter",
    "National ID",
    "KRA PIN",
    "Passport Photo",
    "Loan Justification Essay"
  ];

  return (
    <div>
      <h3>Required Documents</h3>
      {docs.map((doc) => (
        <div key={doc}>
          <label>{doc}</label>
          <input type="file" />
        </div>
      ))}
    </div>
  );
}
