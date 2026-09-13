"""
Pricing service for KARIGAR X backend.

Wraps the XGBoost pricing ML module. If the model artifact is not found,
falls back to a Demo Mode calculation using the same heuristic formulas
as the training dataset.
"""

import sys
import os
import logging
from pydantic import BaseModel
from typing import List

logger = logging.getLogger(__name__)

from pathlib import Path

# Add the ml/ directory to path using Path(__file__).resolve()
current_file = Path(__file__).resolve()
services_dir = current_file.parent
backend_dir = services_dir.parent
project_root = backend_dir.parent

candidate_ml_dirs = [
    project_root / "ml",
    backend_dir / "ml",
    backend_dir.parent / "ml",
    Path.cwd() / "ml",
]

for candidate_dir in candidate_ml_dirs:
    if candidate_dir.is_dir() and str(candidate_dir) not in sys.path:
        sys.path.insert(0, str(candidate_dir))

try:
    from predict import PricingModel
    _pricing_model = PricingModel()
    if not _pricing_model.is_ready():
        for fallback_model in [
            backend_dir / "models" / "pricing_xgb_model.joblib",
            project_root / "ml" / "models" / "pricing_xgb_model.joblib",
        ]:
            if fallback_model.is_file():
                _pricing_model = PricingModel(model_path=str(fallback_model))
                if _pricing_model.is_ready():
                    break
    if _pricing_model.is_ready():
        logger.info(f"PricingModel loaded successfully from {_pricing_model.model_path}.")
    else:
        logger.warning("PricingModel not ready. Pricing service will fall back to demo mode.")
except ImportError as e:
    logger.warning(f"Could not import ML pricing model: {e}")
    _pricing_model = None

class PricingRequest(BaseModel):
    category: str
    material: str
    material_cost: float
    labour_hours: float
    labour_rate: float
    quality_score: float = 3.0
    craftsmanship_complexity: int = 3
    size_scale: int = 3
    season_demand_index: float = 1.0
    market_reference_price: float = 0.0

class FairPriceBreakdown(BaseModel):
    material_cost: float
    labor_cost: float
    craftsmanship_premium: float
    demand_adjustment: float

class PricingResponse(BaseModel):
    predicted_price: float
    lower_bound: float
    upper_bound: float
    fair_price_breakdown: FairPriceBreakdown
    top_contributing_factors: List[str]
    explanation: str
    is_demo: bool = False

def calculate_demo_price(req: PricingRequest) -> PricingResponse:
    """Fallback calculation mimicking the ML ground-truth data generation formula."""
    base_cost = req.material_cost + (req.labour_hours * req.labour_rate)
    complexity_margin = 1.0 + (req.craftsmanship_complexity * 0.06) + ((req.quality_score - 2.5) * 0.08)
    
    mrp = req.market_reference_price
    if mrp <= 0:
        mrp = base_cost * 1.5
        
    fair_price = (base_cost * complexity_margin * req.season_demand_index) + (mrp * 0.10)
    
    # Calculate breakdown
    labor_cost = req.labour_hours * req.labour_rate
    craft_prem = (base_cost * (complexity_margin - 1.0))
    demand_adj = (base_cost * complexity_margin) * (req.season_demand_index - 1.0)
    
    lower_bound = round(fair_price * 0.92, 2)
    upper_bound = round(fair_price * 1.08, 2)
    predicted_price = round(fair_price, 2)
    
    explanation = f"DEMO MODE: Based on your material cost (₹{req.material_cost:.0f}) and labour, with a {round((complexity_margin-1)*100)}% premium for craftsmanship."

    return PricingResponse(
        predicted_price=predicted_price,
        lower_bound=lower_bound,
        upper_bound=upper_bound,
        fair_price_breakdown=FairPriceBreakdown(
            material_cost=req.material_cost,
            labor_cost=labor_cost,
            craftsmanship_premium=round(craft_prem, 2),
            demand_adjustment=round(demand_adj, 2)
        ),
        top_contributing_factors=["Labor Cost", "Craftsmanship Complexity", "Material Cost"],
        explanation=explanation,
        is_demo=True
    )

def predict_fair_price(req: PricingRequest) -> PricingResponse:
    """Uses ML model if available, otherwise Demo Mode."""
    if _pricing_model is None or not _pricing_model.is_ready():
        return calculate_demo_price(req)
        
    try:
        features = req.model_dump()
        ml_result = _pricing_model.predict(features)
        
        # Calculate sensible breakdowns since XGBoost only outputs the final price
        base_cost = req.material_cost + (req.labour_hours * req.labour_rate)
        labor_cost = req.labour_hours * req.labour_rate
        total_premium = ml_result["predicted_price"] - base_cost
        
        # Distribute premium between craftsmanship and demand
        demand_adj = base_cost * (req.season_demand_index - 1.0) if req.season_demand_index > 1.0 else 0
        craft_prem = total_premium - demand_adj
        if craft_prem < 0:
            craft_prem = 0
            
        return PricingResponse(
            predicted_price=ml_result["predicted_price"],
            lower_bound=ml_result["lower_bound"],
            upper_bound=ml_result["upper_bound"],
            fair_price_breakdown=FairPriceBreakdown(
                material_cost=req.material_cost,
                labor_cost=labor_cost,
                craftsmanship_premium=round(craft_prem, 2),
                demand_adjustment=round(demand_adj, 2)
            ),
            top_contributing_factors=["Labor Cost", "Craftsmanship Complexity", "Market Demand"],
            explanation=ml_result["explanation"],
            is_demo=False
        )
    except Exception as e:
        logger.error(f"ML prediction failed: {e}. Falling back to demo.")
        return calculate_demo_price(req)
