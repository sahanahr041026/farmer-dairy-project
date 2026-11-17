import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.security import get_current_admin, get_current_user_payload

router = APIRouter(prefix="/cattle", tags=["Cattle Care & Reminders"])

# =====================================================================
# Curated Indian Dairy Breed Advisory Catalog
# =====================================================================
BREED_ADVISORY: List[Dict[str, Any]] = [
    {
        "id": "gir",
        "name": "Gir",
        "name_kn": "ಗಿರ್",
        "category": "indigenous_cow",
        "origin": "Gujarat (Saurashtra region), widely adapted in Karnataka",
        "avg_yield_litres": "12 – 16 L/day",
        "fat_content": "4.4% – 4.9%",
        "snf_content": "8.6% – 9.0%",
        "heat_tolerance": "Excellent (High heat & humidity tolerance)",
        "description": "Premier indigenous Indian Zebu dairy breed. Recognizable by its distinctive broad convex forehead ('half-moon' brow) and pendulous spiral ears. Produces nutritious A2 beta-casein rich milk with calm temperament.",
        "description_kn": "ಭಾರತದ ಪ್ರಮುಖ ದೇಶಿ ತಳಿ. ವಿಶಿಷ್ಟ ಉಬ್ಬಿದ ಹಣೆಯ ಆಕಾರ ಮತ್ತು ನೇತಾಡುವ ಕಿವಿಗಳು ಇವುಗಳ ಗುರುತು. ಉತ್ತಮ ರೋಗ ನಿರೋಧಕ ಶಕ್ತಿ ಹೊಂದಿದ್ದು, ಅಧಿಕ ಪೌಷ್ಟಿಕಾಂಶಯುಕ್ತ A2 ಹಾಲು ನೀಡುತ್ತವೆ.",
        "feeding_guide": {
            "green_fodder": "20 – 25 kg daily (Hybrid Napier, CO-4, Sorghum)",
            "dry_fodder": "4 – 5 kg daily (Ragi straw or Paddy straw for fiber)",
            "concentrate": "1 kg maintenance + 400g per litre of milk produced",
            "mineral_mix": "50g daily mixed with evening feed"
        },
        "feeding_guide_kn": {
            "green_fodder": "ದಿನಕ್ಕೆ 20-25 ಕೆಜಿ ಹಸಿರು ಮೇವು (ನೇಪಿಯರ್, ಜೋಳ)",
            "dry_fodder": "ದಿನಕ್ಕೆ 4-5 ಕೆಜಿ ಒಣ ರಾಗಿ ಅಥವಾ ಭತ್ತದ ಹುಲ್ಲು",
            "concentrate": "1 ಕೆಜಿ ಶರೀರ ರಕ್ಷಣೆಗೆ + ಪ್ರತಿ ಲೀಟರ್ ಹಾಲಿಗೆ 400 ಗ್ರಾಂ ಹಿಂಡಿ",
            "mineral_mix": "ದಿನಕ್ಕೆ 50 ಗ್ರಾಂ ಖನಿಜ ಮಿಶ್ರಣ"
        },
        "care_tips": [
            "Provide dry bedding and daily brushing to prevent tick infestation.",
            "Allows open grazing without digestive distress.",
            "Natural resistance to tropical diseases like Theileriosis and Mastitis."
        ],
        "care_tips_kn": [
            "ಉಣ್ಣೆ ಬಾಧೆ ತಡೆಯಲು ಕೊಟ್ಟಿಗೆಯನ್ನು ಒಣದಾಗಿ ಇರಿಸಿ ನಿಯಮಿತವಾಗಿ ಮೈ ತಿಕ್ಕಿ.",
            "ಮೇಯಿಸಲು ಹೆಚ್ಚು ಸೂಕ್ತವಾದ ಶಾಂತ ಸ್ವಭಾವದ ಹಸುಗಳು.",
            "ಕೆಚ್ಚಲು ಬಾವು ಮತ್ತು ಉಣ್ಣೆ ಜ್ವರಕ್ಕೆ ನೈಸರ್ಗಿಕ ರೋಗನಿರೋಧಕ ಶಕ್ತಿ ಹೊಂದಿದೆ."
        ],
        "suitability": "Ideal for smallholders, semi-intensive grazing, and natural/organic dairy farming."
    },
    {
        "id": "murrah",
        "name": "Murrah Buffalo",
        "name_kn": "ಮುರ್ರಾ ಎಮ್ಮೆ",
        "category": "buffalo",
        "origin": "Haryana / Punjab, highly successful across Southern India",
        "avg_yield_litres": "10 – 16 L/day",
        "fat_content": "7.0% – 8.5%",
        "snf_content": "9.0% – 9.5%",
        "heat_tolerance": "Moderate (Requires wallowing or shade/water sprays in summer)",
        "description": "The gold standard of dairy buffaloes worldwide. Jet black body with tightly curled horns. Known for very high milk fat and total solids, commanding premium cooperative rates.",
        "description_kn": "ಪ್ರಪಂಚದ ಶ್ರೇಷ್ಠ ಎಮ್ಮೆ ತಳಿ. ಜೆಟ್ ಬ್ಲಾಕ್ ಕಪ್ಪು ಬಣ್ಣ ಮತ್ತು ಉಂಗುರಾಕಾರದ ಸುರುಳಿ ಕೊಂಬುಗಳು. ಅತಿ ಹೆಚ್ಚು ಫ್ಯಾಟ್ (7.0 - 8.5%) ಅಂಶವಿರುವ ಹಾಲು ನೀಡುವುದರಿಂದ ಸಹಕಾರ ಸಂಘದಲ್ಲಿ ಅತಿ ಹೆಚ್ಚಿನ ದರ ದೊರೆಯುತ್ತದೆ.",
        "feeding_guide": {
            "green_fodder": "25 – 30 kg daily (Maize, Napier, Berseem)",
            "dry_fodder": "6 – 8 kg daily (high fiber needed to sustain high milk fat)",
            "concentrate": "1.5 kg maintenance + 500g per litre of milk",
            "mineral_mix": "60 – 70g daily (essential for reproductive cycling)"
        },
        "feeding_guide_kn": {
            "green_fodder": "ದಿನಕ್ಕೆ 25-30 ಕೆಜಿ ಹಸಿರು ಮೇವು (ಮೆಕ್ಕೆಜೋಳ, ನೇಪಿಯರ್)",
            "dry_fodder": "ದಿನಕ್ಕೆ 6-8 ಕೆಜಿ ಒಣ ಮೇವು (ಫ್ಯಾಟ್ ಹೆಚ್ಚಿಸಲು ಅಗತ್ಯ)",
            "concentrate": "1.5 ಕೆಜಿ ದೇಹ ನಿರ್ವಹಣೆಗೆ + ಪ್ರತಿ ಲೀಟರ್ ಹಾಲಿಗೆ 500 ಗ್ರಾಂ ಹಿಂಡಿ",
            "mineral_mix": "ದಿನಕ್ಕೆ 60-70 ಗ್ರಾಂ ಖನಿಜ ಮಿಶ್ರಣ"
        },
        "care_tips": [
            "Summer Cooling: Water hose shower twice daily (morning & afternoon) or access to a clean wallowing tank.",
            "Watch out for silent heat during night hours; observe mucus discharge closely.",
            "Keep calf suckling or stimulate milk let-down gently."
        ],
        "care_tips_kn": [
            "ಬೇಸಿಗೆಯಲ್ಲಿ ದಿನಕ್ಕೆ 2 ಬಾರಿ ನೀರಿನಿಂದ ತೊಳೆಯಿರಿ ಅಥವಾ ನೆರಳಿನ ವ್ಯವಸ್ಥೆ ಮಾಡಿ.",
            "ಮೂಕ ಮದ (Silent Heat) ಲಕ್ಷಣಗಳನ್ನು ಸೂಕ್ಷ್ಮವಾಗಿ ಗಮನಿಸಿ ಕೃತಕ ಗರ್ಭಧಾರಣೆ ಮಾಡಿಸಿ.",
            "ಹಾಲು ಕರೆಯುವ ಮುನ್ನ ಶಾಂತ ವಾತಾವರಣ ಕಲ್ಪಿಸಿ."
        ],
        "suitability": "Exceptional commercial profitability due to high fat milk payout and strong calf value."
    },
    {
        "id": "jersey_cross",
        "name": "Jersey Cross",
        "name_kn": "ಜರ್ಸಿ ಕ್ರಾಸ್",
        "category": "exotic_cross",
        "origin": "Jersey island origin crossed with Indian indigenous cattle",
        "avg_yield_litres": "14 – 20 L/day",
        "fat_content": "4.5% – 5.2%",
        "snf_content": "8.7% – 9.1%",
        "heat_tolerance": "Good (Better heat tolerance than HF)",
        "description": "Medium-sized compact dairy cow with brown/fawn coat. Renowned for early sexual maturity, high feed conversion efficiency, ease of calving, and rich yellow butterfat milk.",
        "description_kn": "ಮಧ್ಯಮ ಗಾತ್ರದ ಕಂದು ಬಣ್ಣದ ಹಸು. ಕಡಿಮೆ ಆಹಾರದಲ್ಲಿ ಹೆಚ್ಚು ಹಾಲು ಉತ್ಪಾದಿಸುವ ಸಾಮರ್ಥ್ಯ. ಮೊದಲ ಕರು ಬೇಗ ಹಾಕುತ್ತದೆ ಮತ್ತು ಹಾಲಿನಲ್ಲಿ ಉತ್ತಮ ಹಳದಿ ಜಿಡ್ಡು (Butterfat) ಇರುತ್ತದೆ.",
        "feeding_guide": {
            "green_fodder": "20 – 25 kg daily (Legume + non-legume mix)",
            "dry_fodder": "4 – 5 kg daily (chaffed ragi/paddy straw)",
            "concentrate": "1 kg maintenance + 400g per litre milk",
            "mineral_mix": "50g daily"
        },
        "feeding_guide_kn": {
            "green_fodder": "ದಿನಕ್ಕೆ 20-25 ಕೆಜಿ ಹಸಿರು ಮೇವು",
            "dry_fodder": "ದಿನಕ್ಕೆ 4-5 ಕೆಜಿ ಒಣ ಮೇವು",
            "concentrate": "1 ಕೆಜಿ ನಿರ್ವಹಣೆಗೆ + ಪ್ರತಿ ಲೀಟರ್‌ಗೆ 400 ಗ್ರಾಂ ಹಿಂಡಿ",
            "mineral_mix": "ದಿನಕ್ಕೆ 50 ಗ್ರಾಂ ಖನಿಜ ಮಿಶ್ರಣ"
        },
        "care_tips": [
            "Prevent tick infestation with bi-monthly herbal/approved ectoparasiticide.",
            "Ensure well-ventilated shed with adequate drainage.",
            "Strict adherence to post-milking teat dipping prevents mastitis."
        ],
        "care_tips_kn": [
            "ಉಣ್ಣೆಗಳಿಂದ ರಕ್ಷಿಸಲು ಕೊಟ್ಟಿಗೆಯನ್ನು ಸ್ವಚ್ಛವಾಗಿಡಿ.",
            "ಗಾಳಿ-ಬೆಳಕು ಉತ್ತಮವಾಗಿರುವ ಕೊಟ್ಟಿಗೆ ನಿರ್ಮಿಸಿ.",
            "ಹಾಲು ಕರೆದ ನಂತರ ಕೆಚ್ಚಲನ್ನು ಪೋವಿಡೋನ್ ಅಯೋಡಿನ್ ದ್ರಾವಣದಲ್ಲಿ ಅದ್ದಿ."
        ],
        "suitability": "Best all-rounder for small and medium dairy farmers seeking balanced volume and high fat."
    },
    {
        "id": "hf_cross",
        "name": "Holstein Friesian (HF) Cross",
        "name_kn": "ಎಚ್.ಎಫ್ ಕ್ರಾಸ್",
        "category": "exotic_cross",
        "origin": "European origin crossed with Indian breeds for volume",
        "avg_yield_litres": "18 – 26 L/day",
        "fat_content": "3.5% – 4.0%",
        "snf_content": "8.4% – 8.7%",
        "heat_tolerance": "Sensitive (Requires cool, well-ventilated housing)",
        "description": "Large framed dairy animal with prominent black and white patches. The highest volume milk producer in the cooperative system, ideal for intensive commercial dairy operations.",
        "description_kn": "ಕಪ್ಪು-ಬಿಳುಪು ಮಚ್ಚೆಗಳಿರುವ ದೊಡ್ಡ ದೇಹದ ಹಸು. ಅತಿ ಹೆಚ್ಚು ಹಾಲು (ದಿನಕ್ಕೆ 18-26 ಲೀಟರ್) ನೀಡುವ ತಳಿ. ವಾಣಿಜ್ಯ ಡೈರಿ ಸಾಕಣೆಗೆ ಅತ್ಯಂತ ಲಾಭದಾಯಕ.",
        "feeding_guide": {
            "green_fodder": "30 – 35 kg daily (Napier, Maize, Silage)",
            "dry_fodder": "4 – 6 kg daily (ensure fiber for rumination)",
            "concentrate": "1.5 kg maintenance + 400g per litre milk + 100g bypass fat",
            "mineral_mix": "60 – 80g daily (calcium and phosphorus critical)"
        },
        "feeding_guide_kn": {
            "green_fodder": "ದಿನಕ್ಕೆ 30-35 ಕೆಜಿ ಹಸಿರು ಮೇವು ಅಥವಾ ಸೈಲೇಜ್",
            "dry_fodder": "ದಿನಕ್ಕೆ 4-6 ಕೆಜಿ ಒಣ ಮೇವು",
            "concentrate": "1.5 ಕೆಜಿ ನಿರ್ವಹಣೆಗೆ + ಪ್ರತಿ ಲೀಟರ್‌ಗೆ 400 ಗ್ರಾಂ ಹಿಂಡಿ + ಬೈಪಾಸ್ ಫ್ಯಾಟ್",
            "mineral_mix": "ದಿನಕ್ಕೆ 60-80 ಗ್ರಾಂ ಕ್ಯಾಲ್ಸಿಯಂಯುಕ್ತ ಖನಿಜ ಮಿಶ್ರಣ"
        },
        "care_tips": [
            "Shed temperature should not exceed 28°C during peak summer; use fans or thatch roofing.",
            "High metabolic load makes cows susceptible to Mastitis; maintain sterile milking protocol.",
            "Monitor hoof trimming annually to prevent lameness."
        ],
        "care_tips_kn": [
            "ಬೇಸಿಗೆಯಲ್ಲಿ ಕೊಟ್ಟಿಗೆಯ ತಾಪಮಾನ ತಂಪಾಗಿರುವಂತೆ ಫ್ಯಾನ್ ಅಥವಾ ತಂಪಾದ ಚಾವಣಿ ಒದಗಿಸಿ.",
            "ಕೆಚ್ಚಲು ಬಾವು ತಡೆಯಲು ಕಡ್ಡಾಯವಾಗಿ ನಿಯಮಿತ ತಪಾಸಣೆ ಮಾಡಿ.",
            "ಗೊರಸುಗಳ ಆರೋಗ್ಯವನ್ನು ವಾರ್ಷಿಕವಾಗಿ ಪರೀಕ್ಷಿಸಿ."
        ],
        "suitability": "Recommended for experienced farmers with abundant irrigation, green fodder, and shaded housing."
    },
    {
        "id": "sahiwal",
        "name": "Sahiwal",
        "name_kn": "ಸಾಹಿವಾಲ್",
        "category": "indigenous_cow",
        "origin": "Punjab / Rajasthan, renowned across India",
        "avg_yield_litres": "10 – 14 L/day",
        "fat_content": "4.3% – 4.8%",
        "snf_content": "8.6% – 8.9%",
        "heat_tolerance": "Excellent (Exceptional endurance against tropical heat)",
        "description": "Reddish-brown indigenous dairy breed with loose skin and prominent dewlap. Highly tolerant of high ambient temperatures and drought, with low veterinary expenditure.",
        "description_kn": "ಕೆಂಪು-ಕಂದು ಬಣ್ಣದ ದೇಶಿ ಹಾಲು ನೀಡುವ ತಳಿ. ಹೆಚ್ಚು ಶಾಖ ಮತ್ತು ಬರಗಾಲವನ್ನು ತಡೆದುಕೊಳ್ಳುವ ಅದ್ಭುತ ಶಕ್ತಿ. ಔಷಧೋಪಚಾರ ವೆಚ್ಚ ಅತಿ ಕಡಿಮೆ.",
        "feeding_guide": {
            "green_fodder": "18 – 22 kg daily",
            "dry_fodder": "4 – 5 kg daily",
            "concentrate": "1 kg maintenance + 350g per litre of milk",
            "mineral_mix": "50g daily"
        },
        "feeding_guide_kn": {
            "green_fodder": "ದಿನಕ್ಕೆ 18-22 ಕೆಜಿ ಹಸಿರು ಮೇವು",
            "dry_fodder": "ದಿನಕ್ಕೆ 4-5 ಕೆಜಿ ಒಣ ಮೇವು",
            "concentrate": "1 ಕೆಜಿ ನಿರ್ವಹಣೆಗೆ + ಪ್ರತಿ ಲೀಟರ್‌ಗೆ 350 ಗ್ರಾಂ ಹಿಂಡಿ",
            "mineral_mix": "ದಿನಕ್ಕೆ 50 ಗ್ರಾಂ ಖನಿಜ ಮಿಶ್ರಣ"
        },
        "care_tips": [
            "Excellent grazer; minimizes costly commercial concentrate needs.",
            "Strong maternal instinct and gentle temperament.",
            "Resistant to tick-borne fever and internal parasites."
        ],
        "care_tips_kn": [
            "ಮೇಯಿಸಲು ಅತಿ ಸೂಕ್ತ, ಹಿಂಡಿಯ ವೆಚ್ಚ ಕಡಿಮೆ.",
            "ಶಾಂತ ಸ್ವಭಾವ ಮತ್ತು ಕರುಗಳ ಬಗ್ಗೆ ಉತ್ತಮ ಕಾಳಜಿ.",
            "ಉಣ್ಣೆ ಜ್ವರ ಮತ್ತು ರಕ್ತಹೀನತೆಗೆ ನೈಸರ್ಗಿಕ ಪ್ರತಿರೋಧ."
        ],
        "suitability": "Great choice for natural, zero-budget, and low-cost sustainable rural dairy farms."
    },
    {
        "id": "hallikar",
        "name": "Hallikar",
        "name_kn": "ಹಳ್ಳಿಕಾರ್",
        "category": "indigenous_cow",
        "origin": "Karnataka native (Tumakuru, Hassan, Shivamogga, Mysuru)",
        "avg_yield_litres": "4 – 8 L/day",
        "fat_content": "4.8% – 5.5%",
        "snf_content": "8.8% – 9.2%",
        "heat_tolerance": "Superior (Built for Malnad & Deccan dry zones)",
        "description": "Pride of Karnataka. Renowned for its long upright tapering horns and agile grey body. Highly resilient native animal providing concentrated, nutritious milk while requiring minimal management.",
        "description_kn": "ಕರ್ನಾಟಕದ ಹೆಮ್ಮೆಯ ದೇಶಿ ತಳಿ. ಉದ್ದವಾದ ನೆಟ್ಟಗಿನ ಕೊಂಬುಗಳು ಮತ್ತು ಬೂದು ಬಣ್ಣದ ದೇಹ. ಕಠಿಣ ಹವಾಮಾನಕ್ಕೂ ಜಗ್ಗದ ಅದ್ಭುತ ಸಹಿಷ್ಣುತೆ ಮತ್ತು ಅತಿ ಹೆಚ್ಚು ಜಿಡ್ಡುಳ್ಳ ಪೌಷ್ಟಿಕ ಹಾಲು ನೀಡುತ್ತದೆ.",
        "feeding_guide": {
            "green_fodder": "15 – 18 kg daily",
            "dry_fodder": "5 – 6 kg daily (straw, ragi stalks)",
            "concentrate": "1 kg daily (minimal concentrate required)",
            "mineral_mix": "40g daily"
        },
        "feeding_guide_kn": {
            "green_fodder": "ದಿನಕ್ಕೆ 15-18 ಕೆಜಿ ಹಸಿರು ಮೇವು",
            "dry_fodder": "ದಿನಕ್ಕೆ 5-6 ಕೆಜಿ ಒಣ ಮೇವು",
            "concentrate": "ದಿನಕ್ಕೆ ಕೇವಲ 1 ಕೆಜಿ ಸಾಂದ್ರ ಆಹಾರ ಸಾಕು",
            "mineral_mix": "ದಿನಕ್ಕೆ 40 ಗ್ರಾಂ ಖನಿಜ ಮಿಶ್ರಣ"
        },
        "care_tips": [
            "Needs open yard exercise and grazing space.",
            "Hardy hooves that do not rot even in heavy Malnad monsoon rains.",
            "Rarely requires veterinary medications."
        ],
        "care_tips_kn": [
            "ಮುಕ್ತವಾಗಿ ಓಡಾಡಲು ಸ್ಥಳಾವಕಾಶವಿರಲಿ.",
            "ಮಲೆನಾಡಿನ ಭಾರಿ ಮಳೆಗಾಲದಲ್ಲೂ ಗೊರಸು ಕೊಳೆಯುವುದಿಲ್ಲ.",
            "ಔಷಧಿಗಳ ಅಗತ್ಯವಿಲ್ಲದ ಸ್ವಾಭಾವಿಕ ರೋಗ ನಿರೋಧಕತೆ."
        ],
        "suitability": "Traditional rural Karnataka households, conservation breeding, and zero-chemical dairy."
    }
]

