import joblib
import pandas as pd

model = joblib.load("models/hybrid_xgboost_model.pkl")
features = joblib.load("models/hybrid_feature_list.pkl")

importances = pd.Series(model.feature_importances_, index=features).sort_values(ascending=False)
print(importances)