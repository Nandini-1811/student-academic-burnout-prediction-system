import { useEffect, useRef, useState } from "react";
import { compareModels, getStudentFeatures } from "../api";

const RISK_COLORS = { Low: "#02C39A", Medium: "#F4A261", High: "#E76F51" };
const CLASSES = ["Low", "Medium", "High"];

const FIELDS = [
  { key: "mbi_exhaustion", label: "Emotional exhaustion", group: "Survey", min: 0, max: 54, step: 1 },
  { key: "mbi_cynicism", label: "Cynicism", group: "Survey", min: 0, max: 45, step: 1 },
  { key: "mbi_efficacy", label: "Academic efficacy", group: "Survey", min: 0, max: 48, step: 1 },
  { key: "dass_depression", label: "Depression", group: "Survey", min: 0, max: 42, step: 1 },
  { key: "dass_anxiety", label: "Anxiety", group: "Survey", min: 0, max: 42, step: 1 },
  { key: "dass_stress", label: "Stress", group: "Survey", min: 0, max: 42, step: 1 },
  { key: "cope_score", label: "Coping score", group: "Survey", min: 10, max: 60, step: 1 },
  { key: "attendance_rate", label: "Attendance (%)", group: "Behaviour", min: 30, max: 100, step: 1 },
  { key: "grade_decline_slope", label: "Grade trend (negative = slipping)", group: "Behaviour", min: -4, max: 2, step: 0.1 },
  { key: "assignment_completion_rate", label: "Assignment completion (%)", group: "Behaviour", min: 20, max: 100, step: 1 },
  { key: "late_submission_count", label: "Late submissions", group: "Behaviour", min: 0, max: 20, step: 1 },
  { key: "lms_login_frequency", label: "LMS logins per week", group: "Behaviour", min: 0, max: 30, step: 1 },
  { key: "time_on_task_weekly", label: "Hours on task per week", group: "Behaviour", min: 0, max: 30, step: 0.5 },
  { key: "engagement_variability", label: "Routine variability", group: "Behaviour", min: 0, max: 15, step: 0.5 },
];

// Typical profiles taken from the simulation's own averages for each risk level.
const PRESETS = {
  "Typical Low": {
    mbi_exhaustion: 24, mbi_cynicism: 17, mbi_efficacy: 33, dass_depression: 9, dass_anxiety: 9,
    dass_stress: 10, cope_score: 38, attendance_rate: 88, grade_decline_slope: 0, assignment_completion_rate: 93,
    late_submission_count: 1, lms_login_frequency: 20, time_on_task_weekly: 15, engagement_variability: 2,
  },
  "Typical Medium": {
    mbi_exhaustion: 33, mbi_cynicism: 25, mbi_efficacy: 27, dass_depression: 16, dass_anxiety: 15,
    dass_stress: 18, cope_score: 35, attendance_rate: 75, grade_decline_slope: -0.4, assignment_completion_rate: 82,
    late_submission_count: 3, lms_login_frequency: 17, time_on_task_weekly: 13, engagement_variability: 3,
  },
  "Typical High": {
    mbi_exhaustion: 42, mbi_cynicism: 32, mbi_efficacy: 22, dass_depression: 22, dass_anxiety: 20,
    dass_stress: 25, cope_score: 31, attendance_rate: 57, grade_decline_slope: -1.4, assignment_completion_rate: 66,
    late_submission_count: 8, lms_login_frequency: 12, time_on_task_weekly: 9.5, engagement_variability: 5,
  },
};

