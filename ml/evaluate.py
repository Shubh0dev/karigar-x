"""
Evaluation script for the Smart Pricing XGBoost model.

Loads the saved model and evaluates it against the test dataset,
reporting MAE, RMSE, and R2 metrics.
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def evaluate_model():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(base_dir, "data", "artisan_pricing_dataset.csv")
    model_path = os.path.join(base_dir, "models", "pricing_xgb_model.joblib")

    if not os.path.exists(model_path):
        print(f"Model not found at {model_path}. Run train.py first.")
        return

    if not os.path.exists(data_path):
        print(f"Dataset not found at {data_path}. Run data/generate_data.py first.")
        return

    print("Loading model and data...")
    pipeline = joblib.load(model_path)
    df = pd.read_csv(data_path)

    target_col = "selling_price"
    X = df.drop(columns=[target_col])
    y = df[target_col]

    # Evaluate on the same test set (using same random state)
    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Predicting...")
    y_pred = pipeline.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    print("\n--- Model Evaluation Metrics ---")
    print(f"Mean Absolute Error (MAE): INR {mae:.2f}")
    print(f"Root Mean Squared Error (RMSE): INR {rmse:.2f}")
    print(f"R-squared (R2): {r2:.4f}")
    print("--------------------------------")

if __name__ == "__main__":
    evaluate_model()
