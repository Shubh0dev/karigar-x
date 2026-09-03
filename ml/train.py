"""
Training script for the Smart Pricing XGBoost model.

Loads the prototype synthetic dataset, builds a scikit-learn pipeline,
trains an XGBRegressor, and saves the trained model artifact.
"""

import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBRegressor

def train_pricing_model():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(base_dir, "data", "artisan_pricing_dataset.csv")
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)
    
    print(f"Loading dataset from {data_path}...")
    try:
        df = pd.read_csv(data_path)
    except FileNotFoundError:
        print("Dataset not found. Please run 'python data/generate_data.py' first.")
        return

    # Define features and target
    target_col = "selling_price"
    categorical_features = ["category", "material"]
    numeric_features = [
        "material_cost",
        "labour_hours",
        "labour_rate",
        "quality_score",
        "craftsmanship_complexity",
        "size_scale",
        "season_demand_index",
        "market_reference_price"
    ]

    X = df[categorical_features + numeric_features]
    y = df[target_col]

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Build preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_features),
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
        ]
    )

    # Build the full XGBoost pipeline
    # We use a relatively small number of estimators since it's a prototype synthetic dataset
    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42))
    ])

    print("Training XGBoost regression model...")
    pipeline.fit(X_train, y_train)

    # Save the pipeline
    model_path = os.path.join(models_dir, "pricing_xgb_model.joblib")
    joblib.dump(pipeline, model_path)
    print(f"Model saved successfully to {model_path}")

    # Evaluate on test set
    score = pipeline.score(X_test, y_test)
    print(f"Test R^2 Score: {score:.4f}")

if __name__ == "__main__":
    from sklearn.pipeline import Pipeline
    train_pricing_model()
