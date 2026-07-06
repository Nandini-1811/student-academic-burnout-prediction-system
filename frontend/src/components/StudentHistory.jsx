import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RiskGauge from "./RiskGauge";
import ExplanationPanel from "./ExplanationPanel";
import SuggestionsPanel from "./SuggestionsPanel";
import TrendChart from "./TrendChart";
import { getStudentName } from "../utils/studentName";

const RISK_COLORS = {
  Low: "#02C39A",
  Medium: "#F4A261",
  High: "#E76F51",
};

function StudentHistory() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [latest, setLatest] = useState(null);
  const [trends, setTrends] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [latestRes, trendsRes, historyRes] = await Promise.all([
          fetch(`http://127.0.0.1:8000/student/${studentId}/latest`),
          fetch(`http://127.0.0.1:8000/trends/${studentId}`),
          fetch(`http://127.0.0.1:8000/student/${studentId}/history`),
        ]);
        if (!latestRes.ok || !trendsRes.ok || !historyRes.ok) {
          throw new Error("Failed to fetch history data.");
        }
        setLatest(await latestRes.json());
        setTrends(await trendsRes.json());
        setHistory(await historyRes.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [studentId]);

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>{getStudentName(studentId)}'s Check-in History</h1>
        <p>Detailed view of your latest session, plus a summary of past check-ins</p>
      </div>

      <button
        className="primary-btn"
        onClick={() => navigate(`/dashboard/${studentId}`)}
        style={{ marginBottom: "1rem", background: "var(--dark2)" }}
      >
        ← Back to Dashboard
      </button>

      {loading && <div className="card">Loading history...</div>}
      {error && (
        <div className="card" style={{ color: "var(--high)" }}>
          Error: {error}
        </div>
      )}

      {!loading && !error && !latest && (
        <div className="card">
          <p style={{ color: "var(--muted)" }}>No check-ins yet.</p>
        </div>
      )}

      {!loading && !error && latest && (
        <>
          <RiskGauge riskLevel={latest.risk_level} probabilities={latest.probabilities} />
          <ExplanationPanel topFactors={latest.top_factors} riskLevel={latest.risk_level} />
          <SuggestionsPanel topFactors={latest.top_factors} riskLevel={latest.risk_level} />
          <TrendChart trends={trends} />

          <div className="card">
            <h2 style={{ marginTop: 0 }}>Previous Sessions</h2>
            {history.length <= 1 ? (
              <p style={{ color: "var(--muted)" }}>
                This is your only check-in so far — come back after your next one to see a summary here.
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "2px solid #eee" }}>
                    <th style={{ padding: "0.6rem" }}>Date</th>
                    <th style={{ padding: "0.6rem" }}>Risk Level</th>
                    <th style={{ padding: "0.6rem" }}>High-risk Probability</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "0.6rem" }}>{new Date(h.timestamp).toLocaleString()}</td>
                      <td style={{ padding: "0.6rem", color: RISK_COLORS[h.risk_level], fontWeight: 700 }}>
                        {h.risk_level}
                      </td>
                      <td style={{ padding: "0.6rem" }}>{Math.round(h.prob_high * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default StudentHistory;