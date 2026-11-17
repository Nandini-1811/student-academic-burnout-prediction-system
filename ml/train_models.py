"""
Trains and saves the models the backend uses.
Deployed: hybrid_xgboost_model, hybrid_scaler, label_encoder, hybrid_feature_list
Comparison only (mentor sidebar): compare_logistic, compare_tree, compare_linear
All four models share the same 80/20 split, scaler and SMOTE setting.
Usage (from ml folder):  python train_models.py   |   python train_models.py --regime linear
"""
import argparse, os, warnings
import joblib
import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import (classification_report, confusion_matrix, f1_score,
                             precision_score, recall_score, roc_auc_score)
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier
from xgboost import XGBClassifier
from generate_data import FEATURES, SURVEY

warnings.filterwarnings("ignore")
DATA = {"linear": "data/synthetic_students.csv", "nonlinear": "data/synthetic_students_nonlinear.csv"}
ORDINAL = {"Low": 0, "Medium": 1, "High": 2}

ap = argparse.ArgumentParser()
ap.add_argument("--regime", choices=["linear", "nonlinear"], default="nonlinear")
args = ap.parse_args()
os.makedirs("models", exist_ok=True)
os.makedirs("results", exist_ok=True)

df = pd.read_csv(DATA[args.regime])
before = len(df)
df = df.dropna(subset=SURVEY).reset_index(drop=True)
print(f"Regime: {args.regime}. Using {len(df)} of {before} students.")

le = LabelEncoder()
y = le.fit_transform(df["risk_level"])
y_ord = df["risk_level"].map(ORDINAL).values
print("Label mapping:", dict(zip(le.classes_, le.transform(le.classes_))))

X_train, X_test, y_train, y_test, o_train, o_test = train_test_split(
    df[FEATURES], y, y_ord, test_size=0.2, random_state=42, stratify=y)


def tuned(estimator, grid):
    pipe = Pipeline([("sc", StandardScaler()),
                     ("smote", SMOTE(random_state=0, k_neighbors=3)),
                     ("m", estimator)])
    return GridSearchCV(pipe, grid, cv=3, scoring="f1_macro", n_jobs=1).fit(X_train, y_train)


xgb_s = tuned(XGBClassifier(eval_metric="mlogloss", random_state=0, n_jobs=2, verbosity=0),
              {"m__n_estimators": [100, 200], "m__max_depth": [3, 5], "m__learning_rate": [0.05, 0.1]})
log_s = tuned(LogisticRegression(max_iter=2000), {"m__C": [0.1, 1, 10]})
tree_s = tuned(DecisionTreeClassifier(random_state=0),
               {"m__max_depth": [3, 5, 8], "m__min_samples_leaf": [5, 20]})
print("XGBoost:", xgb_s.best_params_, "| Logistic:", log_s.best_params_, "| Tree:", tree_s.best_params_)

scaler = xgb_s.best_estimator_.named_steps["sc"]      # identical in every pipeline
xgb_model = xgb_s.best_estimator_.named_steps["m"]
log_model = log_s.best_estimator_.named_steps["m"]
tree_model = tree_s.best_estimator_.named_steps["m"]
lin_model = LinearRegression().fit(scaler.transform(X_train), o_train)

Xs = scaler.transform(X_test)
NAMES = np.array(["Low", "Medium", "High"])


def lin_predict(X):
    cls = np.clip(np.rint(lin_model.predict(X)), 0, 2).astype(int)
    return le.transform(NAMES[cls])


def lin_proba(X):
    d = -((lin_model.predict(X)[:, None] - np.arange(3)[None, :]) ** 2) * 4
    e = np.exp(d - d.max(1, keepdims=True))
    p = e / e.sum(1, keepdims=True)                    # columns: Low, Medium, High
    return p[:, [list(NAMES).index(c) for c in le.classes_]]


high_idx = le.transform(["High"])[0]
rows = []
for name, pred, proba in [
    ("Linear regression (ordinal)", lin_predict(Xs), lin_proba(Xs)),
    ("Logistic regression", log_model.predict(Xs), log_model.predict_proba(Xs)),
    ("Decision tree", tree_model.predict(Xs), tree_model.predict_proba(Xs)),
    ("XGBoost (deployed)", xgb_model.predict(Xs), xgb_model.predict_proba(Xs)),
]:
    rows.append(dict(model=name,
                     precision_macro=precision_score(y_test, pred, average="macro"),
                     recall_macro=recall_score(y_test, pred, average="macro"),
                     f1_macro=f1_score(y_test, pred, average="macro"),
                     roc_auc_ovr=roc_auc_score(y_test, proba, multi_class="ovr"),
                     high_risk_recall=recall_score(y_test, pred, labels=[high_idx], average="macro")))
table = pd.DataFrame(rows).round(3)
print(f"\nHeld-out test set (n = {len(y_test)}), all four models, same students")
print(table.to_string(index=False))
table.to_csv(f"results/final_models_{args.regime}_metrics.csv", index=False)

xp = xgb_model.predict(Xs)
print("\nDeployed model (XGBoost):")
print(classification_report(y_test, xp, target_names=le.classes_))
cm = pd.DataFrame(confusion_matrix(y_test, xp), index=[f"true_{c}" for c in le.classes_],
                  columns=[f"pred_{c}" for c in le.classes_])
print(cm)
cm.to_csv(f"results/final_model_{args.regime}_confusion_matrix.csv")

joblib.dump(xgb_model, "models/hybrid_xgboost_model.pkl")
joblib.dump(scaler, "models/hybrid_scaler.pkl")
joblib.dump(le, "models/label_encoder.pkl")
joblib.dump(FEATURES, "models/hybrid_feature_list.pkl")
joblib.dump(log_model, "models/compare_logistic.pkl")
joblib.dump(tree_model, "models/compare_tree.pkl")
joblib.dump(lin_model, "models/compare_linear.pkl")
print("\nSaved 7 files in ml/models/. Copy them all to backend/models/.")