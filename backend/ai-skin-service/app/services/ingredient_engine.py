import re
from typing import List, Dict, Any, Optional

# Ingredient Alias mappings to Canonical Actives
INGREDIENT_FAMILIES = {
    "retinoid": [
        "retinol", "retinal", "retinaldehyde", "tretinoin", "adapalene",
        "tazarotene", "granactive retinoid", "hydroxypinacolone retinoate", "retinyl palmitate"
    ],
    "aha": [
        "glycolic acid", "lactic acid", "mandelic acid", "citric acid",
        "malic acid", "tartaric acid", "aha"
    ],
    "bha": [
        "salicylic acid", "betaine salicylate", "salix alba", "willow bark extract", "bha"
    ],
    "vitamin_c": [
        "vitamin c", "l-ascorbic acid", "ascorbic acid", "ascorbyl glucoside",
        "sodium ascorbyl phosphate", "magnesium ascorbyl phosphate",
        "ethyl ascorbic acid", "tetrahexyldecyl ascorbate"
    ],
    "benzoyl_peroxide": [
        "benzoyl peroxide", "bpo"
    ],
    "niacinamide": [
        "niacinamide", "nicotinamide", "vitamin b3"
    ],
    "copper_peptides": [
        "copper tripeptide", "copper peptide", "ghk-cu"
    ],
    "hydroquinone": [
        "hydroquinone", "arbutin", "alpha arbutin"
    ],
    "hyaluronic_acid": [
        "hyaluronic acid", "sodium hyaluronate", "hydrolyzed hyaluronic acid"
    ],
    "ceramides": [
        "ceramide", "ceramide np", "ceramide ap", "ceramide eop", "phytosphingosine"
    ],
    "centella": [
        "centella asiatica", "cica", "madecassoside", "asiaticoside"
    ],
    "sunscreen": [
        "spf", "sunscreen", "zinc oxide", "titanium dioxide", "avobenzone",
        "octinoxate", "octocrylene", "tinosorb", "mexoryl"
    ]
}

# Photosensitizing Actives requiring mandatory SPF
PHOTOSENSITIZING_FAMILIES = {"retinoid", "aha", "hydroquinone", "benzoyl_peroxide"}

# Known Incompatibility Rules: (Family A, Family B) -> (Severity, Warning, Recommendation)
CONFLICT_RULES = [
    (
        "retinoid", "aha",
        "High",
        "Combining Retinoids with AHAs increases trans-epidermal water loss, causes severe skin irritation, peeling, and barrier destruction.",
        "Alternate usage: Apply AHA 1-2 nights per week, and use Retinoids on non-AHA evenings."
    ),
    (
        "retinoid", "bha",
        "High",
        "Layering Retinoid with Salicylic Acid (BHA) strips lipid moisture barriers and induces excessive dryness, flaking, and sensitization.",
        "Use Salicylic Acid in AM or alternate nights; dedicate Retinoids strictly to PM routines."
    ),
    (
        "retinoid", "benzoyl_peroxide",
        "High",
        "Benzoyl Peroxide oxidizes standard Retinol and Tretinoin, deactivating their anti-aging benefits and triggering severe redness.",
        "Use Benzoyl Peroxide in the morning as spot treatment and Retinol at night."
    ),
    (
        "benzoyl_peroxide", "vitamin_c",
        "Moderate",
        "Benzoyl Peroxide oxidizes L-Ascorbic Acid (Vitamin C), neutralizing antioxidant protection and triggering erythema.",
        "Apply Vitamin C in the AM under sunscreen and Benzoyl Peroxide in the PM."
    ),
    (
        "niacinamide", "vitamin_c",
        "Mild",
        "Directly co-applying pure acidic L-Ascorbic Acid with Niacinamide may induce temporary facial flushing in sensitive skin.",
        "Layer Vitamin C first, wait 10-15 minutes, or separate Vitamin C (AM) and Niacinamide (PM)."
    ),
    (
        "copper_peptides", "vitamin_c",
        "Moderate",
        "Low pH direct acids and pure Vitamin C can oxidize copper ions and break down sensitive peptide bonds.",
        "Use Copper Peptides in AM/recovery nights and pure Vitamin C at separate times."
    ),
    (
        "copper_peptides", "aha",
        "Moderate",
        "Strong direct Alpha Hydroxy Acids degrade copper tripeptides and diminish regenerative efficacy.",
        "Alternate days or use Peptides in AM and AHAs in PM."
    ),
    (
        "copper_peptides", "bha",
        "Moderate",
        "Salicylic acid formulations destabilize copper peptide bonds.",
        "Alternate usage between AM and PM routines."
    ),
    (
        "aha", "bha",
        "Moderate",
        "Layering separate high-strength AHA and BHA serums causes aggressive exfoliation and compromised stratum corneum.",
        "Choose a single balanced multi-acid product or alternate exfoliation nights (max 2-3x/week total)."
    )
]

def _match_family(raw_name: str) -> Optional[str]:
    raw_lower = raw_name.lower().strip()
    for fam, aliases in INGREDIENT_FAMILIES.items():
        for alias in aliases:
            if alias in raw_lower or raw_lower in alias:
                return fam
    return None

