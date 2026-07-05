import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const RISK_TO_NUM = { Low: 1, Medium: 2, High: 3 };

function TrendChart({ trends }) {
  if (!trends || trends.length === 0) {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Risk Trend</h2>
        <p style={{ color: "var(--muted)" }}>
          No history yet — submit the survey a few times (e.g. across different weeks) to see a trend.
        </p>
      </div>
    );
  }

  const labels = trends.map((t) =>
    new Date(t.timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
  );

  const data = {
    labels,
    datasets: [
      {
        label: "Burnout Risk Level",
        data: trends.map((t) => RISK_TO_NUM[t.risk_level] || 0),
        borderColor: "#028090",
        backgroundColor: "#00A89633",
        tension: 0.3,
        pointBackgroundColor: trends.map((t) =>
          t.risk_level === "High" ? "#E76F51" : t.risk_level === "Medium" ? "#F4A261" : "#02C39A"
        ),
        pointRadius: 6,
      },
    ],
  };

  const options = {
    scales: {
      y: {
        min: 0,
        max: 4,
        ticks: {
          stepSize: 1,
          callback: (value) => ({ 0: "", 1: "Low", 2: "Medium", 3: "High", 4: "" }[value]),
        },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Risk Trend Over Time</h2>
      <Line data={data} options={options} />
    </div>
  );
}

export default TrendChart;