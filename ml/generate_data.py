import numpy as np
import pandas as pd

np.random.seed(42)
N = 1800  # number of synthetic students

# ---- Latent "true burnout tendency" per student (not observed directly) ----
# This drives correlated behavior across all features, so the hybrid model
# actually has real signal to learn from.
burnout_tendency = np.random.beta(a=2, b=3, size=N)  # skewed toward lower burnout

# ---- Psychometric survey scores (higher = worse) ----
mbi_exhaustion = np.clip(np.random.normal(20 + 25 * burnout_tendency, 5, N), 0, 54)
mbi_cynicism = np.clip(np.random.normal(15 + 20 * burnout_tendency, 5, N), 0, 45)
mbi_efficacy = np.clip(np.random.normal(35 - 15 * burnout_tendency, 6, N), 0, 48)  # lower = worse
dass_depression = np.clip(np.random.normal(5 + 20 * burnout_tendency, 4, N), 0, 42)
dass_anxiety = np.clip(np.random.normal(5 + 18 * burnout_tendency, 4, N), 0, 42)
dass_stress = np.clip(np.random.normal(6 + 22 * burnout_tendency, 4, N), 0, 42)
cope_score = np.clip(np.random.normal(40 - 10 * burnout_tendency, 6, N), 10, 60)  # higher = better coping

# ---- Behavioral / academic features ----
attendance_rate = np.clip(np.random.normal(90 - 35 * burnout_tendency, 8, N), 30, 100)
grade_decline_slope = np.random.normal(-2 * burnout_tendency, 0.5, N)  # negative = declining
assignment_completion_rate = np.clip(np.random.normal(95 - 40 * burnout_tendency, 8, N), 20, 100)
late_submission_count = np.clip(np.random.poisson(1 + 8 * burnout_tendency, N), 0, 20)
lms_login_frequency = np.clip(np.random.normal(20 - 12 * burnout_tendency, 5, N), 0, 30)
time_on_task_weekly = np.clip(np.random.normal(15 - 8 * burnout_tendency, 4, N), 0, 30)
engagement_variability = np.clip(np.random.normal(2 + 5 * burnout_tendency, 1.5, N), 0, 15)

# ---- Burnout risk label from the same latent tendency + noise ----
risk_score = (
    0.35 * burnout_tendency
    + 0.15 * (mbi_exhaustion / 54)
    + 0.15 * (dass_stress / 42)
    + 0.15 * (1 - attendance_rate / 100)
    + 0.10 * (late_submission_count / 20)
    + 0.10 * np.random.normal(0, 0.05, N)  # small noise
)

risk_level = pd.cut(risk_score, bins=[-np.inf, 0.35, 0.55, np.inf], labels=["Low", "Medium", "High"])

df = pd.DataFrame({
    "student_id": [f"S{1000+i}" for i in range(N)],
    "mbi_exhaustion": mbi_exhaustion,
    "mbi_cynicism": mbi_cynicism,
    "mbi_efficacy": mbi_efficacy,
    "dass_depression": dass_depression,
    "dass_anxiety": dass_anxiety,
    "dass_stress": dass_stress,
    "cope_score": cope_score,
    "attendance_rate": attendance_rate,
    "grade_decline_slope": grade_decline_slope,
    "assignment_completion_rate": assignment_completion_rate,
    "late_submission_count": late_submission_count,
    "lms_login_frequency": lms_login_frequency,
    "time_on_task_weekly": time_on_task_weekly,
    "engagement_variability": engagement_variability,
    "risk_level": risk_level,
})

df.to_csv("data/synthetic_students.csv", index=False)
print(f"Generated {len(df)} synthetic student records.")
print(df["risk_level"].value_counts())
print("\nSaved to data/synthetic_students.csv")