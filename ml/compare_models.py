"""
Four-model comparison requested by the project mentor:
  Linear regression, Logistic regression, Decision tree, XGBoost
on IDENTICAL data and IDENTICAL folds, for three feature sets
(survey only / behavioral only / hybrid), in both simulation regimes.

Protocol (state it once in the paper):
  * Repeated stratified 5-fold CV (default 3 repeats = 15 folds), same folds for every model
  * Inside each fold: median-impute -> standardise -> SMOTE (training part only) -> model
  * Hyperparameters tuned by an inner 3-fold grid search on the training part only
  * Metrics: macro precision / recall / F1, one-vs-rest ROC-AUC, recall of the High class

Usage (from the ml folder):
  python compare_models.py                 # both regimes, 3 repeats
  python compare_models.py --regime linear --repeats 1   # quick test
"""
import argparse
import os
import time
import warnings

import numpy as np
import pandas as pd
from scipy.stats import wilcoxon
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import GridSearchCV, RepeatedStratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline
from xgboost import XGBClassifier

from generate_data import SURVEY, BEHAVIORAL, FEATURES

warnings.filterwarnings("ignore")
ORDER = ["Low", "Medium", "High"]          # ordinal 0, 1, 2
ALGOS = ["LinearReg (ordinal)", "LogisticReg", "DecisionTree", "XGBoost"]
FEATSETS = {"Survey": SURVEY, "Behavioral": BEHAVIORAL, "Hybrid": FEATURES}
DATA = {"linear": "data/synthetic_students.csv", "nonlinear": "data/synthetic_students_nonlinear.csv"}


class LinearRegressionClassifier(BaseEstimator, ClassifierMixin):
    """Linear regression on the ordinal risk level (0/1/2), rounded to the nearest class.
    predict_proba is a softmax over distance to each class and is used for AUC only."""

    def fit(self, X, y):
        self.classes_ = np.array([0, 1, 2])
        self.m_ = LinearRegression().fit(X, y)
        return self

    def predict(self, X):
        return np.clip(np.rint(self.m_.predict(X)), 0, 2).astype(int)

    def predict_proba(self, X):
        d = -((self.m_.predict(X)[:, None] - self.classes_[None, :]) ** 2) * 4
        e = np.exp(d - d.max(1, keepdims=True))
        return e / e.sum(1, keepdims=True)


def make(name):
    steps = [("imp", SimpleImputer(strategy="median")), ("sc", StandardScaler())]
    if name == "LinearReg (ordinal)":
        return Pipeline(steps + [("m", LinearRegressionClassifier())]), {}
    steps.append(("smote", SMOTE(random_state=0, k_neighbors=3)))
    if name == "LogisticReg":
        return Pipeline(steps + [("m", LogisticRegression(max_iter=2000))]), {"m__C": [0.1, 1, 10]}
    if name == "DecisionTree":
        return (Pipeline(steps + [("m", DecisionTreeClassifier(random_state=0))]),
                {"m__max_depth": [3, 5, 8], "m__min_samples_leaf": [5, 20]})
    if name == "XGBoost":
        return (Pipeline(steps + [("m", XGBClassifier(eval_metric="mlogloss", random_state=0,
                                                      n_jobs=2, verbosity=0))]),
                {"m__n_estimators": [100, 200], "m__max_depth": [3, 5], "m__learning_rate": [0.05, 0.1]})
    raise ValueError(name)


def run(df, repeats=3, seed=42):
    y = df["risk_level"].map({k: i for i, k in enumerate(ORDER)}).values
    splits = list(RepeatedStratifiedKFold(n_splits=5, n_repeats=repeats, random_state=seed).split(df, y))
    rows = []
    for fname, cols in FEATSETS.items():
        X = df[cols].values
        for algo in ALGOS:
            for k, (tr, te) in enumerate(splits):
                pipe, grid = make(algo)
                est = GridSearchCV(pipe, grid, cv=3, scoring="f1_macro", n_jobs=1) if grid else pipe
                est.fit(X[tr], y[tr])
                pred, proba = est.predict(X[te]), est.predict_proba(X[te])
                rows.append(dict(
                    features=fname, algo=algo, fold=k,
                    precision=precision_score(y[te], pred, average="macro", zero_division=0),
                    recall=recall_score(y[te], pred, average="macro", zero_division=0),
                    f1=f1_score(y[te], pred, average="macro", zero_division=0),
                    auc=roc_auc_score(y[te], proba, multi_class="ovr"),
                    high_recall=recall_score(y[te], pred, labels=[2], average="macro", zero_division=0)))
            print(f"  finished {fname:10s} {algo}", flush=True)
    return pd.DataFrame(rows)


def report(r, regime):
    metrics = ["precision", "recall", "f1", "auc", "high_recall"]
    g = r.groupby(["features", "algo"])[metrics]
    mean, sd = g.mean(), g.std()
    mean.round(4).to_csv(f"results/{regime}_summary.csv")
    (mean.round(3).astype(str) + " +/- " + sd.round(3).astype(str)).to_csv(f"results/{regime}_summary_with_sd.csv")
    print(f"\n===== {regime.upper()} regime: mean over folds =====")
    print(mean.round(3).to_string())

    h = r[r.features == "Hybrid"].pivot(index="fold", columns="algo", values="f1")
    print("\nPaired Wilcoxon tests on Hybrid F1 (over folds):")
    for a, b in [("XGBoost", "LogisticReg"), ("XGBoost", "DecisionTree"), ("XGBoost", "LinearReg (ordinal)")]:
        d = h[a] - h[b]
        p = wilcoxon(h[a], h[b]).pvalue if d.abs().sum() > 0 else float("nan")
        print(f"  {a} minus {b}: {d.mean():+.3f}  (p = {p:.4f})")
    x = r[r.algo == "XGBoost"].pivot(index="fold", columns="features", values="f1")
    for other in ("Survey", "Behavioral"):
        d = x["Hybrid"] - x[other]
        print(f"  XGBoost Hybrid minus {other}: {d.mean():+.3f}  (p = {wilcoxon(x['Hybrid'], x[other]).pvalue:.4f})")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--regime", choices=["linear", "nonlinear", "both"], default="both")
    ap.add_argument("--repeats", type=int, default=3)
    args = ap.parse_args()
    os.makedirs("results", exist_ok=True)
    for regime in (["linear", "nonlinear"] if args.regime == "both" else [args.regime]):
        t = time.time()
        print(f"\n### Running {regime} regime ({args.repeats} repeats x 5 folds) ...", flush=True)
        res = run(pd.read_csv(DATA[regime]), repeats=args.repeats)
        res.to_csv(f"results/{regime}_folds.csv", index=False)
        report(res, regime)
        print(f"\n({regime} took {time.time() - t:.0f}s)")