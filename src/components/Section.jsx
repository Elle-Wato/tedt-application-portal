export default function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <h3 style={styles.title}>{title}</h3>
      <div>{children}</div>
    </div>
  );
}

const styles = {
  section: {
    border: "1px solid #ccc",
    padding: "16px",
    marginBottom: "20px",
    borderRadius: "6px",
    backgroundColor: "#fafafa"
  },
  title: {
    marginBottom: "12px",
    color: "#333"
  }
};
