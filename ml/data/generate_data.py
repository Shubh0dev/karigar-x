"""
Generates a prototype synthetic dataset for artisan handicraft fair pricing.

NOTE: This dataset is synthetically generated using realistic artisan economic formulas
(material cost, labor hours/rate, craftsmanship complexity grade, quality score, demand index)
for prototype ML training in KARIGAR X.
"""

import os
import numpy as np
import pandas as pd

# Define categories and corresponding materials
CATEGORIES_MATERIALS = {
    "Terracotta & Clay": ["Natural Alluvial Clay", "Terracotta Red Clay", "Black Clay"],
    "Blue Pottery & Ceramics": ["Quartz Powder Frit", "Ceramic Glaze", "Porcelain Clay"],
    "Dhokra & Brass Craft": ["Recycled Bell Metal Brass", "Bronze Alloy", "Copper Brass Blend"],
    "Carved Woodwork": ["Seasoned Teakwood", "Sheesham Wood", "Rosewood"],
    "Handloom Textiles": ["Handspun Cotton", "Mulberry Silk", "Chanderi Cotton-Silk"],
    "Folk Paintings": ["Handmade Vasli Paper", "Cotton Canvas", "Tussar Silk Fabric"],
}


def generate_artisan_pricing_dataset(num_samples: int = 1200, random_seed: int = 42) -> pd.DataFrame:
    np.random.seed(random_seed)

    categories = list(CATEGORIES_MATERIALS.keys())
    data = []

    for _ in range(num_samples):
        cat = np.random.choice(categories)
        mat = np.random.choice(CATEGORIES_MATERIALS[cat])

        # Feature distributions aligned with real handicraft artisan metrics
        material_cost = round(float(np.random.uniform(80, 2500)), 2)
        labour_hours = round(float(np.random.uniform(3, 80)), 1)
        labour_rate = round(float(np.random.choice([70, 85, 100, 120, 150, 180, 200])), 2)
        quality_score = round(float(np.random.uniform(2.5, 5.0)), 1)
        craftsmanship_complexity = int(np.random.randint(1, 6))  # 1 to 5
        size_scale = int(np.random.randint(1, 6))  # 1 to 5
        season_demand_index = round(float(np.random.uniform(0.9, 1.4)), 2)

        # Calculate a realistic base cost
        labor_cost = labour_hours * labour_rate
        base_cost = material_cost + labor_cost

        # Market reference price estimate
        category_multiplier = {
            "Terracotta & Clay": 1.25,
            "Blue Pottery & Ceramics": 1.40,
            "Dhokra & Brass Craft": 1.55,
            "Carved Woodwork": 1.45,
            "Handloom Textiles": 1.50,
            "Folk Paintings": 1.60,
        }[cat]

        market_reference_price = round(
            base_cost * category_multiplier * (1 + 0.05 * craftsmanship_complexity), 2
        )

        # True fair selling price with non-linear factors + noise
        complexity_margin = 1.0 + (craftsmanship_complexity * 0.06) + ((quality_score - 2.5) * 0.08)
        fair_price_raw = (base_cost * complexity_margin * season_demand_index) + (market_reference_price * 0.10)
        
        # Add 3% random market noise
        noise = np.random.normal(0, 0.03 * fair_price_raw)
        selling_price = round(max(base_cost * 1.15, fair_price_raw + noise), 2)

        data.append({
            "category": cat,
            "material": mat,
            "material_cost": material_cost,
            "labour_hours": labour_hours,
            "labour_rate": labour_rate,
            "quality_score": quality_score,
            "craftsmanship_complexity": craftsmanship_complexity,
            "size_scale": size_scale,
            "season_demand_index": season_demand_index,
            "market_reference_price": market_reference_price,
            "selling_price": selling_price,
        })

    df = pd.DataFrame(data)
    return df


if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(out_dir, exist_ok=True)
    csv_path = os.path.join(out_dir, "artisan_pricing_dataset.csv")

    df = generate_artisan_pricing_dataset()
    df.to_csv(csv_path, index=False)
    print(f"Generated prototype pricing dataset with {len(df)} records at {csv_path}")
    print(df.head())
