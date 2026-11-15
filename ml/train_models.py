"""
Train and save the DEPLOYED model (XGBoost on the hybrid feature set).

The four-model comparison lives in compare_models.py. This script only produces the
artifacts the backend loads, in the exact format the backend expects:
    models/hybrid_xgboost_model.pkl   fitted XGBClassifier
    models/hybrid_scaler.pkl          fitted StandardScaler (applied before the model)
    models/label_encoder.pkl          LabelEncoder (classes_ = High, Low, Medium)
    models/hybrid_feature_list.pkl    ordered list of the 14 feature names

Protocol: stratified 80/20 split. Scaling -> SMOTE -> XGBoost are fitted inside an inner
3-fold grid search on the training part only. Reported numbers come from the untouched
20% held-out test set.

Usage (from the ml folder):
    python train_models.py                      # trains on the nonlinear regime
    python train_models.py --regime linear
"""
import argparse
import os
import warnings

import joblib
import pandas as pd
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline
from sklearn.metrics import (classification_report, confusion_matrix, f1_score,
                             precision_score, recall_score, roc_auc_score)
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from xgboost import XGBClassifier

from generate_data import FEATURES, SURVEY

warnings.filterwarnings("ignore")
DATA = {"linear": "data/synthetic_students.csv", "nonlinear": "data/synthetic_students_nonlinear.csv"}

ap = argparse.ArgumentParser()
ap.add_argument("--regime", choices=["linear", "nonlinear"], default="nonlinear")
args = ap.parse_args()

os.makedirs("models", exist_ok=True)
os.makedirs("results", exist_ok=True)

df = pd.read_csv(DATA[args.regime])
before = len(df)
df = df.dropna(subset=SURVEY).reset_index(drop=True)   # the app always collects the full survey
print(f"Regime: {args.regime}. Using {len(df)} of {before} students (rows with a skipped survey removed).")

le = LabelEncoder()
y = le.fit_transform(df["risk_level"])
print("Label mapping:", dict(zip(le.classes_, le.transform(le.classes_))))

X_train, X_test, y_train, y_test = train_test_split(
    df[FEATURES], y, test_size=0.2, random_state=42, stratify=y)

pipe = Pipeline([
    ("sc", StandardScaler()),
    ("smote", SMOTE(random_state=0, k_neighbors=3)),
    ("m", XGBClassifier(eval_metric="mlogloss", random_state=0, n_jobs=2, verbosity=0)),
])
grid = {"m__n_estimators": [100, 200], "m__max_depth": [3, 5], "m__learning_rate": [0.05, 0.1]}
search = GridSearchCV(pipe, grid, cv=3, scoring="f1_macro", n_jobs=1).fit(X_train, y_train)
print("Best settings:", search.best_params_)

scaler = search.best_estimator_.named_steps["sc"]
model = search.best_estimator_.named_steps["m"]

# ---- evaluation on the untouched held-out test set ----
X_test_scaled = scaler.transform(X_test)
pred = model.predict(X_test_scaled)
proba = model.predict_proba(X_test_scaled)
metrics = {
    "precision_macro": precision_score(y_test, pred, average="macro"),
    "recall_macro": recall_score(y_test, pred, average="macro"),
    "f1_macro": f1_score(y_test, pred, average="macro"),
    "roc_auc_ovr": roc_auc_score(y_test, proba, multi_class="ovr"),
}
print(f"\nHeld-out test set (n = {len(y_test)})")
for k, v in metrics.items():
    print(f"  {k:16s} {v:.3f}")
print(classification_report(y_test, pred, target_names=le.classes_))
cm = pd.DataFrame(confusion_matrix(y_test, pred), index=[f"true_{c}" for c in le.classes_],
                  columns=[f"pred_{c}" for c in le.classes_])
print(cm)

pd.DataFrame([metrics]).round(4).to_csv(f"results/final_model_{args.regime}_metrics.csv", index=False)
cm.to_csv(f"results/final_model_{args.regime}_confusion_matrix.csv")

# ---- save the artifacts the backend loads ----
joblib.dump(model, "models/hybrid_xgboost_model.pkl")
joblib.dump(scaler, "models/hybrid_scaler.pkl")
joblib.dump(le, "models/label_encoder.pkl")
joblib.dump(FEATURES, "models/hybrid_feature_list.pkl")
print("\nSaved 4 files in ml/models/. Copy them to backend/models/ to use them in the app.")