function ModelComparisonSidebar({ students }) {
  const [values, setValues] = useState(PRESETS["Typical Medium"]);
  const [source, setSource] = useState("custom");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  // Live comparison: re-runs 250 ms after the last change.
  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const data = await compareModels(values);
        if (id === reqId.current) { setResult(data); setError(null); }
      } catch (e) {
        if (id === reqId.current) setError(e.message);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [values]);

  const setValue = (key, v) => {
    setSource("custom");
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  const loadStudent = async (id) => {
    if (!id) { setSource("custom"); return; }
    try {
      const f = await getStudentFeatures(id);
      if (f) { setValues(f); setSource(id); }
    } catch (e) {
      setError(e.message);
    }
  };

  const fmt = (v) => (Number.isInteger(v) ? v : Number(v).toFixed(1));

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <h2 style={{ marginTop: 0, fontSize: "1.15rem" }}>Model comparison</h2>
      <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: "-0.4rem" }}>
        Change the inputs and all four models answer live on the same data. For understanding only,
        nothing here is saved.
      </p>

      <label style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Start from a student</label>
      <select
        value={source}
        onChange={(e) => loadStudent(e.target.value)}
        style={{ width: "100%", padding: "0.45rem", margin: "0.2rem 0 0.7rem" }}
      >
        <option value="custom">Custom input</option>
        {(students || []).map((s) => (
          <option key={s.student_id} value={s.student_id}>
            {s.student_id} (latest check-in)
          </option>
        ))}
      </select>

      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
        {Object.keys(PRESETS).map((name) => (
          <button
            key={name}
            onClick={() => { setValues(PRESETS[name]); setSource("custom"); }}
            style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", borderRadius: 6, border: "1px solid #cfdcdc", background: "white", cursor: "pointer" }}
          >
            {name}
          </button>
        ))}
      </div>

      {error && <p style={{ color: "var(--high)", fontSize: "0.82rem" }}>Could not reach the backend: {error}</p>}

      <div className="cmp-cols">
      {result && (
        <div className="cmp-results">
          <div style={{ background: "#f4f9f8", borderRadius: 8, padding: "0.6rem 0.8rem", fontSize: "0.88rem", marginBottom: "0.8rem" }}>
            <strong>{result.agreement.count} of {result.agreement.total} models</strong> predict{" "}
            <strong style={{ color: RISK_COLORS[result.agreement.majority] }}>{result.agreement.majority}</strong>
            {loading && <span style={{ color: "var(--muted)" }}> (updating...)</span>}
          </div>

          {result.models.map((m) => (
            <div
              key={m.key}
              style={{
                border: m.deployed ? "2px solid var(--teal-deep)" : "1px solid #e1ecec",
                borderRadius: 10, padding: "0.7rem 0.8rem", marginBottom: "0.7rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{m.name}</strong>
                <span style={{ color: RISK_COLORS[m.risk_level], fontWeight: 700 }}>{m.risk_level}</span>
              </div>
              {m.deployed && (
                <div style={{ fontSize: "0.68rem", color: "var(--teal-deep)", fontWeight: 700, letterSpacing: "0.04em" }}>
                  USED IN THE APP
                </div>
              )}
              <div style={{ fontSize: "0.76rem", color: "var(--muted)", margin: "0.2rem 0 0.5rem" }}>
                {m.note}
                {m.score != null && ` Raw score: ${m.score} (0 Low, 1 Medium, 2 High).`}
              </div>
              {CLASSES.map((c) => {
                const pct = Math.round((m.probabilities[c] || 0) * 100);
                return (
                  <div key={c} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.76rem", marginBottom: "0.2rem" }}>
                    <span style={{ width: 56 }}>{c}</span>
                    <div style={{ flex: 1, background: "#eef3f3", borderRadius: 4, height: 8, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: RISK_COLORS[c] }} />
                    </div>
                    <span style={{ width: 36, textAlign: "right" }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <div className="cmp-inputs">
      {["Survey", "Behaviour"].map((group) => (
        <div key={group} style={{ marginTop: "0.9rem" }}>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.4rem" }}>{group} inputs</div>
          {FIELDS.filter((f) => f.group === group).map((f) => (
            <div key={f.key} style={{ marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                <span>{f.label}</span>
                <span style={{ fontWeight: 600 }}>{fmt(values[f.key])}</span>
              </div>
              <input
                type="range"
                min={f.min} max={f.max} step={f.step}
                value={values[f.key]}
                onChange={(e) => setValue(f.key, Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>
          ))}
        </div>
            ))}
      </div>
      </div>

      <p style={{ color: "var(--muted)", fontSize: "0.74rem", marginBottom: 0 }}>
        All four models were trained on the same simulated students. The agreement between them matters
        more than any single number.
      </p>
    </div>
  );
}

export default ModelComparisonSidebar;