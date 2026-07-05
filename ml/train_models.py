import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE
from xgboost import XGBClassifier
from sklearn.metrics import f1_score, recall_score, precision_score, roc_auc_score, classification_report
from sklearn.preprocessing import LabelEncoder
import joblib
import os

os.makedirs("models", exist_ok=True)

# ---- Load data ----
df = pd.read_csv("data/synthetic_students.csv")

survey_features = [
    "mbi_exhaustion", "mbi_cynicism", "mbi_efficacy",
    "dass_depression", "dass_anxiety", "dass_stress", "cope_score"
]
behavioral_features = [
    "attendance_rate", "grade_decline_slope", "assignment_completion_rate",
    "late_submission_count", "lms_login_frequency", "time_on_task_weekly",
    "engagement_variability"
]
hybrid_features = survey_features + behavioral_features

# ---- Encode target ----
le = LabelEncoder()
y = le.fit_transform(df["risk_level"])  # Low=1, Medium=2, High=0 (alphabetical) -- we print mapping below
print("Label mapping:", dict(zip(le.classes_, le.transform(le.classes_))))

def train_and_evaluate(feature_list, model_name):
    X = df[feature_list]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Scale
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # SMOTE -- only on training data
    sm = SMOTE(random_state=42, k_neighbors=3)
    X_train_res, y_train_res = sm.fit_resample(X_train_scaled, y_train)

    # Train XGBoost
    model = XGBClassifier(
        n_estimators=200, max_depth=5, learning_rate=0.1,
        eval_metric="mlogloss", random_state=42
    )
    model.fit(X_train_res, y_train_res)

    # Predict
    y_pred = model.predict(X_test_scaled)
    y_proba = model.predict_proba(X_test_scaled)

    f1 = f1_score(y_test, y_pred, average="macro")
    recall = recall_score(y_test, y_pred, average="macro")
    precision = precision_score(y_test, y_pred, average="macro")
    roc_auc = roc_auc_score(y_test, y_proba, multi_class="ovr", average="macro")

    print(f"\n===== {model_name} =====")
    print(f"F1 (macro):      {f1:.3f}")
    print(f"Recall (macro):  {recall:.3f}")
    print(f"Precision (macro): {precision:.3f}")
    print(f"ROC-AUC (macro): {roc_auc:.3f}")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    return {
        "model": model_name, "f1": f1, "recall": recall,
        "precision": precision, "roc_auc": roc_auc
    }, model, scaler

results = []

r1, _, _ = train_and_evaluate(survey_features, "Survey-only")
results.append(r1)

r2, _, _ = train_and_evaluate(behavioral_features, "Behavioral-only")
results.append(r2)

r3, hybrid_model, hybrid_scaler = train_and_evaluate(hybrid_features, "Hybrid XGBoost")
results.append(r3)

# ---- Comparison table ----
comparison_df = pd.DataFrame(results)
print("\n\n===== COMPARISON TABLE =====")
print(comparison_df.to_string(index=False))
comparison_df.to_csv("models/comparison_table.csv", index=False)

# ---- Save the winning hybrid model ----
joblib.dump(hybrid_model, "models/hybrid_xgboost_model.pkl")
joblib.dump(hybrid_scaler, "models/hybrid_scaler.pkl")
joblib.dump(le, "models/label_encoder.pkl")
joblib.dump(hybrid_features, "models/hybrid_feature_list.pkl")

print("\nSaved: models/hybrid_xgboost_model.pkl, hybrid_scaler.pkl, label_encoder.pkl")
print("Saved comparison table to models/comparison_table.csv")