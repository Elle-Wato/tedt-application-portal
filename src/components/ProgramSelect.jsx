export default function ProgramSelect({ value, onChange }) {
  return (
    <select value={value} onChange={onChange} required className="prog-select">
      <option value="">🎓 Select Program</option>
      <option value="postgraduate">📚 Postgraduate</option>
      <option value="undergraduate">🎓 Undergraduate</option>
      <option value="umma">🏫 Umma University Support Program</option>
      <option value="diploma">📜 Diploma Program</option>
    </select>
  );
}