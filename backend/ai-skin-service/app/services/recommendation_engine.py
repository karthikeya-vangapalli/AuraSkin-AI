from typing import List, Dict, Any, Optional

# Curated Skincare Master Catalog
PRODUCT_CATALOG = [
    # --- CLEANSER ---
    {
        "id": "prod_clean_01",
        "name": "Hydrating Gentle Foaming Cleanser",
        "brand": "CeraVe",
        "category": "Cleanser",
        "price": 14.99,
        "target_skin_types": ["Dry", "Normal", "Sensitive", "Combination"],
        "target_concerns": ["Barrier Damage", "Dryness", "Dehydration", "Redness"],
        "active_ingredients": ["Ceramides NP/AP/EOP", "Hyaluronic Acid", "Niacinamide"],
        "all_ingredients": ["water", "glycerin", "ceramides", "hyaluronic acid", "niacinamide", "phytosphingosine"],
        "is_spf": False,
        "dupe_alternative": {
            "name": "Gentle Skin Cleanser",
            "brand": "Equate Beauty",
            "price": 6.99,
            "savings_percentage": 53.0,
            "key_shared_actives": ["Ceramides", "Hyaluronic Acid"],
            "similarity_reason": "Identical non-stripping ceramide lipid base for sensitive and dry skin."
        }
    },
    {
        "id": "prod_clean_02",
        "name": "Salicylic Acid 2% Renewing SA Cleanser",
        "brand": "CeraVe",
        "category": "Cleanser",
        "price": 16.50,
        "target_skin_types": ["Oily", "Combination", "Acne-Prone"],
        "target_concerns": ["Acne", "Clogged Pores", "Texture", "Blackheads"],
        "active_ingredients": ["Salicylic Acid", "Niacinamide", "Ceramides"],
        "all_ingredients": ["water", "salicylic acid", "niacinamide", "ceramides", "gluconolactone"],
        "is_spf": False,
        "dupe_alternative": {
            "name": "Acne Free Oil-Free 2.5% Cleanser",
            "brand": "AcneFree",
            "price": 8.49,
            "savings_percentage": 48.5,
            "key_shared_actives": ["Salicylic Acid", "Ceramides"],
            "similarity_reason": "BHA micro-foaming formulation that decongests pores without barrier compromise."
        }
    },
    # --- MOISTURIZER ---
    {
        "id": "prod_moist_01",
        "name": "Protini Polypeptide Firming Cream",
        "brand": "Drunk Elephant",
        "category": "Moisturizer",
        "price": 68.00,
        "target_skin_types": ["Normal", "Dry", "Combination", "Aging"],
        "target_concerns": ["Loss of Elasticity", "Fine Lines", "Dehydration", "Dullness"],
        "active_ingredients": ["Signal Peptides", "Pygmy Waterlily", "Folic Acid Ferment", "Amino Acids"],
        "all_ingredients": ["water", "sh-oligopeptide-1", "signal peptides", "amino acids", "glycerin"],
        "is_spf": False,
        "dupe_alternative": {
            "name": "Radically Rejuvenating Whipped Night Cream",
            "brand": "Acure",
            "price": 18.99,
            "savings_percentage": 72.1,
            "key_shared_actives": ["Peptides", "Ferulic Acid", "Amino Acids"],
            "similarity_reason": "Nearly identical peptide multi-complex with deep cellular hydration at a fraction of luxury cost."
        }
    },
    {
        "id": "prod_moist_02",
        "name": "Hydro Boost Water Gel Cream (Fragrance-Free)",
        "brand": "Neutrogena",
        "category": "Moisturizer",
        "price": 19.99,
        "target_skin_types": ["Oily", "Combination", "Sensitive", "Normal"],
        "target_concerns": ["Dehydration", "Oiliness", "Large Pores"],
        "active_ingredients": ["Hyaluronic Acid", "Glycerin", "Dimethicone"],
        "all_ingredients": ["water", "sodium hyaluronate", "glycerin", "dimethicone"],
        "is_spf": False,
        "dupe_alternative": {
            "name": "Hydrating Water Essence Gel",
            "brand": "e.l.f. Skin",
            "price": 12.00,
            "savings_percentage": 40.0,
            "key_shared_actives": ["Hyaluronic Acid", "Squalane"],
            "similarity_reason": "Weightless oil-free hydration matrix that absorbs instantly without greasy residue."
        }
    },
    {
        "id": "prod_moist_03",
        "name": "Cicaplast Baume B5+ Ultra-Repair Barrier Balm",
        "brand": "La Roche-Posay",
        "category": "Moisturizer",
        "price": 17.99,
        "target_skin_types": ["Dry", "Sensitive", "Compromised"],
        "target_concerns": ["Redness", "Barrier Damage", "Severe Dryness", "Irritation"],
        "active_ingredients": ["Madecassoside (Centella)", "Panthenol 5% (B5)", "Zinc Gluconate", "Shea Butter"],
        "all_ingredients": ["water", "panthenol", "madecassoside", "zinc gluconate", "shea butter"],
        "is_spf": False,
        "dupe_alternative": {
            "name": "Cica Daily Soothing Repair Cream",
            "brand": "Purito",
            "price": 13.50,
            "savings_percentage": 25.0,
            "key_shared_actives": ["Centella Asiatica", "Panthenol"],
            "similarity_reason": "Rich restorative barrier replenishment packed with soothing centella and provitamin B5."
        }
    },
    # --- SUNSCREEN (SPF 30+) ---
    {
        "id": "prod_spf_01",
        "name": "Anthelios Melt-in Milk Sunscreen SPF 60",
        "brand": "La Roche-Posay",
        "category": "Sunscreen",
        "price": 25.99,
        "target_skin_types": ["Normal", "Combination", "Dry", "Sensitive"],
        "target_concerns": ["UV Protection", "Sun Spots", "Premature Aging", "Melasma"],
        "active_ingredients": ["Avobenzone", "Homosalate", "Octisalate", "Octocrylene", "Senna Alata Antioxidant"],
        "all_ingredients": ["avobenzone", "octocrylene", "senna alata", "vitamin e", "water"],
        "is_spf": True,
        "dupe_alternative": {
            "name": "Hydro Boost Water Gel Sunscreen SPF 50",
            "brand": "Neutrogena",
            "price": 14.49,
            "savings_percentage": 44.2,
            "key_shared_actives": ["Broad-Spectrum Chemical UV Filters", "Hyaluronic Acid"],
            "similarity_reason": "Non-greasy, ultra-breathable chemical UV shield leaving zero white cast."
        }
    },
    {
        "id": "prod_spf_02",
        "name": "Relief Sun: Rice + Probiotics SPF 50+ PA++++",
        "brand": "Beauty of Joseon",
        "category": "Sunscreen",
        "price": 18.00,
        "target_skin_types": ["Sensitive", "Dry", "Combination", "Acne-Prone"],
        "target_concerns": ["UV Protection", "Redness", "Dehydration", "Dullness"],
        "active_ingredients": ["Rice Extract 30%", "Grain Probiotics Ferment", "Niacinamide"],
        "all_ingredients": ["water", "rice bran extract", "lactobacillus ferment", "niacinamide", "uv filters"],
        "is_spf": True,
        "dupe_alternative": {
            "name": "Madagascar Centella Hyalu-Cica Water-Fit Sun Serum SPF50+",
            "brand": "SKIN1004",
            "price": 13.99,
            "savings_percentage": 22.3,
            "key_shared_actives": ["Centella Asiatica", "Hyaluronic Acid", "Niacinamide"],
            "similarity_reason": "Dewy, weightless serum-like sun protection enriched with barrier-fortifying ferments."
        }
    },
    # --- SERUMS & TREATMENTS ---
    {
        "id": "prod_serum_01",
        "name": "C E Ferulic Combination Antioxidant Serum",
        "brand": "SkinCeuticals",
        "category": "Serum",
        "price": 182.00,
        "target_skin_types": ["Normal", "Dry", "Combination", "Aging"],
        "target_concerns": ["Hyperpigmentation", "Dark Spots", "Fine Lines", "Free Radical Damage"],
        "active_ingredients": ["15% L-Ascorbic Acid (Vitamin C)", "1% Alpha Tocopherol (Vitamin E)", "0.5% Ferulic Acid"],
        "all_ingredients": ["water", "ethoxydiglycol", "l-ascorbic acid", "propylene glycol", "glycerin", "ferulic acid", "tocopherol"],
        "is_spf": False,
        "dupe_alternative": {
            "name": "20% Vitamin C + E Ferulic Acid Serum",
            "brand": "Timeless Skin Care",
            "price": 25.95,
            "savings_percentage": 85.7,
            "key_shared_actives": ["20% L-Ascorbic Acid", "Vitamin E", "Ferulic Acid"],
            "similarity_reason": "Exact golden ratio of pure L-Ascorbic Acid, Tocopherol, and Ferulic Acid formulated at low pH 2.4."
        }
    },
    {
        "id": "prod_serum_02",
        "name": "Skin Perfecting 2% BHA Liquid Exfoliant",
        "brand": "Paula's Choice",
        "category": "Exfoliant",
        "price": 35.00,
        "target_skin_types": ["Oily", "Combination", "Acne-Prone"],
        "target_concerns": ["Acne", "Blackheads", "Enlarged Pores", "Texture"],
        "active_ingredients": ["2% Salicylic Acid (BHA)", "Green Tea Extract", "Methylpropanediol"],
        "all_ingredients": ["water", "methylpropanediol", "butylene glycol", "salicylic acid", "camellia oleifera leaf extract"],
        "is_spf": False,
        "dupe_alternative": {
            "name": "Acne Exfoliating Toner 2% Salicylic Acid",
            "brand": "Peach Slices",
            "price": 10.99,
            "savings_percentage": 68.6,
            "key_shared_actives": ["2% Salicylic Acid", "Cica", "Hyaluronic Acid"],
            "similarity_reason": "Alcohol-free 2% BHA pore clarifier with soothing cica and cucumber extract."
        }
    },
    {
        "id": "prod_serum_03",
        "name": "Retinol 0.5% in Squalane Pure Night Treatment",
        "brand": "The Ordinary",
        "category": "Treatment",
        "price": 9.80,
        "target_skin_types": ["Normal", "Dry", "Combination", "Aging"],
        "target_concerns": ["Fine Lines", "Texture", "Hyperpigmentation", "Loss of Firmness"],
        "active_ingredients": ["0.5% Pure Retinol", "Plant-Derived Squalane", "Jojoba Seed Oil"],
        "all_ingredients": ["squalane", "caprylic triglyceride", "retinol", "solanum lycopersicum extract"],
        "is_spf": False,
        "dupe_alternative": {
            "name": "Retinol 0.3% Anti-Aging Serum",
            "brand": "Good Molecules",
            "price": 8.00,
            "savings_percentage": 18.4,
            "key_shared_actives": ["Retinol", "Bakuchiol", "Squalane"],
            "similarity_reason": "Gentle micro-encapsulated retinoid suspended in soothing botanical squalane."
        }
    },
    {
        "id": "prod_serum_04",
        "name": "Niacinamide 10% + Zinc 1% Blemish Serum",
        "brand": "The Ordinary",
        "category": "Serum",
        "price": 6.50,
        "target_skin_types": ["Oily", "Combination", "Acne-Prone", "Sensitive"],
        "target_concerns": ["Excess Sebum", "Pore Congestion", "Redness", "Blemishes"],
        "active_ingredients": ["10% Niacinamide", "1% Zinc PCA", "Tamarindus Indica Seed Gum"],
        "all_ingredients": ["water", "niacinamide", "zinc pca", "dimethyl isosorbide", "pentylene glycol"],
        "is_spf": False,
        "dupe_alternative": {
            "name": "Niacinamide Clarifying Serum",
            "brand": "Good Molecules",
            "price": 6.00,
            "savings_percentage": 7.7,
            "key_shared_actives": ["10% Niacinamide", "Zinc PCA"],
            "similarity_reason": "Controls overactive sebaceous activity while calming post-inflammatory erythema."
        }
    }
]

