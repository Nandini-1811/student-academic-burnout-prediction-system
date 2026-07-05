function ExplanationPanel({ topFactors }) {
  if (!topFactors || topFactors.length === 0) return null;

  const maxAbs = Math.max(...topFactors.map((f) => Math.abs(f.shap_value)));

  const readableName = (key) =>
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
      {topFactors.map((factor) => {
        const isPositive = factor.shap_value > 0;
        const widthPct = (Math.abs(factor.shap_value) / maxAbs) * 100;
        return (
          <div key={factor.feature} style={{ marginBottom: "0.9rem" }}>
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
          </div>
        );
      })}
    </div>
  );
}

export default ExplanationPanel;