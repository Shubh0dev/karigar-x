# KARIGAR X - Smart Pricing ML Module

This directory contains the machine learning components for the AI-driven smart pricing module. The goal of this module is to recommend fair, market-aligned selling prices for artisan handicraft products based on material costs, labor, craftsmanship complexity, and real-time market demand.

## ⚠️ Prototype Disclaimer

> [!WARNING]
> This is a **prototype model** trained on a **curated synthetic dataset**. Because real transactional artisan data is currently unavailable for training, we generate realistic prototype data (`ml/data/generate_data.py`) using known economic formulas (labor rates, complexity premiums, etc.). This ensures the model logic works end-to-end, but it is **not** using real or fabricated government data.

## Architecture

1. **Dataset Generation (`data/generate_data.py`)**: Generates `artisan_pricing_dataset.csv` with realistic handicraft features and target prices.
2. **Training Pipeline (`train.py`)**: Uses `scikit-learn` for preprocessing (OneHotEncoder, StandardScaler) and `XGBoost` for regression. Saves the artifact to `models/pricing_xgb_model.joblib`.
3. **Inference (`predict.py`)**: The `PricingModel` class loads the artifact and provides single-item predictions, along with lower/upper fair market bounds.
4. **Evaluation (`evaluate.py`)**: Reports MAE, RMSE, and R² on test data.

## Usage (Local Training)

To generate data and train the model from scratch:

```bash
# Ensure dependencies are installed
pip install -r ../backend/requirements.txt

# 1. Generate the synthetic dataset
python data/generate_data.py

# 2. Train the XGBoost model
python train.py

# 3. Evaluate the model metrics
python evaluate.py
```

The backend API (`POST /api/pricing/predict`) will automatically load the saved `.joblib` model if it exists, or fall back to a Demo Mode calculation if it does not.
