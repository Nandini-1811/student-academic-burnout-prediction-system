import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import SurveyForm from "./components/SurveyForm";
import RiskGauge from "./components/RiskGauge";
import ExplanationPanel from "./components/ExplanationPanel";
import TrendChart from "./components/TrendChart";
import MentorDashboard from "./components/MentorDashboard";
import { submitPrediction, getTrends } from "./api";

function StudentView() {
  const [result, setResult] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await submitPrediction(payload);
      setResult(data);
      const trendData = await getTrends(payload.student_id);
      setTrends(trendData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>Academic Burnout Prediction System</h1>
        <p>Enter survey and behavioral data to get a risk assessment</p>
      </div>

      <SurveyForm onSubmit={handleSubmit} loading={loading} />

      {error && (
        <div className="card" style={{ color: "var(--high)" }}>
          Error: {error}. Is the backend running at http://127.0.0.1:8000?
        </div>
      )}

      {result && <RiskGauge riskLevel={result.risk_level} probabilities={result.probabilities} />}
      {result && <ExplanationPanel topFactors={result.top_factors} />}
      {result && <TrendChart trends={trends} />}
    </div>
  );
}

function NavBar() {
  return (
    <div
      style={{
        background: "var(--dark)",
        padding: "1rem 1.5rem",
        display: "flex",
        gap: "1.5rem",
      }}
    >
      <Link to="/" style={{ color: "white", textDecoration: "none", fontWeight: 600 }}>
        Student View
      </Link>
      <Link to="/mentor" style={{ color: "var(--mint)", textDecoration: "none", fontWeight: 600 }}>
        Mentor Dashboard
      </Link>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<StudentView />} />
        <Route path="/mentor" element={<MentorDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;