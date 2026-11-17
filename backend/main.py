from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from contextlib import asynccontextmanager
import joblib
import pandas as pd
import json
import os
import numpy as np

from database import init_db, get_db, Prediction
from fastapi.middleware.cors import CORSMiddleware

# ---- Model artifacts (loaded once at startup, not per-request) ----
ml_models = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    ml_models["model"] = joblib.load("models/hybrid_xgboost_model.pkl")
    ml_models["scaler"] = joblib.load("models/hybrid_scaler.pkl")
    ml_models["label_encoder"] = joblib.load("models/label_encoder.pkl")
    ml_models["feature_list"] = joblib.load("models/hybrid_feature_list.pkl")
    for key, fname in [("cmp_logistic", "compare_logistic.pkl"),
                    ("cmp_tree", "compare_tree.pkl"),
                    ("cmp_linear", "compare_linear.pkl")]:
                if os.path.exists(f"models/{fname}"):
                    ml_models[key] = joblib.load(f"models/{fname}")
    import shap
    ml_models["explainer"] = shap.TreeExplainer(ml_models["model"])
    init_db()
    print("Model artifacts loaded and database initialized.")
    yield
    ml_models.clear()

app = FastAPI(title="Academic Burnout Prediction API", lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StudentFeatures(BaseModel):
    student_id: str
    mbi_exhaustion: float
    mbi_cynicism: float
    mbi_efficacy: float
    dass_depression: float
    dass_anxiety: float
    dass_stress: float
    cope_score: float
    attendance_rate: float
    grade_decline_slope: float
    assignment_completion_rate: float
    late_submission_count: float
    lms_login_frequency: float
    time_on_task_weekly: float
    engagement_variability: float

class CompareInput(BaseModel):
    mbi_exhaustion: float
    mbi_cynicism: float
    mbi_efficacy: float
    dass_depression: float
    dass_anxiety: float
    dass_stress: float
    cope_score: float
    attendance_rate: float
    grade_decline_slope: float
    assignment_completion_rate: float
    late_submission_count: float
    lms_login_frequency: float
    time_on_task_weekly: float
    engagement_variability: float


CLASS_ORDER = ["Low", "Medium", "High"]

@app.get("/")
def root():
    return {"status": "Academic Burnout Prediction API is running"}


@app.post("/predict")
def predict(student: StudentFeatures, top_n: int = 7, db: Session = Depends(get_db)):
    model = ml_models["model"]
    scaler = ml_models["scaler"]
    label_encoder = ml_models["label_encoder"]
    feature_list = ml_models["feature_list"]
    explainer = ml_models["explainer"]

    student_data = student.model_dump()
    student_id = student_data.pop("student_id")

    X_input = pd.DataFrame([student_data])[feature_list]
    X_input_scaled = scaler.transform(X_input)

    pred_class = model.predict(X_input_scaled)[0]
    pred_proba = model.predict_proba(X_input_scaled)[0]
    risk_level = label_encoder.inverse_transform([pred_class])[0]
    proba_dict = {k: round(float(v), 3) for k, v in zip(label_encoder.classes_, pred_proba)}

    single_shap = explainer.shap_values(X_input_scaled)
    high_risk_idx = list(label_encoder.classes_).index("High")
    contributions = single_shap[0, :, high_risk_idx]

    explanation_df = pd.DataFrame({
        "feature": feature_list,
        "shap_value": contributions
    }).sort_values("shap_value", key=abs, ascending=False).head(top_n)

    explanation_df = explanation_df.assign(value=explanation_df["feature"].map(student_data))
    top_factors = explanation_df.to_dict(orient="records")

    # ---- Save this prediction to the database ----
    record = Prediction(
        student_id=student_id,
        risk_level=str(risk_level),
        prob_low=proba_dict.get("Low", 0),
        prob_medium=proba_dict.get("Medium", 0),
        prob_high=proba_dict.get("High", 0),
        top_factors_json=json.dumps(top_factors),
        **student_data
    )
    db.add(record)
    db.commit()

    return {
        "student_id": student_id,
        "risk_level": str(risk_level),
        "probabilities": proba_dict,
        "top_factors": top_factors
    }


@app.get("/trends/{student_id}")
def get_trends(student_id: str, db: Session = Depends(get_db)):
    records = (
        db.query(Prediction)
        .filter(Prediction.student_id == student_id)
        .order_by(Prediction.timestamp)
        .all()
    )
    return [
        {
            "timestamp": r.timestamp,
            "risk_level": r.risk_level,
            "prob_high": r.prob_high,
        }
        for r in records
    ]


@app.get("/student/{student_id}/latest")
def get_latest_checkin(student_id: str, db: Session = Depends(get_db)):
    record = (
        db.query(Prediction)
        .filter(Prediction.student_id == student_id)
        .order_by(Prediction.timestamp.desc())
        .first()
    )
    if not record:
        return None
    return {
        "student_id": record.student_id,
        "timestamp": record.timestamp,
        "risk_level": record.risk_level,
        "probabilities": {
            "Low": record.prob_low,
            "Medium": record.prob_medium,
            "High": record.prob_high,
        },
        "top_factors": json.loads(record.top_factors_json) if record.top_factors_json else [],
    }


@app.get("/student/{student_id}/history")
def get_checkin_history(student_id: str, db: Session = Depends(get_db)):
    records = (
        db.query(Prediction)
        .filter(Prediction.student_id == student_id)
        .order_by(Prediction.timestamp.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "timestamp": r.timestamp,
            "risk_level": r.risk_level,
            "prob_high": r.prob_high,
        }
        for r in records
    ]


@app.get("/mentor/students")
def get_all_students(db: Session = Depends(get_db)):
    # Latest prediction per student
    all_records = db.query(Prediction).order_by(Prediction.timestamp.desc()).all()
    seen = set()
    latest = []
    for r in all_records:
        if r.student_id not in seen:
            seen.add(r.student_id)
            latest.append({
                "student_id": r.student_id,
                "risk_level": r.risk_level,
                "prob_high": r.prob_high,
                "timestamp": r.timestamp,
            })
    latest.sort(key=lambda x: {"High": 0, "Medium": 1, "Low": 2}[x["risk_level"]])
    return latest


@app.post("/compare")
def compare_models(inp: CompareInput):
    """Run every model on the same input. Nothing is saved to the database."""
    feature_list = ml_models["feature_list"]
    le = ml_models["label_encoder"]
    X = ml_models["scaler"].transform(pd.DataFrame([inp.model_dump()])[feature_list])
    results = []

    def add(key, name, note, probs_by_class, label=None, deployed=False, score=None):
        probs = {c: round(float(probs_by_class.get(c, 0.0)), 3) for c in CLASS_ORDER}
        results.append({
            "key": key, "name": name, "note": note, "deployed": deployed,
            "risk_level": label or max(probs, key=probs.get),
            "probabilities": probs,
            "score": None if score is None else round(float(score), 2),
        })

    if "cmp_linear" in ml_models:
        score = float(ml_models["cmp_linear"].predict(X)[0])
        d = -((score - np.arange(3)) ** 2) * 4
        e = np.exp(d - d.max())
        add("linear", "Linear regression",
            "Predicts a score from 0 to 2 and rounds it. Percentages are approximate.",
            dict(zip(CLASS_ORDER, e / e.sum())),
            label=CLASS_ORDER[int(np.clip(np.rint(score), 0, 2))], score=score)

    for key, mkey, name, note in [
        ("logistic", "cmp_logistic", "Logistic regression", "Straight-line decision boundaries. Simple and stable."),
        ("tree", "cmp_tree", "Decision tree", "One set of if/else rules. Easy to read, less stable."),
    ]:
        if mkey in ml_models:
            p = ml_models[mkey].predict_proba(X)[0]
            add(key, name, note, dict(zip(le.classes_, p)))

    p = ml_models["model"].predict_proba(X)[0]
    add("xgboost", "XGBoost", "Many small trees combined. Supports the SHAP explanations.",
        dict(zip(le.classes_, p)), deployed=True)

    labels = [r["risk_level"] for r in results]
    top = max(set(labels), key=labels.count)
    return {"models": results,
            "agreement": {"majority": top, "count": labels.count(top), "total": len(labels)}}


@app.get("/student/{student_id}/features")
def get_latest_features(student_id: str, db: Session = Depends(get_db)):
    r = (db.query(Prediction).filter(Prediction.student_id == student_id)
         .order_by(Prediction.timestamp.desc()).first())
    if not r:
        return None
    return {f: getattr(r, f) for f in ml_models["feature_list"]}