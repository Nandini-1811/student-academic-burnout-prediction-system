"""
Simulation-based student data generator (replaces the old generate_data.py).

Two regimes, selected with generate(regime=...):
  "linear"    - every feature moves in a straight line with one hidden burnout level
  "nonlinear" - three hidden MBI dimensions (exhaustion, cynicism, low efficacy),
                tipping points, two burnout styles (withdrawers / over-compensators)
                and interactions

Key rule: the risk label is built ONLY from the hidden burnout state. No survey or
behavioral column is used to build it, so no feature can leak the answer.
The two data streams fail in different ways (survey: response bias, noise, skipped
surveys; behavior: part-time-job and offline-study confounders).
All data is simulated. The paper must say so.
"""
import numpy as np
import pandas as pd
from scipy.stats import norm

SURVEY = ["mbi_exhaustion", "mbi_cynicism", "mbi_efficacy",
          "dass_depression", "dass_anxiety", "dass_stress", "cope_score"]
BEHAVIORAL = ["attendance_rate", "grade_decline_slope", "assignment_completion_rate",
              "late_submission_count", "lms_login_frequency", "time_on_task_weekly",
              "engagement_variability"]
FEATURES = SURVEY + BEHAVIORAL


def _sigmoid(x):
    return 1 / (1 + np.exp(-x))


def generate(n=1800, seed=42, regime="linear", survey_noise=1.0, survey_bias_sd=0.08,
             missing_rate=0.10, job_frac=0.20, offline_frac=0.15, overcomp_frac=0.30,
             cuts=(0.38, 0.62), theta=0.62):
    rng = np.random.default_rng(seed)

    # ---------- hidden burnout state and the label ----------
    if regime == "linear":
        latent = np.clip(rng.beta(2, 3, n) + rng.normal(0, 0.06, n), 0, 1)
        label = np.where(latent < cuts[0], "Low", np.where(latent < cuts[1], "Medium", "High"))
        uE = uC = uA = latent                       # one hidden level drives everything
    elif regime == "nonlinear":
        corr = np.array([[1, .5, .5], [.5, 1, .5], [.5, .5, 1]])
        z = rng.multivariate_normal(np.zeros(3), corr, n)
        uE, uC, uA = norm.cdf(z).T                  # exhaustion, cynicism, low efficacy in [0,1]
        k = (np.vstack([uE, uC, uA]).T > theta).sum(1)   # dimensions past the threshold
        label = np.where(k == 0, "Low", np.where(k == 3, "High", "Medium"))
    else:
        raise ValueError("regime must be 'linear' or 'nonlinear'")

    # ---------- survey stream: biased, noisy view of the hidden state ----------
    bias = rng.normal(0, survey_bias_sd, n)         # per-student response style
    e, c, a = (np.clip(x + bias, 0, 1) for x in (uE, uC, uA))
    sn = survey_noise

    def draw(base, slope, sd, lo, hi, x):
        return np.clip(rng.normal(base + slope * x, sd * sn), lo, hi)

    df = pd.DataFrame({
        "mbi_exhaustion":  draw(18, 28, 6, 0, 54, e),
        "mbi_cynicism":    draw(13, 22, 6, 0, 45, c),
        "mbi_efficacy":    draw(36, -16, 7, 0, 48, a),
        "dass_depression": draw(5, 20, 5, 0, 42, (e + a) / 2),
        "dass_anxiety":    draw(5, 18, 5, 0, 42, (e + c) / 2),
        "dass_stress":     draw(6, 22, 5, 0, 42, e),
        "cope_score":      draw(40, -10, 7, 10, 60, a),
    })

    # ---------- behavioral stream: confounders unrelated to burnout ----------
    job = rng.random(n) < job_frac            # part-time job -> less time on campus / LMS
    offline = rng.random(n) < offline_frac    # prefers offline study -> fewer logins

    if regime == "linear":
        lb = uE                                # behaviour moves straight with burnout
        df["attendance_rate"] = np.clip(rng.normal(90 - 30 * lb - 14 * job, 9), 30, 100)
        df["grade_decline_slope"] = rng.normal(-1.6 * lb, 0.6)
        df["assignment_completion_rate"] = np.clip(rng.normal(94 - 32 * lb - 8 * job, 9), 20, 100)
        df["late_submission_count"] = np.clip(rng.poisson(1 + 8 * lb + 1.5 * job), 0, 20)
        df["lms_login_frequency"] = np.clip(rng.normal(20 - 9 * lb - 7 * offline - 3 * job, 5), 0, 30)
        df["time_on_task_weekly"] = np.clip(rng.normal(15 - 6 * lb - 5 * offline, 4.5), 0, 30)
        df["engagement_variability"] = np.clip(rng.normal(2 + 4 * lb, 1.7), 0, 15)
    else:
        over = (rng.random(n) < overcomp_frac).astype(float)   # burnout style
        s = _sigmoid(10 * (uE - 0.6))                           # tipping point on exhaustion
        w, o = s * (1 - over), s * over                         # withdrawers / over-compensators
        df["attendance_rate"] = np.clip(rng.normal(90 - 30 * w - 12 * job - 6 * uA, 9), 30, 100)
        df["grade_decline_slope"] = rng.normal(-1.8 * s * uA, 0.6)
        df["assignment_completion_rate"] = np.clip(rng.normal(94 - 30 * w - 8 * o - 8 * job, 9), 20, 100)
        df["late_submission_count"] = np.clip(rng.poisson(1 + 9 * s * uC + 1.5 * job), 0, 20)
        df["lms_login_frequency"] = np.clip(rng.normal(20 - 9 * w + 8 * o - 7 * offline - 3 * job, 5), 0, 30)
        df["time_on_task_weekly"] = np.clip(rng.normal(15 - 6 * w + 7 * o - 5 * offline, 4.5), 0, 30)
        df["engagement_variability"] = np.clip(rng.normal(2 + 3 * w + 5 * o, 1.7), 0, 15)

    # ---------- survey non-response (fatigue): the whole survey row is missing ----------
    df.loc[rng.random(n) < missing_rate, SURVEY] = np.nan

    df.insert(0, "student_id", [f"S{1000 + i}" for i in range(n)])
    df["risk_level"] = label
    return df


if __name__ == "__main__":
    for regime, path in [("linear", "data/synthetic_students.csv"),
                         ("nonlinear", "data/synthetic_students_nonlinear.csv")]:
        d = generate(regime=regime)
        d.to_csv(path, index=False)
        print(f"{regime:9s} -> {path}  rows={len(d)}  "
              f"classes={d.risk_level.value_counts(normalize=True).round(3).to_dict()}  "
              f"survey_missing={d[SURVEY[0]].isna().mean():.3f}")