# =====================================================================
# Standard Veterinary Health Reminder Templates
# =====================================================================
REMINDER_TEMPLATES: List[Dict[str, Any]] = [
    {
        "template_id": "fmd_biannual",
        "title": "Foot & Mouth Disease (FMD) Booster",
        "title_kn": "ಕಾಲು ಮತ್ತು ಬಾಯಿ ರೋಗದ ಲಸಿಕೆ (FMD)",
        "care_type": "vaccination",
        "recommended_frequency": "Every 6 months (February & August)",
        "default_notes": "National FMD control drive. Animals must be healthy and afebrile. Protects against oral blisters and hoof lesions."
    },
    {
        "template_id": "deworming_monsoon",
        "title": "Pre-Monsoon Broad Spectrum Deworming",
        "title_kn": "ಮುಂಗಾರು ಪೂರ್ವ ಜಂತುಹುಳು ನಿವಾರಣೆ",
        "care_type": "deworming",
        "recommended_frequency": "Every 6 months (May & October)",
        "default_notes": "Oral dewormer administration before rains to eliminate liver flukes and roundworms. Improves appetite and milk fat."
    },
    {
        "template_id": "hs_vaccine",
        "title": "Hemorrhagic Septicemia (HS) Vaccine",
        "title_kn": "ಗಂಟಲುಬೇನೆ ರೋಗದ ಲಸಿಕೆ (HS)",
        "care_type": "vaccination",
        "recommended_frequency": "Annual (May/June prior to rains)",
        "default_notes": "Crucial pre-monsoon vaccination. Protects against high fever, throat swelling, and respiratory distress."
    },
    {
        "template_id": "bq_vaccine",
        "title": "Black Quarter (BQ) Vaccine",
        "title_kn": "ಚಪ್ಪೆ ರೋಗದ ಲಸಿಕೆ (BQ)",
        "care_type": "vaccination",
        "recommended_frequency": "Annual for animals under 3 years",
        "default_notes": "Administered to young stock and heifers before monsoon. Prevents sudden lameness and muscular swelling."
    },
    {
        "template_id": "brucellosis_calf",
        "title": "Brucellosis S19 Calfhood Vaccine",
        "title_kn": "ಬ್ರೂಸೆಲೋಸಿಸ್ ಲಸಿಕೆ (ಹೆಣ್ಣು ಕರುಗಳಿಗೆ)",
        "care_type": "vaccination",
        "recommended_frequency": "Once in lifetime (female calves 4-8 months)",
        "default_notes": "Lifelong protection against contagious abortion in dairy cattle. Crucial for herd biosecurity."
    },
    {
        "template_id": "vet_camp_screening",
        "title": "Cooperative Veterinary Health Camp & Pregnancy Check",
        "title_kn": "ಸಹಕಾರ ಸಂಘದ ಪಶು ಆರೋಗ್ಯ ಮತ್ತು ಗರ್ಭಧಾರಣೆ ತಪಾಸಣಾ ಶಿಬಿರ",
        "care_type": "vet_camp",
        "recommended_frequency": "Quarterly camp",
        "default_notes": "Screening for subclinical mastitis, reproductive cycling, artificial insemination pregnancy diagnosis (PD), and vitamin supplementation."
    }
]