CORE_FOUNDATIONAL_STEPS = {
    "cleanser": {
        "step_name": "Cleanser",
        "category": "Cleanser",
        "importance": "Critical",
        "reason": "Foundational first step: Cleansers remove environmental particulate matter, excess sebum, and bacteria without destroying stratum corneum integrity."
    },
    "moisturizer": {
        "step_name": "Moisturizer",
        "category": "Moisturizer",
        "importance": "Critical",
        "reason": "Crucial barrier defense: Restores physiological lipids, seals hydration into the epidermis, and mitigates trans-epidermal water loss (TEWL)."
    },
    "sunscreen": {
        "step_name": "Sunscreen (SPF 30+)",
        "category": "Sunscreen",
        "importance": "Mandatory",
        "reason": "Non-negotiable daily photo-protection: Prevents 80%+ of extrinsic skin aging, cellular DNA mutation, and post-inflammatory dark spots."
    }
}

CONCERN_TO_ACTIVES = {
    "acne": ["Salicylic Acid", "Niacinamide", "Zinc PCA", "Benzoyl Peroxide", "Retinoids"],
    "redness": ["Centella Asiatica", "Panthenol", "Ceramides", "Niacinamide", "Madecassoside"],
    "barrier damage": ["Ceramides", "Panthenol", "Hyaluronic Acid", "Squalane", "Madecassoside"],
    "dryness": ["Hyaluronic Acid", "Ceramides", "Glycerin", "Squalane", "Shea Butter"],
    "dehydration": ["Hyaluronic Acid", "Glycerin", "Panthenol", "Ceramides"],
    "hyperpigmentation": ["Vitamin C", "L-Ascorbic Acid", "Ferulic Acid", "Niacinamide", "Retinol"],
    "dark spots": ["Vitamin C", "Niacinamide", "Retinol", "Ferulic Acid"],
    "texture": ["Salicylic Acid", "Retinol", "Glycolic Acid", "Lactic Acid"],
    "aging": ["Retinol", "Signal Peptides", "Vitamin C", "Ceramides"],
    "loss of elasticity": ["Signal Peptides", "Retinol", "Amino Acids", "Vitamin C"],
    "clogged pores": ["Salicylic Acid", "Niacinamide", "Zinc PCA"]
}

