import { useEffect, useState } from "react";
import { getAllStudents } from "../api";

const RISK_COLORS = {
  Low: "#02C39A",
  Medium: "#F4A261",
  High: "#E76F51",
};

function MentorDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllStudents();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const highCount = students.filter((s) => s.risk_level === "High").length;
  const medCount = students.filter((s) => s.risk_level === "Medium").length;
  const lowCount = students.filter((s) => s.risk_level === "Low").length;

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>Mentor Dashboard</h1>
        <p>All students, ranked by current burnout risk</p>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="card" style={{ flex: 1, textAlign: "center", borderTop: `4px solid ${RISK_COLORS.High}` }}>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: RISK_COLORS.High }}>{highCount}</div>
          <div style={{ color: "var(--muted)" }}>High Risk</div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: "center", borderTop: `4px solid ${RISK_COLORS.Medium}` }}>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: RISK_COLORS.Medium }}>{medCount}</div>
          <div style={{ color: "var(--muted)" }}>Medium Risk</div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: "center", borderTop: `4px solid ${RISK_COLORS.Low}` }}>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: RISK_COLORS.Low }}>{lowCount}</div>
          <div style={{ color: "var(--muted)" }}>Low Risk</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ marginTop: 0 }}>Student Roster</h2>
          <button className="primary-btn" onClick={fetchStudents} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && <p style={{ color: "var(--high)" }}>Error: {error}</p>}

        {students.length === 0 && !loading && (
          <p style={{ color: "var(--muted)" }}>
            No students yet — submit a survey from the student dashboard first.
          </p>
        )}

        {students.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #eee" }}>
                <th style={{ padding: "0.6rem" }}>Student ID</th>
                <th style={{ padding: "0.6rem" }}>Risk Level</th>
                <th style={{ padding: "0.6rem" }}>Confidence</th>
                <th style={{ padding: "0.6rem" }}>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr
                  key={s.student_id}
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    background: s.risk_level === "High" ? "#FDEEE9" : "transparent",
                  }}
                >
                  <td style={{ padding: "0.6rem", fontWeight: 600 }}>{s.student_id}</td>
                  <td style={{ padding: "0.6rem" }}>
                    <span
                      style={{
                        color: RISK_COLORS[s.risk_level],
                        fontWeight: 700,
                      }}
                    >
                      {s.risk_level}
                    </span>
                  </td>
                  <td style={{ padding: "0.6rem" }}>{Math.round(s.prob_high * 100)}% High-risk prob.</td>
                  <td style={{ padding: "0.6rem", color: "var(--muted)" }}>
                    {new Date(s.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default MentorDashboard;