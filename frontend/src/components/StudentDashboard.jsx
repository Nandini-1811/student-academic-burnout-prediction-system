import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStudentName } from "../utils/studentName";

const RISK_COLORS = {
  Low: "#02C39A",
  Medium: "#F4A261",
  High: "#E76F51",
};

// Hardcoded for now — replaced once real student-mentor association exists
const MOCK_MENTOR = {
  name: "John Doe",
  department: "Computer Science",
  room: "Room 001, CS Block",
  mobile: "+91-9xxxxxxxx",
};

function StudentDashboard() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatest = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://127.0.0.1:8000/student/${studentId}/latest`);
        if (!res.ok) throw new Error("Failed to fetch dashboard data.");
        const data = await res.json();
        setLatest(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, [studentId]);

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>Hi, {getStudentName(studentId)} 👋</h1>
        <p>Here's your latest check-in summary</p>
      </div>

      {loading && <div className="card">Loading your dashboard...</div>}
      {error && (
        <div className="card" style={{ color: "var(--high)" }}>
          Error: {error}. Is the backend running at http://127.0.0.1:8000?
        </div>
      )}

      {!loading && !error && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Your Last Check-in</h2>
          {!latest ? (
            <p style={{ color: "var(--muted)" }}>
              You haven't checked in yet — start your first check-in below.
            </p>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
              <div
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  color: RISK_COLORS[latest.risk_level],
                  border: `2px solid ${RISK_COLORS[latest.risk_level]}`,
                  borderRadius: "10px",
                  padding: "0.5rem 1rem",
                }}
              >
                {latest.risk_level}
              </div>
              <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                Last checked in on {new Date(latest.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Your Mentor</h2>
        <p style={{ fontWeight: 700, marginBottom: "0.3rem" }}>{MOCK_MENTOR.name}</p>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "0.2rem 0" }}>
          {MOCK_MENTOR.department}
        </p>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "0.2rem 0" }}>
          {MOCK_MENTOR.room}
        </p>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "0.2rem 0" }}>
          {MOCK_MENTOR.mobile}
        </p>
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <button
          className="primary-btn"
          onClick={() => navigate(`/checkin/${studentId}`)}
          style={{ flex: 1 }}
        >
          Start New Check-in
        </button>
        <button
          className="primary-btn"
          onClick={() => navigate(`/history/${studentId}`)}
          style={{ flex: 1, background: "var(--dark2)" }}
          disabled={!latest}
        >
          View Full History
        </button>
      </div>
    </div>
  );
}

export default StudentDashboard;