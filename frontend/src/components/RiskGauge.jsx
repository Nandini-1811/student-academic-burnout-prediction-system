const RISK_COLORS = {
  Low: "#02C39A",
  Medium: "#F4A261",
  High: "#E76F51",
};

function RiskGauge({ riskLevel, probabilities }) {
  const color = RISK_COLORS[riskLevel] || "#ccc";
  const percent = probabilities ? Math.round(probabilities[riskLevel] * 100) : 0;

  return (
    <div className="card" style={{ textAlign: "center" }}>
      <div
        style={{
          width: "160px",
          height: "160px",
          borderRadius: "50%",
          margin: "0 auto 1rem auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          background: `conic-gradient(${color} ${percent * 3.6}deg, #eee 0deg)`,
        }}
      >
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color }}>
            {riskLevel || "—"}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#5C7A7D" }}>
            {percent}% confidence
          </div>
        </div>
      </div>
      <p style={{ color: "#5C7A7D", margin: 0 }}>Current burnout risk level</p>
    </div>
  );
}

export default RiskGauge;