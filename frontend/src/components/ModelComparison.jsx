import { useEffect, useState } from "react";
import { getAllStudents } from "../api";
import ModelComparisonSidebar from "./ModelComparisonSidebar";

function ModelComparison() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    getAllStudents().then(setStudents).catch(() => {});
  }, []);

  return (
    <div className="cmp-page">
      <div className="app-header">
        <h1>Model Comparison</h1>
        <p>
          See how linear regression, logistic regression, a decision tree and XGBoost answer on the same
          input, live.
        </p>
      </div>
      <ModelComparisonSidebar students={students} />
    </div>
  );
}

export default ModelComparison;