# =====================================================================
# Static Route Endpoints (Must be declared before dynamic /{cattle_id})
# =====================================================================
@router.get("/breeds", response_model=List[schemas.BreedAdvisoryResponse])
def get_breed_advisory():
    """Returns curated practical Indian dairy breed advisory and care guide."""
    return BREED_ADVISORY

@router.get("/breeds/{breed_id}", response_model=schemas.BreedAdvisoryResponse)
def get_single_breed_advisory(breed_id: str):
    """Returns detailed feeding, care, and milk yield data for a specific breed."""
    for b in BREED_ADVISORY:
        if b["id"].lower() == breed_id.lower() or b["name"].lower() == breed_id.lower():
            return b
    raise HTTPException(status_code=404, detail=f"Breed advisory for '{breed_id}' not found.")

@router.get("/reminders/templates", response_model=List[schemas.ReminderTemplateResponse])
def get_reminder_templates():
    """Returns official veterinary vaccination and health reminder templates."""
    return REMINDER_TEMPLATES

@router.get("/reminders", response_model=List[schemas.CattleReminderResponse])
def get_reminders(
    farmer_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """Retrieves health and vaccination reminders with dynamic overdue status."""
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")
    today = datetime.date.today()

    query = db.query(models.CattleReminder).filter(models.CattleReminder.cooperative_id == coop_id)

    if role == "farmer":
        query = query.filter(models.CattleReminder.farmer_id == payload.get("user_id"))
    elif farmer_id:
        query = query.filter(models.CattleReminder.farmer_id == farmer_id)

    if status_filter:
        query = query.filter(models.CattleReminder.status == status_filter)

    reminders = query.order_by(models.CattleReminder.due_date.asc()).all()

    result = []
    for r in reminders:
        # Dynamically compute status based on actual dates
        if r.status not in ["completed", "cancelled"]:
            if r.administered_date:
                r.status = "completed"
            elif r.due_date < today:
                r.status = "overdue"
            elif r.due_date <= today + datetime.timedelta(days=3):
                r.status = "due_soon"
            else:
                r.status = "upcoming"
            db.commit()

        resp = schemas.CattleReminderResponse.from_orm(r)
        if r.cattle:
            resp.cattle_name = r.cattle.name
            resp.cattle_tag = r.cattle.tag_number
        if r.farmer:
            resp.farmer_name = r.farmer.full_name
        result.append(resp)

    return result

@router.post("/reminders", response_model=schemas.CattleReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(
    data: schemas.CattleReminderCreate,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin schedules a health reminder for a farmer's cattle."""
    farmer = db.query(models.Farmer).filter(
        models.Farmer.id == data.farmer_id,
        models.Farmer.cooperative_id == admin.cooperative_id
    ).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found in your cooperative.")

    reminder = models.CattleReminder(
        cooperative_id=admin.cooperative_id,
        farmer_id=data.farmer_id,
        cattle_id=data.cattle_id,
        title=data.title.strip(),
        title_kn=data.title_kn.strip() if data.title_kn else None,
        care_type=data.care_type,
        due_date=data.due_date,
        status="upcoming",
        guidance=data.guidance.strip() if data.guidance else None,
        veterinarian_notes=data.veterinarian_notes.strip() if data.veterinarian_notes else None
    )
    db.add(reminder)
    db.flush()

    # Create in-app notification for the farmer in-app
    animal_str = f" for {reminder.cattle.name} ({reminder.cattle.tag_number})" if reminder.cattle else ""
    notif = models.Notification(
        cooperative_id=admin.cooperative_id,
        farmer_id=farmer.id,
        title=f"Health Vaccination / Care Reminder: {data.title}",
        title_kn=f"ಆರೈಕೆ ಲಸಿಕೆ / ಆರೈಕೆ ಜ್ಞಾಪನೆ: {data.title_kn or data.title}",
        message=f"{data.care_type.capitalize()}{animal_str} is due on {data.due_date}. {data.guidance or ''}",
        message_kn=f"{data.due_date} ರಂದು {data.care_type} ನಿಗದಿಯಾಗಿದೆ. {data.veterinarian_notes or ''}",
        category="cattle"
    )
    db.add(notif)
    db.commit()
    db.refresh(reminder)

    resp = schemas.CattleReminderResponse.from_orm(reminder)
    if reminder.cattle:
        resp.cattle_name = reminder.cattle.name
        resp.cattle_tag = reminder.cattle.tag_number
    resp.farmer_name = farmer.full_name
    return resp

@router.put("/reminders/{reminder_id}", response_model=schemas.CattleReminderResponse)
def update_reminder(
    reminder_id: int,
    data: schemas.CattleReminderUpdate,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """Marks a reminder as completed or updates notes."""
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")

    reminder = db.query(models.CattleReminder).filter(
        models.CattleReminder.id == reminder_id,
        models.CattleReminder.cooperative_id == coop_id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found in your cooperative.")

    if role == "farmer" and reminder.farmer_id != payload.get("user_id"):
        raise HTTPException(status_code=403, detail="Access denied. You can only update your own reminders.")

    reminder.status = data.status
    if data.administered_date:
        reminder.administered_date = data.administered_date
    elif data.status == "completed" and not reminder.administered_date:
        reminder.administered_date = datetime.date.today()

    if data.administered_by:
        reminder.administered_by = data.administered_by
    if data.next_due_date:
        reminder.next_due_date = data.next_due_date
    if data.guidance:
        reminder.guidance = data.guidance
    if data.veterinarian_notes:
        reminder.veterinarian_notes = data.veterinarian_notes

    reminder.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(reminder)

    resp = schemas.CattleReminderResponse.from_orm(reminder)
    if reminder.cattle:
        resp.cattle_name = reminder.cattle.name
        resp.cattle_tag = reminder.cattle.tag_number
    if reminder.farmer:
        resp.farmer_name = reminder.farmer.full_name
    return resp

# =====================================================================
# Cattle Profile Endpoints
# =====================================================================
@router.get("", response_model=List[schemas.CattleResponse])
def get_cattle_list(
    farmer_id: Optional[int] = None,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """
    Retrieves cattle profiles.
    Farmers can ONLY view cattle registered under their own account.
    Admins view cattle belonging to their cooperative.
    """
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")

    query = db.query(models.Cattle).filter(models.Cattle.cooperative_id == coop_id)

    if role == "farmer":
        query = query.filter(models.Cattle.farmer_id == payload.get("user_id"))
    elif farmer_id:
        # Verify farmer belongs to this admin's cooperative
        target_f = db.query(models.Farmer).filter(
            models.Farmer.id == farmer_id,
            models.Farmer.cooperative_id == coop_id
        ).first()
        if not target_f:
            raise HTTPException(status_code=404, detail="Farmer not found in your cooperative.")
        query = query.filter(models.Cattle.farmer_id == farmer_id)

    cattle_list = query.order_by(models.Cattle.name.asc()).all()

    result = []
    for c in cattle_list:
        resp = schemas.CattleResponse.from_orm(c)
        resp.farmer_name = c.farmer.full_name if c.farmer else None
        # Include reminders
        reminders = db.query(models.CattleReminder).filter(models.CattleReminder.cattle_id == c.id).all()
        resp.reminders = [schemas.CattleReminderResponse.from_orm(r) for r in reminders]
        result.append(resp)

    return result

@router.post("", response_model=schemas.CattleResponse, status_code=status.HTTP_201_CREATED)
def create_cattle(
    data: schemas.CattleCreate,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """
    Registers a new cattle profile.
    If called by farmer: automatically assigns to their own profile.
    If called by admin: assigns to specified farmer within their cooperative.
    """
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")

    if role == "farmer":
        target_farmer_id = payload.get("user_id")
    else:
        if not data.farmer_id:
            raise HTTPException(status_code=400, detail="farmer_id is required for admin cattle registration.")
        target_farmer_id = data.farmer_id

    # Verify farmer belongs to cooperative
    farmer = db.query(models.Farmer).filter(
        models.Farmer.id == target_farmer_id,
        models.Farmer.cooperative_id == coop_id
    ).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found in this cooperative.")

    tag = data.tag_number.strip().upper()
    existing = db.query(models.Cattle).filter(
        models.Cattle.cooperative_id == coop_id,
        models.Cattle.tag_number == tag
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Cattle with tag '{tag}' already exists in your cooperative.")

    cattle = models.Cattle(
        cooperative_id=coop_id,
        farmer_id=target_farmer_id,
        tag_number=tag,
        name=data.name.strip(),
        breed=data.breed.strip(),
        age_years=data.age_years,
        gender=data.gender or "Female",
        milking_status=data.milking_status or "Milking",
        daily_yield_estimate=data.daily_yield_estimate or 0.0,
        health_notes=data.health_notes
    )
    db.add(cattle)
    db.commit()
    db.refresh(cattle)

    # In-app notification for the farmer
    notif = models.Notification(
        cooperative_id=coop_id,
        farmer_id=target_farmer_id,
        title="Cattle Registered",
        title_kn="ಹೊಸ ಹಸು ದಾಖಲಾಗಿದೆ",
        message=f"Cattle '{cattle.name}' (Tag: {cattle.tag_number}, Breed: {cattle.breed}) was successfully registered.",
        message_kn=f"ಹೊಸ ಜಾನುವಾರು '{cattle.name}' (ಟ್ಯಾಗ್: {cattle.tag_number}, ತಳಿ: {cattle.breed}) ಯಶಸ್ವಿಯಾಗಿ ನೋಂದಣಿಯಾಗಿದೆ.",
        category="cattle"
    )
    db.add(notif)
    db.commit()

    resp = schemas.CattleResponse.from_orm(cattle)
    resp.farmer_name = farmer.full_name
    resp.reminders = []
    return resp

@router.get("/{cattle_id}", response_model=schemas.CattleResponse)
def get_single_cattle(
    cattle_id: int,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """Retrieves a single cattle profile with strict ownership verification."""
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")

    cattle = db.query(models.Cattle).filter(
        models.Cattle.id == cattle_id,
        models.Cattle.cooperative_id == coop_id
    ).first()

    if not cattle:
        raise HTTPException(status_code=404, detail="Cattle profile not found.")

    if role == "farmer" and cattle.farmer_id != payload.get("user_id"):
        raise HTTPException(status_code=403, detail="Access denied. You can only view your own cattle.")

    resp = schemas.CattleResponse.from_orm(cattle)
    resp.farmer_name = cattle.farmer.full_name if cattle.farmer else None
    reminders = db.query(models.CattleReminder).filter(models.CattleReminder.cattle_id == cattle.id).all()
    resp.reminders = [schemas.CattleReminderResponse.from_orm(r) for r in reminders]
    return resp

@router.put("/{cattle_id}", response_model=schemas.CattleResponse)
def update_cattle(
    cattle_id: int,
    data: schemas.CattleUpdate,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """
    Updates an existing cattle profile with strict ownership verification.
    Farmers can update their own cattle; admins can update cattle in their cooperative.
    """
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")

    cattle = db.query(models.Cattle).filter(
        models.Cattle.id == cattle_id,
        models.Cattle.cooperative_id == coop_id
    ).first()

    if not cattle:
        raise HTTPException(status_code=404, detail="Cattle profile not found.")

    if role == "farmer" and cattle.farmer_id != payload.get("user_id"):
        raise HTTPException(status_code=403, detail="Access denied. You can only update your own cattle.")

    if data.tag_number and data.tag_number.strip().upper() != cattle.tag_number:
        new_tag = data.tag_number.strip().upper()
        tag_clash = db.query(models.Cattle).filter(
            models.Cattle.cooperative_id == coop_id,
            models.Cattle.tag_number == new_tag,
            models.Cattle.id != cattle.id
        ).first()
        if tag_clash:
            raise HTTPException(status_code=400, detail=f"Tag number '{new_tag}' is already assigned to another animal.")
        cattle.tag_number = new_tag

    if data.name is not None:
        cattle.name = data.name.strip()
    if data.breed is not None:
        cattle.breed = data.breed.strip()
    if data.age_years is not None:
        cattle.age_years = data.age_years
    if data.gender is not None:
        cattle.gender = data.gender
    if data.milking_status is not None:
        cattle.milking_status = data.milking_status
    if data.daily_yield_estimate is not None:
        cattle.daily_yield_estimate = data.daily_yield_estimate
    if data.health_notes is not None:
        cattle.health_notes = data.health_notes

    db.commit()
    db.refresh(cattle)

    resp = schemas.CattleResponse.from_orm(cattle)
    resp.farmer_name = cattle.farmer.full_name if cattle.farmer else None
    reminders = db.query(models.CattleReminder).filter(models.CattleReminder.cattle_id == cattle.id).all()
    resp.reminders = [schemas.CattleReminderResponse.from_orm(r) for r in reminders]
    return resp

@router.delete("/{cattle_id}")
def delete_cattle(
    cattle_id: int,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """Safely removes a cattle profile and its reminders."""
    coop_id = payload.get("cooperative_id")
    role = payload.get("role")

    cattle = db.query(models.Cattle).filter(
        models.Cattle.id == cattle_id,
        models.Cattle.cooperative_id == coop_id
    ).first()

    if not cattle:
        raise HTTPException(status_code=404, detail="Cattle profile not found.")

    if role == "farmer" and cattle.farmer_id != payload.get("user_id"):
        raise HTTPException(status_code=403, detail="Access denied. You can only delete your own cattle.")

    # Delete referencing reminders first
    db.query(models.CattleReminder).filter(models.CattleReminder.cattle_id == cattle.id).delete()
    db.delete(cattle)
    db.commit()
    return {"message": f"Cattle '{cattle.name}' (Tag: {cattle.tag_number}) successfully removed."}

@router.delete("/reminders/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: int,
    admin: models.AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Cancels or deletes an incorrect reminder before sending."""
    reminder = db.query(models.CattleReminder).filter(
        models.CattleReminder.id == reminder_id,
        models.CattleReminder.cooperative_id == admin.cooperative_id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found.")

    db.delete(reminder)
    db.commit()
    return None

