import { useState } from "react";

const initialState = {
  student_id: "",
  mbi_exhaustion: "",
  mbi_cynicism: "",
  mbi_efficacy: "",
  dass_depression: "",
  dass_anxiety: "",
  dass_stress: "",
  cope_score: "",
  attendance_rate: "",
  grade_decline_slope: "",
  assignment_completion_rate: "",
  late_submission_count: "",
  lms_login_frequency: "",
  time_on_task_weekly: "",
  engagement_variability: "",
};

const surveyFields = [
  { key: "mbi_exhaustion", label: "MBI Exhaustion (0-54)" },
  { key: "mbi_cynicism", label: "MBI Cynicism (0-45)" },
  { key: "mbi_efficacy", label: "MBI Efficacy (0-48)" },
  { key: "dass_depression", label: "DASS Depression (0-42)" },
  { key: "dass_anxiety", label: "DASS Anxiety (0-42)" },
  { key: "dass_stress", label: "DASS Stress (0-42)" },
  { key: "cope_score", label: "COPE Score (10-60)" },
];

const behavioralFields = [
  { key: "attendance_rate", label: "Attendance Rate (%)" },
  { key: "grade_decline_slope", label: "Grade Decline Slope (e.g. -2.5)" },
  { key: "assignment_completion_rate", label: "Assignment Completion (%)" },
  { key: "late_submission_count", label: "Late Submissions (count)" },
  { key: "lms_login_frequency", label: "LMS Logins per week" },
  { key: "time_on_task_weekly", label: "Hours on Task per week" },
  { key: "engagement_variability", label: "Engagement Variability" },
];

function SurveyForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState(initialState);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { student_id: formData.student_id };
    for (const key in formData) {
      if (key !== "student_id") {
        payload[key] = parseFloat(formData[key]) || 0;
      }
    }
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2 style={{ marginTop: 0 }}>Burnout Risk Survey</h2>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: "0.3rem" }}>
          Student ID
        </label>
        <input
          type="text"
          name="student_id"
          value={formData.student_id}
          onChange={handleChange}
          required
          placeholder="e.g. S9002"
          style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }}
        />
      </div>

      <h3 style={{ color: "var(--teal-deep)", fontSize: "1rem" }}>Psychometric Survey Scores</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {surveyFields.map((f) => (
          <div key={f.key}>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
              {f.label}
            </label>
            <input
              type="number"
              step="0.1"
              name={f.key}
              value={formData[f.key]}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }}
            />
          </div>
        ))}
      </div>

      <h3 style={{ color: "var(--seafoam)", fontSize: "1rem", marginTop: "1.5rem" }}>
        Behavioral and Academic Data
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {behavioralFields.map((f) => (
          <div key={f.key}>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
              {f.label}
            </label>
            <input
              type="number"
              step="0.1"
              name={f.key}
              value={formData[f.key]}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }}
            />
          </div>
        ))}
      </div>

      <button type="submit" className="primary-btn" style={{ marginTop: "1.5rem" }} disabled={loading}>
        {loading ? "Analyzing..." : "Submit and Get Risk Prediction"}
      </button>
    </form>
  );
}

export default SurveyForm;