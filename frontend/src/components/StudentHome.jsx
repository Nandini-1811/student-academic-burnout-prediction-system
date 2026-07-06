import { useState } from "react";
import { useNavigate } from "react-router-dom";

function StudentHome() {
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleContinue = () => {
    const id = studentId.trim();
    if (!id) return;
    if (name.trim()) {
      localStorage.setItem(`studentName_${id}`, name.trim());
    }
    navigate(`/dashboard/${id}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleContinue();
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>Academic Burnout Prediction System</h1>
        <p>Enter your details to see your dashboard</p>
      </div>

      <div className="card" style={{ maxWidth: "420px", margin: "0 auto" }}>
        <h2 style={{ marginTop: 0 }}>Welcome 👋</h2>
        <p style={{ color: "var(--muted)" }}>
          Your Student ID tags your check-ins so we can track them over time.
        </p>
        <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Nandini"
          style={{
            width: "100%",
            padding: "0.6rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
            marginBottom: "1rem",
          }}
        />
        <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
          Student ID
        </label>
        <input
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. S9010"
          style={{
            width: "100%",
            padding: "0.6rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
            marginBottom: "1rem",
          }}
        />
        <button className="primary-btn" onClick={handleContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}

export default StudentHome;