const FRIENDLY_LABELS = {
  mbi_exhaustion: "Feeling Emotionally Drained",
  mbi_cynicism: "Losing Interest in Studies",
  mbi_efficacy: "Confidence in Your Work",
  dass_depression: "Low Mood",
  dass_anxiety: "Anxiety",
  dass_stress: "Stress Levels",
  cope_score: "Coping Ability",
  attendance_rate: "Attendance Rate",
  grade_decline_slope: "Grade Trend",
  assignment_completion_rate: "Assignment Completion",
  late_submission_count: "Late Submissions",
  lms_login_frequency: "Portal Login Frequency",
  time_on_task_weekly: "Study Hours per Week",
  engagement_variability: "Routine Consistency",
};

const FEATURE_DESCRIPTIONS = {
  mbi_exhaustion: {
    increases: "You've been feeling drained fairly often — this is pushing your risk up.",
    decreases: "You're not feeling too worn out lately, which is working in your favor.",
  },
  mbi_cynicism: {
    increases: "You've been losing interest in your studies — a real contributor to your risk.",
    decreases: "You still feel engaged with your studies, which helps lower your risk.",
  },
  mbi_efficacy: {
    increases: "You've been feeling less confident handling your work, which raises risk.",
    decreases: "You feel capable of handling your coursework, which helps protect you.",
  },
  dass_depression: {
    increases: "You've mentioned low mood fairly often — this is raising your risk.",
    decreases: "Your mood has been holding up okay, which helps keep risk down.",
  },
  dass_anxiety: {
    increases: "You've been feeling more anxious than usual, adding to your risk.",
    decreases: "Anxiety hasn't been a big issue for you lately, which helps.",
  },
  dass_stress: {
    increases: "Your stress levels have been high, which is a notable risk factor.",
    decreases: "Your stress seems manageable right now, which is helping.",
  },
  cope_score: {
    increases: "You've had a harder time coping with challenges lately, raising risk.",
    decreases: "You're coping with challenges reasonably well, which helps protect you.",
  },
  attendance_rate: {
    increases: "Your attendance has dropped somewhat, adding to your risk.",
    decreases: "Your attendance looks solid, which is a good sign.",
  },
  grade_decline_slope: {
    increases: "Your grades have been slipping, which is a concerning sign.",
    decreases: "Your grades have held steady or improved, which helps.",
  },
  assignment_completion_rate: {
    increases: "You've been completing fewer assignments than usual, raising risk.",
    decreases: "You're keeping up well with assignments, which helps.",
  },
  late_submission_count: {
    increases: "You've had a few late submissions, adding a bit to your risk.",
    decreases: "You're mostly submitting on time, which is a good sign.",
  },
  lms_login_frequency: {
    increases: "You've been logging into the portal less often lately.",
    decreases: "You're staying active on the portal, which is a good sign.",
  },
  time_on_task_weekly: {
    increases: "Your study hours have dropped, which adds to your risk.",
    decreases: "You're putting in solid study time, which helps.",
  },
  engagement_variability: {
    increases: "Your study routine has been a bit inconsistent lately.",
    decreases: "Your study routine has stayed fairly consistent, which helps.",
  },
};

const getMagnitudeLabel = (widthPct) => {
  if (widthPct >= 70) return "One of the biggest factors";
  if (widthPct >= 35) return "A moderate factor";
  return "A smaller factor";
};

const SUMMARY_BY_RISK = {
  Low: "Overall, things look fairly steady right now. A few areas below are worth keeping an eye on, but nothing urgent.",
  Medium: "Your check-in shows a mix — some things are going okay, but a few factors below are worth paying attention to.",
  High: "Your check-in suggests you may be under real strain right now. The factors below are worth taking seriously, and reaching out to a mentor or counselor could help.",
};

function ExplanationPanel({ topFactors, riskLevel }) {
  if (!topFactors || topFactors.length === 0) return null;

  const maxAbs = Math.max(...topFactors.map((f) => Math.abs(f.shap_value)));

  const readableName = (key) =>
    FRIENDLY_LABELS[key] ||
    key
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Why this score?</h2>
      <p style={{ color: "var(--muted)", marginTop: "-0.5rem" }}>
        These factors influenced the prediction most, ranked by impact.
      </p>

      {riskLevel && SUMMARY_BY_RISK[riskLevel] && (
        <p
          style={{
            background: "#f4f9f8",
            borderRadius: "8px",
            padding: "0.8rem 1rem",
            fontSize: "0.9rem",
            marginBottom: "1.2rem",
          }}
        >
          {SUMMARY_BY_RISK[riskLevel]}
        </p>
      )}

      {topFactors.map((factor) => {
        const isPositive = factor.shap_value > 0;
        const widthPct = (Math.abs(factor.shap_value) / maxAbs) * 100;
        const desc = FEATURE_DESCRIPTIONS[factor.feature]?.[isPositive ? "increases" : "decreases"];
        return (
          <div key={factor.feature} style={{ marginBottom: "1.1rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.9rem",
                marginBottom: "0.25rem",
              }}
            >
              <span>{readableName(factor.feature)}</span>
              <span style={{ color: isPositive ? "var(--high)" : "var(--seafoam)" }}>
                {isPositive ? "Increases risk" : "Decreases risk"}
              </span>
            </div>
            <div style={{ background: "#eee", borderRadius: "6px", height: "10px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${widthPct}%`,
                  height: "100%",
                  background: isPositive ? "var(--high)" : "var(--seafoam)",
                  borderRadius: "6px",
                }}
              />
            </div>
            {desc && (
              <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.4rem" }}>
                {getMagnitudeLabel(widthPct)} — {desc}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ExplanationPanel;