\# Academic Burnout Prediction System



Hybrid ML system (survey + behavioral data) predicting student burnout risk, with SHAP explainability.



\## Project Structure

\- `ml/` — synthetic data generation, model training, SHAP notebook

\- `backend/` — FastAPI server (predictions, trends, mentor roster)

\- `frontend/` — React dashboard (student + mentor views)



\## Setup



\### 1. ML (optional — models are already trained and saved in ml/models/)

cd ml

python -m venv venv

venv\\Scripts\\Activate.ps1

pip install numpy pandas scikit-learn xgboost imbalanced-learn shap matplotlib

python generate\_data.py

python train\_models.py



\### 2. Backend

cd backend

python -m venv venv

venv\\Scripts\\Activate.ps1

pip install fastapi uvicorn pydantic scikit-learn xgboost shap pandas numpy joblib sqlalchemy

uvicorn main:app --reload

Runs at http://127.0.0.1:8000 — docs at /docs



\### 3. Frontend

cd frontend

npm install

npm run dev

Runs at http://localhost:5173



\## Current Status

\- ML: synthetic dataset + 3-model comparison (hybrid wins) + SHAP — done

\- Backend: /predict, /trends/{id}, /mentor/students — done

\- Frontend: Student dashboard (survey, gauge, explanation, trend chart) + Mentor dashboard — done

\- Next: Auth/login, mentor-student assignment, chatbot-style survey, recommendations



