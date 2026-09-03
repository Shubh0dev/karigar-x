"""
Inference script for the Smart Pricing ML module.

Provides a PricingModel class that loads the saved XGBoost model
and generates price predictions, ranges, and explanations for single inputs.
"""

import os
import joblib
import pandas as pd
import numpy as np

class PricingModel:
    def __init__(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_path = os.path.join(base_dir, "models", "pricing_xgb_model.joblib")
        self.pipeline = None
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path):
            self.pipeline = joblib.load(self.model_path)
            print("Loaded XGBoost pricing model.")
        else:
            print("Warning: Pricing model not found. Call predict() will fail until trained.")

    def is_ready(self) -> bool:
        return self.pipeline is not None

    def predict(self, features: dict) -> dict:
        """
        Predicts fair selling price and returns an explanation.
        """
        if not self.is_ready():
            raise ValueError("Model is not loaded.")

        # Convert to DataFrame
        df = pd.DataFrame([features])
        
        # Ensure all expected columns are present
        expected_cols = [
            "category", "material", "material_cost", "labour_hours", "labour_rate",
            "quality_score", "craftsmanship_complexity", "size_scale", 
            "season_demand_index", "market_reference_price"
        ]
        
        for col in expected_cols:
            if col not in df.columns:
                # Provide sensible defaults for missing numeric features
                if col == "market_reference_price":
                    base = features.get("material_cost", 0) + (features.get("labour_hours", 0) * features.get("labour_rate", 0))
                    df[col] = base * 1.5
                elif col in ["quality_score", "craftsmanship_complexity", "size_scale"]:
                    df[col] = 3.0
                elif col == "season_demand_index":
                    df[col] = 1.0
                elif col in ["material_cost", "labour_hours", "labour_rate"]:
                    df[col] = 0.0

        # Predict
        predicted_price = float(self.pipeline.predict(df)[0])
        
        # Calculate sensible bounds based on typical model variance / market variance (~8%)
        lower_bound = round(predicted_price * 0.92, 2)
        upper_bound = round(predicted_price * 1.08, 2)
        predicted_price = round(predicted_price, 2)

        # Basic feature contribution explanation (simplified)
        base_cost = features.get("material_cost", 0) + (features.get("labour_hours", 0) * features.get("labour_rate", 0))
        margin = (predicted_price - base_cost) / base_cost if base_cost > 0 else 0
        
        explanation = f"Based on your material cost (₹{features.get('material_cost', 0):.0f}) and labour, "
        explanation += f"with a {margin*100:.1f}% estimated value addition for {features.get('category', 'this craft')}."

        return {
            "predicted_price": predicted_price,
            "lower_bound": lower_bound,
            "upper_bound": upper_bound,
            "explanation": explanation
        }

if __name__ == "__main__":
    # Test inference
    model = PricingModel()
    if model.is_ready():
        test_features = {
            "category": "Terracotta & Clay",
            "material": "Natural Alluvial Clay",
            "material_cost": 280,
            "labour_hours": 14,
            "labour_rate": 90,
            "quality_score": 4.5,
            "craftsmanship_complexity": 4,
            "size_scale": 3,
            "season_demand_index": 1.25,
            "market_reference_price": 2500
        }
        res = model.predict(test_features)
        print("Test Prediction:")
        for k, v in res.items():
            print(f"  {k}: {v}")