def check_ingredient_conflicts(
    ingredients: List[str],
    user_allergies: Optional[List[str]] = None
) -> Dict[str, Any]:
    user_allergies = user_allergies or []
    detected_families: Dict[str, str] = {}

    for ing in ingredients:
        fam = _match_family(ing)
        if fam:
            detected_families[fam] = ing

    # 1. Detect Conflicts
    conflicts: List[Dict[str, Any]] = []
    seen_pairs = set()

    for fam1, fam2, severity, warning, rec in CONFLICT_RULES:
        if fam1 in detected_families and fam2 in detected_families:
            pair_key = tuple(sorted([fam1, fam2]))
            if pair_key not in seen_pairs:
                seen_pairs.add(pair_key)
                conflicts.append({
                    "ingredient_1": detected_families[fam1],
                    "ingredient_2": detected_families[fam2],
                    "severity": severity,
                    "warning": warning,
                    "recommendation": rec
                })

    # 2. Allergy Screening
    allergens_found: List[str] = []
    for allergy in user_allergies:
        allergy_clean = allergy.lower().strip()
        if not allergy_clean:
            continue
        for ing in ingredients:
            ing_lower = ing.lower()
            if allergy_clean in ing_lower or ing_lower in allergy_clean:
                allergens_found.append(f"{ing} (matches allergy: {allergy})")

    # 3. Photosensitivity & SPF Enforcement
    spf_required = False
    photosensitivity_warnings: List[str] = []
    for fam in PHOTOSENSITIZING_FAMILIES:
        if fam in detected_families:
            spf_required = True
            photosensitivity_warnings.append(
                f"Photosensitizing active '{detected_families[fam]}' increases UV susceptibility. Broad-spectrum SPF 30+ is mandatory daily."
            )

    # 4. Usage Frequency Caps
    frequency_caps: List[Dict[str, str]] = []
    if "retinoid" in detected_families:
        frequency_caps.append({
            "ingredient": detected_families["retinoid"],
            "max_frequency": "2-3x per week (PM only for beginners)",
            "guidance": "Start slowly with buffer/sandwich moisturization method. Increase frequency gradually as tolerance builds."
        })
    if "aha" in detected_families:
        frequency_caps.append({
            "ingredient": detected_families["aha"],
            "max_frequency": "2-3x per week (PM only)",
            "guidance": "Do not combine with other strong acids or physical scrubs. Always follow with lipid barrier moisturizer."
        })
    if "bha" in detected_families:
        frequency_caps.append({
            "ingredient": detected_families["bha"],
            "max_frequency": "2-3x per week",
            "guidance": "Target oily/congested T-zone areas. Avoid consecutive multi-acid layering."
        })
    if "benzoyl_peroxide" in detected_families:
        frequency_caps.append({
            "ingredient": detected_families["benzoyl_peroxide"],
            "max_frequency": "Once daily or spot treatment",
            "guidance": "Apply directly on blemishes. Can cause bleaching of fabrics and localized dryness."
        })

    # 5. AM/PM Split Suggestions
    am_actives: List[str] = []
    pm_actives: List[str] = []
    guidance: List[str] = []

    pm_heavy = {"retinoid", "aha", "bha", "benzoyl_peroxide"}
    am_preferred = {"vitamin_c", "sunscreen", "hyaluronic_acid", "ceramides", "centella"}

    for fam, orig in detected_families.items():
        if fam in pm_heavy:
            pm_actives.append(orig)
        elif fam in am_preferred:
            am_actives.append(orig)
        else:
            if fam == "niacinamide" and "vitamin_c" in detected_families:
                pm_actives.append(orig)
            elif fam == "copper_peptides" and "aha" in detected_families:
                am_actives.append(orig)
            else:
                am_actives.append(orig)
                pm_actives.append(orig)

    if spf_required and "sunscreen" not in detected_families:
        am_actives.append("Broad-Spectrum SPF 30+ (Mandatory)")
        guidance.append("Added mandatory broad-spectrum SPF 30+ to AM routine to safeguard against photosensitizing actives.")

    if conflicts:
        guidance.append(f"Separated {len(conflicts)} conflicting active ingredient pairs between AM and PM routines to prevent skin irritation.")
    else:
        guidance.append("No critical chemical incompatibilities detected. Regimen distribution is balanced.")

    # 6. Overall Safety determination
    has_high_conflicts = any(c["severity"] == "High" for c in conflicts)
    is_safe = (not has_high_conflicts) and (len(allergens_found) == 0)

    summary = (
        "Routine contains critical chemical conflicts or allergens. Action required."
        if not is_safe
        else "Ingredients are compatible with standard AM/PM distribution."
    )

    return {
        "is_safe": is_safe,
        "conflicts": conflicts,
        "allergens_found": allergens_found,
        "am_pm_split_suggestion": {
            "am": am_actives,
            "pm": pm_actives,
            "guidance": guidance
        },
        "spf_required": spf_required,
        "photosensitivity_warnings": photosensitivity_warnings,
        "frequency_caps": frequency_caps,
        "summary": summary
    }

# Alias for compatibility with routine analysis callers
analyze_routine_compatibility = check_ingredient_conflicts
