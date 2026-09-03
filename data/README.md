# KARIGAR X - Prototype Data & Schemas
> **Artisan Profiles, Craft Datasets & Product Catalog Fixtures**

This directory stores prototype data schemas, JSON fixtures, and benchmark datasets for marginalized artisans and traditional Indian handicraft products.

---

## 📊 Data Entities & Schemas

### 1. Artisan Profile (`artisan_profile.json`)
```json
{
  "artisan_id": "ART-1001",
  "name": "Ramesh Swarnakar",
  "craft_category": "Terracotta & Pottery",
  "region": "Bankura, West Bengal",
  "experience_years": 18,
  "language_preference": "Bengali",
  "contact_phone": "+91-9876543210",
  "verifications": ["Aadhaar Verified", "Artisan Card Holder"]
}
```

### 2. Product Catalog Item (`product_catalog.json`)
```json
{
  "product_id": "PRD-5001",
  "artisan_id": "ART-1001",
  "title": "Handcrafted Bankura Terracotta Horse",
  "category": "Pottery",
  "dimensions": { "height_cm": 35, "weight_kg": 1.2 },
  "materials_used": ["Clay", "Natural Pigment"],
  "material_cost_inr": 250,
  "labor_hours": 12,
  "suggested_fair_price_inr": 1450,
  "status": "Available",
  "images": ["/assets/terracotta_horse_1.jpg"]
}
```

### 3. Pricing Benchmark Data (`pricing_benchmarks.json`)
Contains aggregated market price ranges across craft clusters (e.g., Jaipur Blue Pottery, Pochampally Ikat, Bastar Dhokra Art) to train and validate the XGBoost pricing model.

---

## 🔒 Privacy & Local Execution Notice
- All data stored here during prototyping is mock/fixture data.
- No personal identifiable information (PII) or real API keys are required.
