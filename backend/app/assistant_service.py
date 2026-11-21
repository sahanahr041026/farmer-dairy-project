import os
import re
from typing import Dict, Any, List, Optional
from app.config import settings

# Curated Dairy Knowledge Base for offline/local mode and fallback
KNOWLEDGE_BASE = [
    {
        "keywords": ["feed", "diet", "nutrition", "fodder", "what should i feed", "ತಿನ್ನಿಸಬೇಕು", "ಆಹಾರ", "ಮೇವು", "ಹಸಿರು ಮೇವು"],
        "en": (
            "Nutritional Guidelines for Dairy Cattle:\n\n"
            "1. Green Fodder: 20–25 kg daily (Hybrid Napier, CO-4, Maize, Sorghum, or Berseem).\n"
            "2. Dry Fodder: 4–6 kg daily (Ragi straw, Paddy straw, or Jowar kadbi) for essential fiber and rumination.\n"
            "3. Balanced Concentrate: 1 kg for body maintenance + 400g for every 1 litre of milk produced.\n"
            "4. Mineral Mixture: 50–60g daily mixed with feed to support reproductive health and milk fat.\n"
            "5. Clean Water: Ensure 60–80 litres of fresh, clean drinking water accessible at all times.\n\n"
            "Tip: Avoid sudden feed transitions; introduce new feed over 5–7 days to prevent digestive upset."
        ),
        "kn": (
            "ಹಾಲು ಕೊಡುವ ಹಸುಗಳ ಪೌಷ್ಟಿಕ ಆಹಾರ ಪದ್ಧತಿ:\n\n"
            "1. ಹಸಿರು ಮೇವು: ದಿನಕ್ಕೆ 20-25 ಕೆಜಿ (ಹೈಬ್ರಿಡ್ ನೇಪಿಯರ್, ಸಿಒ-4, ಜೋಳ ಅಥವಾ ಮೆಕ್ಕೆಜೋಳ).\n"
            "2. ಒಣ ಮೇವು: ದಿನಕ್ಕೆ 4-6 ಕೆಜಿ (ರಾಗಿ ಹುಲ್ಲು ಅಥವಾ ಭತ್ತದ ಹುಲ್ಲು) ಜೀರ್ಣಕ್ರಿಯೆಗೆ ಅತ್ಯಗತ್ಯ.\n"
            "3. ಹಿಂಡಿ/ಸಾಂದ್ರ ಆಹಾರ: ದೇಹ ನಿರ್ವಹಣೆಗೆ 1 ಕೆಜಿ + ಪ್ರತಿ 1 ಲೀಟರ್ ಹಾಲಿಗೆ 400 ಗ್ರಾಂ.\n"
            "4. ಖನಿಜ ಮಿಶ್ರಣ (Mineral Mixture): ದಿನಕ್ಕೆ 50-60 ಗ್ರಾಂ ಆಹಾರದಲ್ಲಿ ಬೆರೆಸಿ ಕೊಡಿ.\n"
            "5. ಶುದ್ಧ ಕುಡಿಯುವ ನೀರು: ದಿನಕ್ಕೆ ಕನಿಷ್ಠ 60-80 ಲೀಟರ್ ಶುದ್ಧ ನೀರು ಸದಾ ಲಭ್ಯವಿರಲಿ."
        ),
        "followups": [
            "How to improve milk fat and SNF?",
            "When should mineral mixture be given?",
            "How much water does a cow need?"
        ]
    },
    {
        "keywords": ["vaccine", "vaccination", "fmd", "bq", "hs", "ಲಸಿಕೆ", "ಕಾಲುಬಾಯಿ", "ಗಂಟಲುಬೇನೆ", "ಚಪ್ಪೆ"],
        "en": (
            "Recommended Cattle Vaccination Schedule (Karnataka Dairy Standards):\n\n"
            "1. Foot & Mouth Disease (FMD / ಕಾಲುಬಾಯಿ ರೋಗ): Administered bi-annually (February & August).\n"
            "2. Hemorrhagic Septicemia (HS / ಗಂಟಲುಬೇನೆ): Once a year before monsoon (May/June).\n"
            "3. Black Quarter (BQ / ಚಪ್ಪೆ ರೋಗ): Annually before rains (May/June) for cattle under 3 years.\n"
            "4. Brucellosis: Once in a lifetime for female calves between 4 to 8 months of age.\n\n"
            "Important: Do not vaccinate sick or exhausted animals. Maintain cold-chain and consult your cooperative veterinarian."
        ),
        "kn": (
            "ಹಸುಗಳಿಗೆ ಅಗತ್ಯವಾದ ಲಸಿಕಾ ವೇಳಾಪಟ್ಟಿ:\n\n"
            "1. ಕಾಲು ಮತ್ತು ಬಾಯಿ ರೋಗ (FMD): ವರ್ಷಕ್ಕೆ 2 ಬಾರಿ (ಫೆಬ್ರವರಿ ಮತ್ತು ಆಗಸ್ಟ್ ತಿಂಗಳಲ್ಲಿ).\n"
            "2. ಗಂಟಲುಬೇನೆ (HS): ಮುಂಗಾರು ಮಳೆಗೆ ಮುನ್ನ ವರ್ಷಕ್ಕೆ 1 ಬಾರಿ (ಮೇ/ಜೂನ್).\n"
            "3. ಚಪ್ಪೆ ರೋಗ (BQ): 3 ವರ್ಷದೊಳಗಿನ ಕರುಗಳಿಗೆ ಮಳೆಗೆ ಮುನ್ನ ವರ್ಷಕ್ಕೊಮ್ಮೆ (ಮೇ/ಜೂನ್).\n"
            "4. ಬ್ರೂಸೆಲೋಸಿಸ್ (Brucellosis): 4 ರಿಂದ 8 ತಿಂಗಳ ಹೆಣ್ಣು ಕರುಗಳಿಗೆ ಜೀವಿತಾವಧಿಯಲ್ಲಿ 1 ಬಾರಿ.\n\n"
            "ಗಮನಿಸಿ: ಜ್ವರ ಅಥವಾ ಅಸ್ವಸ್ಥತೆ ಇರುವ ಜಾನುವಾರುಗಳಿಗೆ ಲಸಿಕೆ ಹಾಕಬೇಡಿ. ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ."
        ),
        "followups": [
            "What should I do after vaccination?",
            "How often is deworming required?",
            "When is the next cooperative vet camp?"
        ]
    },
    {
        "keywords": ["vet", "contact", "emergency", "sick", "signs", "ill", "doctor", "ವೈದ್ಯ", "ತುರ್ತು", "ಜ್ವರ", "ಖಾಯಿಲೆ", "ರೋಗ"],
        "en": (
            "Signs When You Must Contact a Veterinarian Promptly:\n\n"
            "1. High Body Temperature (Normal is 101.5°F / 38.6°C. Above 103°F indicates infection).\n"
            "2. Complete cessation of cud chewing (rumination) or sudden refusal to eat/drink.\n"
            "3. Severe abdominal bloating (Tympany) or difficulty breathing.\n"
            "4. Swollen, hot, firm, or painful udder with watery/bloody/clotted milk (Mastitis).\n"
            "5. Inability to stand up (downer cow syndrome / milk fever) post-calving.\n"
            "6. Severe diarrhea with foul odor or blood streaks.\n\n"
            "Safety Advisory: Never self-prescribe antibiotics or veterinary medications. Contact your registered cooperative veterinary officer immediately."
        ),
        "kn": (
            "ಪಶುವೈದ್ಯರನ್ನು ತಕ್ಷಣವೇ ಸಂಪರ್ಕಿಸಬೇಕಾದ ಎಚ್ಚರಿಕೆಯ ಲಕ್ಷಣಗಳು:\n\n"
            "1. ತೀವ್ರ ಜ್ವರ (ಸಾಮಾನ್ಯ ತಾಪಮಾನ 101.5°F. 103°F ಗಿಂತ ಹೆಚ್ಚಿದ್ದರೆ ಸೋಂಕಿನ ಲಕ್ಷಣ).\n"
            "2. ಮೆಲುಕು ಹಾಕುವುದು (cud chewing) ಸಂಪೂರ್ಣ ನಿಲ್ಲಿಸುವುದು ಅಥವಾ ಮೇವು ತಿನ್ನದಿರುವುದು.\n"
            "3. ಹೊಟ್ಟೆ ಉಬ್ಬರ (bloating) ಅಥವಾ ಉಸಿರಾಟದಲ್ಲಿ ತೀವ್ರ ತೊಂದರೆ.\n"
            "4. ಕೆಚ್ಚಲು ಊದಿಕೊಳ್ಳುವುದು, ಬಿಸಿಯಾಗಿ ನೋವು ಕಾಣಿಸುವುದು, ಹಾಲಿನಲ್ಲಿ ಕೀವು/ರಕ್ತ ಬರುವುದು (ಕೆಚ್ಚಲು ಬಾವು).\n"
            "5. ಕರು ಹಾಕಿದ ನಂತರ ಹಸು ಎದ್ದು ನಿಲ್ಲಲು ಸಾಧ್ಯವಾಗದಿರುವುದು (ಹಾಲಿನ ಜ್ವರ).\n\n"
            "ಎಚ್ಚರಿಕೆ: ಸ್ವಂತವಾಗಿ ಯಾವುದೇ ಆಂಟಿಬಯೋಟಿಕ್ ಔಷಧಿ ನೀಡಬೇಡಿ. ತಕ್ಷಣವೇ ಪಶುವೈದ್ಯರನ್ನು ಕರೆಯಿಸಿ."
        ),
        "followups": [
            "What is the normal temperature of a cow?",
            "How to recognize mastitis early?",
            "Emergency first aid for bloat"
        ]
    },
    {
        "keywords": ["fat", "snf", "increase milk", "quality", "ಹಾಲಿನ ಜಿಡ್ಡು", "ಎಸ್‌ಎನ್‌ಎಫ್", "ಗುಣಮಟ್ಟ", "ಫ್ಯಾಟ್"],
        "en": (
            "Proven Ways to Increase Milk Fat & SNF Percentage:\n\n"
            "1. Dry Fodder Fiber: Ensure at least 4–5 kg of dry chaffed straw (Ragi/Paddy) daily. Fiber stimulates acetic acid production in rumen, which creates milk fat.\n"
            "2. Fodder Chopping: Do not chop dry fodder too fine (keep particle length 2–3 cm) to maintain rumination time.\n"
            "3. Bypass Fat / Oil Cakes: Add 50–100g of bypass fat or quality cottonseed/groundnut cake in concentrate ration.\n"
            "4. Complete Milking: The last stripped milk contains the highest fat percentage (up to 8–10%). Milk quickly (within 5–7 minutes) and completely.\n"
            "5. Clean Drinking Water: Adequate water intake ensures proper nutrient absorption and optimal SNF."
        ),
        "kn": (
            "ಹಾಲಿನ ಫ್ಯಾಟ್ ಮತ್ತು ಎಸ್‌ಎನ್‌ಎಫ್ ಹೆಚ್ಚಿಸುವ ಸರಳ ವಿಧಾನಗಳು:\n\n"
            "1. ಒಣ ಮೇವು: ದಿನಕ್ಕೆ ಕನಿಷ್ಠ 4-5 ಕೆಜಿ ಒಣ ರಾಗಿ ಅಥವಾ ಭತ್ತದ ಹುಲ್ಲು ನೀಡಿ. ಇದು ಫ್ಯಾಟ್ ಹೆಚ್ಚಿಸಲು ಮುಖ್ಯ.\n"
            "2. ಸರಿಯಾದ ಕತ್ತರಿಸುವಿಕೆ: ಹುಲ್ಲನ್ನು ಅತೀ ಸಣ್ಣದಾಗಿ ಕತ್ತರಿಸಬೇಡಿ (2-3 ಸೆಂ.ಮೀ ಉದ್ದವಿರಲಿ).\n"
            "3. ಹಿಂಡಿ ಬಳಕೆ: ಹತ್ತಿ ಬೀಜದ ಹಿಂಡಿ ಅಥವಾ ಕಡಲೆಕಾಯಿ ಹಿಂಡಿ ಆಹಾರದಲ್ಲಿ ಸೇರಿಸಿ.\n"
            "4. ಪೂರ್ಣ ಹಾಲು ಕರೆಯುವಿಕೆ: ಹಾಲಿನ ಕೊನೆಯ ಹನಿಗಳಲ್ಲಿ ಅತಿ ಹೆಚ್ಚು ಜಿಡ್ಡು (ಫ್ಯಾಟ್) ಇರುತ್ತದೆ. 5-7 ನಿಮಿಷಗಳಲ್ಲಿ ಪೂರ್ಣ ಹಾಲು ಕರೆಯಿರಿ.\n"
            "5. ನಿಯಮಿತ ಖನಿಜ ಮಿಶ್ರಣ ನೀಡುವುದರಿಂದ ಎಸ್‌ಎನ್‌ಎಫ್ ಗುಣಮಟ್ಟ ಹೆಚ್ಚುತ್ತದೆ."
        ),
        "followups": [
            "What feed increases SNF?",
            "Why is evening milk fat often different from morning?",
            "Best time for milking"
        ]
    },
    {
        "keywords": ["deworm", "deworming", "worms", "parasite", "ಕರುಳು ಹುಳು", "ಜಂತುಹುಳು", "ಹುಳು"],
        "en": (
            "Deworming Protocol for Dairy Animals:\n\n"
            "1. Adult Cattle: Deworm twice a year (Pre-monsoon and Post-monsoon).\n"
            "2. Young Calves: First dose at 10–14 days of age, repeated monthly until 6 months of age.\n"
            "3. Rotating Medicines: Rotate broad-spectrum anthelmintics (under vet advice) to prevent parasite drug resistance.\n"
            "4. Benefits: Reduces anemia, restores appetite, improves milk yield by 10–15%, and enhances body coat condition."
        ),
        "kn": (
            "ಜಾನುವಾರುಗಳಿಗೆ ಜಂತುಹುಳು ನಿವಾರಣಾ ಕ್ರಮಗಳು:\n\n"
            "1. ದೊಡ್ಡ ಹಸುಗಳಿಗೆ: ವರ್ಷಕ್ಕೆ 2 ಬಾರಿ (ಮುಂಗಾರು ಆರಂಭದಲ್ಲಿ ಮತ್ತು ಮುಂಗಾರು ಮುಗಿದ ನಂತರ).\n"
            "2. ಎಳೆಯ ಕರುಗಳಿಗೆ: ಜನಿಸಿದ 10-14 ನೇ ದಿನಕ್ಕೆ ಮೊದಲ ಬಾರಿ, ನಂತರ 6 ತಿಂಗಳವರೆಗೆ ಪ್ರತಿ ತಿಂಗಳು.\n"
            "3. ಅನುಕೂಲಗಳು: ಹಸಿವು ಹೆಚ್ಚುತ್ತದೆ, ರಕ್ತಹೀನತೆ ಕಡಿಮೆಯಾಗುತ್ತದೆ ಮತ್ತು ಹಾಲಿನ ಇಳುವರಿ 10-15% ವೃದ್ಧಿಯಾಗುತ್ತದೆ.\n"
            "4. ಸೂಚನೆ: ಪಶುವೈದ್ಯರ ಸಲಹೆಯಂತೆ ಸರಿಯಾದ ಪ್ರಮಾಣದ ಔಷಧಿಯನ್ನು ನೀಡಿ."
        ),
        "followups": [
            "Can pregnant cows be dewormed?",
            "Deworming schedule for calves",
            "Signs of worm infestation"
        ]
    },
    {
        "keywords": ["mastitis", "udder", "clots", "swelling", "ಕೆಚ್ಚಲು", "ಕೆಚ್ಚಲುಬಾವು", "ಹಾಲಿನಲ್ಲಿ ರಕ್ತ", "ಗಂಟು"],
        "en": (
            "Mastitis Prevention & Udder Hygiene Protocol:\n\n"
            "1. Pre-milking: Wash udder with clean water or mild antiseptic potassium permanganate solution; wipe dry with a clean cloth.\n"
            "2. Milking Technique: Use full-hand milking (knuckling harms udder tissue).\n"
            "3. Post-milking: Dip teats in a 0.5% povidone-iodine solution. Keep the cow standing for 30–45 minutes after milking by offering fresh feed, as the teat sphincter remains open.\n"
            "4. Dry Floor: Keep cow shed floor dry, clean, and disinfected with lime powder.\n\n"
            "Emergency: If teat is swollen, painful, or milk has yellow flakes or blood, summon a veterinarian within 6 hours to save the quarter."
        ),
        "kn": (
            "ಕೆಚ್ಚಲು ಬಾವು ರೋಗ ತಡೆಗಟ್ಟುವ ಕ್ರಮಗಳು:\n\n"
            "1. ಹಾಲು ಕರೆಯುವ ಮುನ್ನ: ಕೆಚ್ಚಲನ್ನು ಶುದ್ಧ ನೀರಿನಿಂದ ತೊಳೆದು ಒಣ ಬಟ್ಟೆಯಿಂದ ಒರೆಸಿ.\n"
            "2. ಹಾಲು ಕರೆಯುವ ವಿಧಾನ: ಪೂರ್ಣ ಹಸ್ತದಿಂದ ಹಾಲು ಕರೆಯಿರಿ (ಹೆಬ್ಬೆರಳು ಮಡಚಿ ಕರೆಯಬೇಡಿ).\n"
            "3. ಹಾಲು ಕರೆದ ನಂತರ: ಹಸು ತಕ್ಷಣ ಮಲಗದಂತೆ 30-45 ನಿಮಿಷ ಮೇವು ನೀಡಿ ನಿಲ್ಲಿಸಿ (ತೊಟ್ಟುಗಳ ರಂಧ್ರ ಮುಚ್ಚಿಕೊಳ್ಳಲು ಸಮಯ ಬೇಕು).\n"
            "4. ಕೊಟ್ಟಿಗೆಯ ನೆಲವನ್ನು ಸ್ವಚ್ಛವಾಗಿ ಮತ್ತು ಒಣದಾಗಿ ಇರಿಸಿ.\n\n"
            "ತುರ್ತು: ಕೆಚ್ಚಲು ಊದಿಕೊಂಡಿದ್ದರೆ ಅಥವಾ ಹಾಲಿನಲ್ಲಿ ಗಂಟುಗಳು ಕಂಡರೆ ತಕ್ಷಣವೇ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ."
        ),
        "followups": [
            "What is full-hand milking?",
            "How to test for subclinical mastitis?",
            "How long after milking do teat canals close?"
        ]
    },
    {
        "keywords": ["heat", "insemination", "ai", "breeding", "crossing", "semen", "ಮದ", "ಕೃತಕ ಗರ್ಭಧಾರಣೆ", "ಹಸು ಮದಕ್ಕೆ"],
        "en": (
            "Heat Detection & Optimal Artificial Insemination (AI) Timing:\n\n"
            "1. Primary Sign: 'Standing Heat' (the cow stands firmly when mounted by other animals).\n"
            "2. Secondary Signs: Clear, stringy, transparent mucous discharge from the vulva, continuous restlessness/bellowing, frequent urination, and slight drop in milk yield.\n"
            "3. The AM/PM Rule for AI Insemination:\n"
            "   - If cow comes into heat in the Morning (AM): Inseminate in the Evening (PM).\n"
            "   - If cow comes into heat in the Evening (PM): Inseminate the next Morning (AM).\n"
            "4. Post-AI Care: Avoid sudden stress, provide cool shade, and ensure adequate drinking water.\n\n"
            "Tip: Inseminating 12 to 18 hours after the onset of standing heat gives the highest conception rate (65-75%)."
        ),
        "kn": (
            "ಹಸು ಮದಕ್ಕೆ ಬರುವ ಲಕ್ಷಣಗಳು ಮತ್ತು ಕೃತಕ ಗರ್ಭಧಾರಣೆ (AI) ಸಮಯ:\n\n"
            "1. ಪ್ರಮುಖ ಲಕ್ಷಣ: 'ಸ್ಥಿರ ನಿಲುವು' (ಇತರ ಹಸುಗಳು ಹತ್ತಿದಾಗ ಸ್ಥಿರವಾಗಿ ನಿಲ್ಲುವುದು).\n"
            "2. ಇತರ ಲಕ್ಷಣಗಳು: ಗಾಜಿನಂತೆ ಸ್ವಚ್ಛವಾದ ಲೋಳೆಯ ವಿಸರ್ಜನೆ, ಚಡಪಡಿಕೆ, ಮೇವು ತಿನ್ನದಿರುವುದು ಮತ್ತು ಹಾಲಿನ ಇಳುವರಿ ಸ್ವಲ್ಪ ಇಳಿಕೆ.\n"
            "3. ಕೃತಕ ಗರ್ಭಧಾರಣೆಯ AM/PM ನಿಯಮ:\n"
            "   - ಹಸು ಬೆಳಿಗ್ಗೆ ಮದಕ್ಕೆ ಬಂದರೆ: ಸಂಜೆ ಕೃತಕ ಗರ್ಭಧಾರಣೆ ಮಾಡಿಸಿ.\n"
            "   - ಹಸು ಸಂಜೆ ಮದಕ್ಕೆ ಬಂದರೆ: ಮರುದಿನ ಬೆಳಿಗ್ಗೆ ಗರ್ಭಧಾರಣೆ ಮಾಡಿಸಿ.\n"
            "4. ಕಾಳಜಿ: ಗರ್ಭಧಾರಣೆಯ ನಂತರ ಹಸುವಿಗೆ ತಂಪಾದ ನೆರಳು ಮತ್ತು ಕುಡಿಯಲು ಸಾಕಷ್ಟು ನೀರು ನೀಡಿ."
        ),
        "followups": [
            "What is the AM/PM rule for cattle?",
            "How to detect silent heat in buffaloes?",
            "When should pregnancy diagnosis (PD) be done?"
        ]
    },
    {
        "keywords": ["calf", "calves", "colostrum", "newborn", "navel", "ಕರು", "ಗಿಣ್ಣದ ಹಾಲು", "ಹೊಕ್ಕಳು"],
        "en": (
            "Newborn Calf Care & Colostrum Feeding Protocol:\n\n"
            "1. Clear Airways: Immediately clear mucus from calf's nostrils and mouth upon birth; stimulate breathing by rubbing chest with dry straw.\n"
            "2. Navel Cord Care: Cut navel cord 2 inches from the body with clean sterilized scissors, tie with thread, and dip immediately in 7% Tincture of Iodine to prevent Navel-ill/Joint-ill.\n"
            "3. Golden Colostrum Rule: Feed warm colostrum (mother's first milk) within 1 to 2 hours of birth! Dose: 10% of calf's body weight (approx. 2.5 to 3 Litres).\n"
            "   - Colostrum contains maternal antibodies (immunoglobulins) essential for survival; gut absorption drops sharply after 6 hours.\n"
            "4. Deworming: First deworming dose at 10–14 days of age."
        ),
        "kn": (
            "ನವಜಾತ ಕರುಗಳ ಪಾಲನೆ ಮತ್ತು ಗಿಣ್ಣದ ಹಾಲಿನ ಮಹತ್ವ:\n\n"
            "1. ಜನಿಸಿದ ತಕ್ಷಣ: ಕರುವಿನ ಮೂಗು ಮತ್ತು ಬಾಯಿಯ ಲೋಳೆಯನ್ನು ಶುದ್ಧ ಬಟ್ಟೆಯಿಂದ ಒರೆಸಿ ಉಸಿರಾಟ ಸರಾಗಗೊಳಿಸಿ.\n"
            "2. ಹೊಕ್ಕಳು ಬಳ್ಳಿ ಆರೈಕೆ: ಹೊಕ್ಕಳು ಬಳ್ಳಿಯನ್ನು 2 ಇಂಚು ಬಿಟ್ಟು ಕತ್ತರಿಸಿ ಟಿಂಕ್ಚರ್ ಅಯೋಡಿನ್ ದ್ರಾವಣವನ್ನು ಹಚ್ಚಿ.\n"
            "3. ಗಿಣ್ಣದ ಹಾಲು (Colostrum): ಕರು ಹುಟ್ಟಿದ 1 ರಿಂದ 2 ಗಂಟೆಯೊಳಗೆ ಕಡ್ಡಾಯವಾಗಿ ಗಿಣ್ಣದ ಹಾಲು ಕುಡಿಸಿ (ತೂಕದ 10% ರಷ್ಟು, ಸುಮಾರು 2.5 ರಿಂದ 3 ಲೀಟರ್).\n"
            "   - ಇದು ಕರುವಿಗೆ ರೋಗನಿರೋಧಕ ಶಕ್ತಿ ನೀಡುವ ನೈಸರ್ಗಿಕ ಅಮೃತ.\n"
            "4. ಜಂತುಹುಳು ಔಷಧಿ: 10-14 ನೇ ದಿನಕ್ಕೆ ಮೊದಲ ಬಾರಿಗೆ ನೀಡಿ."
        ),
        "followups": [
            "Why must colostrum be given within 2 hours?",
            "How to treat calf diarrhea / scours?",
            "Feeding milk replacer to calves"
        ]
    }
]

