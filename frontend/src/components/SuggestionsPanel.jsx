const SUGGESTIONS_BY_FEATURE = {
  mbi_exhaustion: "Try to build in a bit of rest between study sessions — even short breaks help with burnout over time.",
  mbi_cynicism: "If your studies feel meaningless lately, talking to your subject teacher about what you're finding hard could help reconnect you with the material.",
  mbi_efficacy: "If you're doubting your ability to keep up, your mentor can help you break tasks into more manageable steps.",
  dass_depression: "If you've been feeling low for a while, consider talking to a counselor or trusted mentor — you don't have to handle this alone.",
  dass_anxiety: "If anxiety has been getting in the way, it may help to talk to a counselor about what's been on your mind.",
  dass_stress: "Consider talking to your mentor about workload — sometimes a small adjustment in pacing makes a real difference.",
  cope_score: "Your mentor or a counselor can help you build some concrete strategies for handling tough weeks.",
  attendance_rate: "If attendance has been slipping, it might help to loop in your subject teacher early, before it affects your grades.",
  grade_decline_slope: "A dip in grades is worth flagging to your subject teacher soon — they may be able to help you catch up before it snowballs.",
  assignment_completion_rate: "If assignments have been piling up, your mentor can help you prioritize or negotiate deadlines where possible.",
  late_submission_count: "Consider setting reminders a day before deadlines, or talk to your subject teacher if deadlines have been consistently tough to meet.",
  lms_login_frequency: "Staying a bit more consistent with the portal can help you catch announcements and deadlines early.",
  time_on_task_weekly: "If study time has dropped, your mentor can help you look at what's competing for your time and rebuild a routine.",
  engagement_variability: "A more consistent weekly routine — even a rough one — tends to reduce burnout risk over time.",
};

const RISK_ACTION = {
  High: {
    heading: "We'd recommend reaching out soon",
    text: "Your results suggest you may be under real strain right now. It would be a good idea to contact your mentor or a counselor this week — they're there to help, and catching this early makes a real difference.",
  },
  Medium: {
    heading: "Worth keeping an eye on",
    text: "A few things below are worth addressing. Consider mentioning them to your mentor or subject teacher at your next check-in, even if things don't feel urgent yet.",
  },
  Low: {
    heading: "You're doing okay",
    text: "Nothing here needs immediate action, but the notes below are still worth keeping in mind as the term goes on.",
  },
};

function SuggestionsPanel({ topFactors, riskLevel }) {
  if (!topFactors || topFactors.length === 0) return null;

  const riskFactors = topFactors.filter((f) => f.shap_value > 0);
  const action = RISK_ACTION[riskLevel];

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>What can help</h2>

      {action && (
        <div
          style={{
            background: riskLevel === "High" ? "#FDEEE9" : "#f4f9f8",
            borderLeft: `4px solid ${riskLevel === "High" ? "var(--high)" : "var(--seafoam)"}`,
            borderRadius: "6px",
            padding: "0.9rem 1rem",
            marginBottom: "1.2rem",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: "0.3rem" }}>{action.heading}</div>
          <div style={{ fontSize: "0.9rem", color: "var(--muted)" }}>{action.text}</div>
        </div>
      )}

      {riskFactors.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          Nothing specific is pushing your risk up right now — keep doing what you're doing.
        </p>
      ) : (
        riskFactors.map((f) => (
          <div key={f.feature} style={{ marginBottom: "0.8rem", fontSize: "0.9rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <span style={{ color: "var(--high)", fontSize: "1.1rem", lineHeight: 1 }}>•</span>
              <span>{SUGGESTIONS_BY_FEATURE[f.feature] || "This is worth mentioning to your mentor."}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default SuggestionsPanel;