def _normalize_string(s: str) -> str:
    return s.lower().replace("-", " ").replace("_", " ").strip()

def generate_recommendations(
    skin_profile: Dict[str, Any],
    budget_max: float = 0.0,
    preferences: Optional[List[str]] = None,
    current_routine_steps: Optional[List[str]] = None
) -> Dict[str, Any]:
    preferences = preferences or []
    current_routine_steps = current_routine_steps or []
    
    skin_type = _normalize_string(skin_profile.get("skin_type", "normal"))
    user_concerns = [_normalize_string(c) for c in skin_profile.get("skin_concerns", [])]
    user_allergies = [_normalize_string(a) for a in skin_profile.get("allergies", [])]

    # Target Actives aggregated from user concerns
    target_actives = set()
    for concern in user_concerns:
        for c_key, actives in CONCERN_TO_ACTIVES.items():
            if c_key in concern or concern in c_key:
                for act in actives:
                    target_actives.add(_normalize_string(act))
    
    if not target_actives:
        target_actives = {"ceramides", "hyaluronic acid", "niacinamide", "sunscreen"}

    scored_products: List[Dict[str, Any]] = []

    for prod in PRODUCT_CATALOG:
        # 1. Budget Filter
        if budget_max and budget_max > 0:
            if prod["price"] > budget_max:
                if not (prod.get("dupe_alternative") and prod["dupe_alternative"]["price"] <= budget_max):
                    continue

        # 2. Allergy Filter
        has_allergen = False
        for allergen in user_allergies:
            if not allergen:
                continue
            for ing in prod["all_ingredients"]:
                if allergen in _normalize_string(ing):
                    has_allergen = True
                    break
            if has_allergen:
                break
        if has_allergen:
            continue

        # 3. Calculate Suitability Score:
        prod_actives_norm = [_normalize_string(act) for act in prod["active_ingredients"]]
        
        matches = 0
        match_reasons = []
        for target in target_actives:
            for p_act in prod_actives_norm:
                if target in p_act or p_act in target:
                    matches += 1
                    match_reasons.append(f"Contains target active '{p_act.title()}' to address your skin concerns.")
                    break

        base_score = (matches / len(target_actives)) * 100.0 if target_actives else 50.0

        # Adjust score for Skin Type compatibility
        skin_types_norm = [_normalize_string(st) for st in prod["target_skin_types"]]
        if skin_type in skin_types_norm or "all" in skin_types_norm:
            base_score += 25.0
            match_reasons.append(f"Clinically formulated for your {skin_type.title()} skin type profile.")
        else:
            base_score -= 15.0

        # Adjust score for matching concerns directly
        prod_concerns_norm = [_normalize_string(c) for c in prod["target_concerns"]]
        concern_matches = 0
        for uc in user_concerns:
            for pc in prod_concerns_norm:
                if uc in pc or pc in uc:
                    concern_matches += 1
                    match_reasons.append(f"Targets concern: {pc.title()}.")
                    break
        base_score += min(concern_matches * 12.0, 30.0)

        final_score = max(10.0, min(99.0, base_score))

        price_inr = round(prod["price"] * 84.8)
        dupe = prod.get("dupe_alternative")
        if dupe:
            dupe_inr = round(dupe["price"] * 84.8)
            dupe = {
                **dupe,
                "price_inr": dupe_inr,
                "price_inr_formatted": f"₹{dupe_inr:,}"
            }

        scored_products.append({
            "id": prod["id"],
            "name": prod["name"],
            "brand": prod["brand"],
            "category": prod["category"],
            "price": prod["price"],
            "price_inr": price_inr,
            "price_inr_formatted": f"₹{price_inr:,}",
            "suitability_score": round(final_score, 1),
            "match_reasons": match_reasons[:4],
            "key_actives": prod["active_ingredients"],
            "is_spf": prod["is_spf"],
            "dupe_alternative": dupe
        })

    scored_products.sort(key=lambda p: p["suitability_score"], reverse=True)

    # 4. Routine Gap Filler
    current_norm_steps = [_normalize_string(s) for s in current_routine_steps]
    routine_gaps: List[Dict[str, Any]] = []

    for gap_key, gap_info in CORE_FOUNDATIONAL_STEPS.items():
        has_step = any(gap_key in s or s in gap_key for s in current_norm_steps)
        if not has_step:
            cat_recs = [p for p in scored_products if p["category"] == gap_info["category"]]
            if not cat_recs:
                for prod in PRODUCT_CATALOG:
                    if prod["category"] == gap_info["category"]:
                        p_inr = round(prod["price"] * 84.8)
                        d_alt = prod.get("dupe_alternative")
                        if d_alt:
                            d_inr = round(d_alt["price"] * 84.8)
                            d_alt = {**d_alt, "price_inr": d_inr, "price_inr_formatted": f"₹{d_inr:,}"}
                        cat_recs.append({
                            "id": prod["id"],
                            "name": prod["name"],
                            "brand": prod["brand"],
                            "category": prod["category"],
                            "price": prod["price"],
                            "price_inr": p_inr,
                            "price_inr_formatted": f"₹{p_inr:,}",
                            "suitability_score": 85.0,
                            "match_reasons": [f"Essential foundational {gap_info['step_name']}."],
                            "key_actives": prod["active_ingredients"],
                            "is_spf": prod["is_spf"],
                            "dupe_alternative": d_alt
                        })
            routine_gaps.append({
                "missing_step": gap_info["step_name"],
                "importance": gap_info["importance"],
                "reason": gap_info["reason"],
                "recommended_products": cat_recs[:2]
            })

    # 5. Ingredient Safety & Conflict Screening on Recommended Actives
    from app.services.ingredient_engine import analyze_routine_compatibility
    all_recs_actives = []
    for sp in scored_products[:4]:
        all_recs_actives.extend(sp.get("key_actives", []))
    safety_analysis = analyze_routine_compatibility(all_recs_actives, user_allergies=user_allergies)

    summary = (
        f"Generated {len(scored_products)} tailored product recommendations with {len(routine_gaps)} foundational routine gap alerts."
    )

    return {
        "recommended_products": scored_products,
        "routine_gaps": routine_gaps,
        "total_recommendations": len(scored_products),
        "ingredient_safety_analysis": safety_analysis,
        "summary": summary
    }