def get_assistant_response(
    query: str,
    language: str = "en",
    cooperative_info: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Answers farmer cattle care inquiries with strict veterinary safety guidelines.
    Uses real LLM when configured, or rich curated knowledge base in local/offline fallback mode.
    """
    lang = "kn" if language in ["kn", "kannada"] else "en"
    clean_query = query.strip().lower()

    vet_contact = {
        "name": cooperative_info.get("vet_doctor_name", "Dr. Ramesh Hegde (KMF Veterinary Officer)") if cooperative_info else "Dr. Ramesh Hegde (KMF Veterinary Officer)",
        "phone": cooperative_info.get("vet_contact_phone", "08182-249012 / 9845123456") if cooperative_info else "08182-249012 / 9845123456",
        "emergency_hours": "6:00 AM - 9:00 PM (Emergency 24x7)"
    }

    # If GEMINI_API_KEY is configured, try live LLM API call
    if settings.GEMINI_API_KEY:
        try:
            import httpx
            system_prompt = (
                "You are DairySathi Cattle Care Assistant, a compassionate and expert veterinary advisor "
                "for rural Indian dairy farmers. Follow these strict rules:\n"
                "1. NEVER make definitive disease diagnoses or prescribe prescription antibiotic dosages.\n"
                "2. Provide clear, practical guidance on nutrition, green/dry fodder, clean water, hygiene, and vaccinations.\n"
                "3. If any danger sign (high fever > 103F, bloat, recumbency, mastitis) is mentioned, immediately escalate to the cooperative vet.\n"
                f"4. Respond in { 'Kannada' if lang == 'kn' else 'English' } using simple, supportive agricultural language.\n"
                f"5. Mention the cooperative vet {vet_contact['name']} ({vet_contact['phone']}) when relevant."
            )
            # Call Gemini API
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            payload = {
                "contents": [
                    {"role": "user", "parts": [{"text": f"System: {system_prompt}\nFarmer Question: {query}"}]}
                ]
            }
            with httpx.Client(timeout=10.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text_resp = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        return {
                            "response": text_resp,
                            "source": "live_llm",
                            "vet_contact": vet_contact,
                            "suggested_followups": [
                                "What should I feed my lactating cow?",
                                "When is the next vaccination camp?",
                                "Signs to contact a vet immediately"
                            ]
                        }
        except Exception as e:
            # Fall back gracefully to curated knowledge base
            pass

    # Curated Knowledge Base Matcher (Offline / Local Mode)
    best_match = None
    max_score = 0

    for item in KNOWLEDGE_BASE:
        score = 0
        for kw in item["keywords"]:
            if kw.lower() in clean_query:
                score += 2
        if score > max_score:
            max_score = score
            best_match = item

    if best_match and max_score > 0:
        reply_text = best_match[lang]
        followups = best_match["followups"]
    else:
        # Default helpful guide
        if lang == "kn":
            reply_text = (
                "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಡೈರಿಸಾಥಿ ಪಶು ಆರೈಕೆ ಸಹಾಯಕ.\n\n"
                "ಹಸುಗಳ ಪೋಷಣೆ, ಹಾಲಿನ ಫ್ಯಾಟ್ ಮತ್ತು ಎಸ್‌ಎನ್‌ಎಫ್ ಹೆಚ್ಚಳ, ಲಸಿಕೆಗಳು, ಜಂತುಹುಳು ನಿವಾರಣೆ "
                "ಹಾಗೂ ಕೆಚ್ಚಲು ಬಾವು ರೋಗ ತಡೆಗಟ್ಟುವ ಕುರಿತು ನಾನು ಮಾಹಿತಿ ನೀಡಬಲ್ಲೆ.\n\n"
                f"ತುರ್ತು ಚಿಕಿತ್ಸೆ ಮತ್ತು ತಪಾಸಣೆಗಾಗಿ ನಿಮ್ಮ ಸಹಕಾರ ಸಂಘದ ಪಶುವೈದ್ಯರಾದ {vet_contact['name']} "
                f"ಅವರನ್ನು ಸಂಪರ್ಕಿಸಿ: {vet_contact['phone']}."
            )
        else:
            reply_text = (
                "Hello! I am your DairySathi Cattle Care Assistant.\n\n"
                "I can guide you on cattle nutrition, improving milk fat & SNF, vaccination schedules, "
                "deworming, and udder hygiene.\n\n"
                f"For clinical diagnosis or prescription care, please contact your cooperative veterinary officer "
                f"{vet_contact['name']} at {vet_contact['phone']}."
            )
        followups = [
            "What should I feed my cow?",
            "When is the next vaccination?",
            "How to increase milk fat and SNF?",
            "What signs mean I should contact a vet?"
        ]

    # Clearly label fallback offline mode with safety disclaimer
    preface = "[Expert Curated Dairy Advisory — Verified Local Mode]\n\n"
    disclaimer = (
        "\n\n⚠️ ಸೂಚನೆ: ಇದು ಸಾಮಾನ್ಯ ಶೈಕ್ಷಣಿಕ ಮಾಹಿತಿಯಾಗಿದೆ. ರೋಗ ಲಕ್ಷಣಗಳಿದ್ದಲ್ಲಿ ಅಥವಾ ತುರ್ತು ಚಿಕಿತ್ಸೆಗೆ ನಿಮ್ಮ ಅಧಿಕೃತ ಪಶುವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ."
        if lang == "kn" else
        "\n\n⚠️ Safety Advisory: DairySathi Assistant provides general educational guidance only and does NOT provide clinical veterinary diagnoses or medication prescriptions. For sick animals, consult your cooperative veterinarian immediately."
    )
    return {
        "response": preface + reply_text + disclaimer,
        "source": "curated_expert_faq",
        "vet_contact": vet_contact,
        "suggested_followups": followups
    }
