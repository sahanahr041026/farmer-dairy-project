from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.security import get_current_user_payload
from app.assistant_service import get_assistant_response

router = APIRouter(prefix="/assistant", tags=["Cattle Care Assistant"])

@router.get("/suggestions")
def get_suggested_prompts(language: str = "en"):
    if language in ["kn", "kannada"]:
        return [
            {"text": "ಹಾಲು ಕೊಡುವ ಹಸುವಿಗೆ ಏನು ಪೌಷ್ಟಿಕ ಆಹಾರ ನೀಡಬೇಕು?", "category": "nutrition"},
            {"text": "ಮುಂದಿನ ಕಾಲುಬಾಯಿ ರೋಗದ ಲಸಿಕೆ ಯಾವಾಗ ನೀಡಬೇಕು?", "category": "vaccination"},
            {"text": "ಹಾಲಿನ ಫ್ಯಾಟ್ ಮತ್ತು ಎಸ್‌ಎನ್‌ಎಫ್ ಹೆಚ್ಚಿಸುವುದು ಹೇಗೆ?", "category": "milk_quality"},
            {"text": "ಹಸು ಮದಕ್ಕೆ ಬಂದಾಗ ಗರ್ಭಧಾರಣೆ ಯಾವಾಗ ಮಾಡಿಸಬೇಕು?", "category": "breeding"},
            {"text": "ಕರು ಜನಿಸಿದ ತಕ್ಷಣ ಗಿಣ್ಣದ ಹಾಲು ಎಷ್ಟು ಕುಡಿಸಬೇಕು?", "category": "calf_care"},
            {"text": "ಪಶುವೈದ್ಯರನ್ನು ತುರ್ತಾಗಿ ಯಾವಾಗ ಸಂಪರ್ಕಿಸಬೇಕು?", "category": "emergency"},
            {"text": "ಕೆಚ್ಚಲು ಬಾವು ರೋಗ ತಡೆಗಟ್ಟುವುದು ಹೇಗೆ?", "category": "health"}
        ]
    return [
        {"text": "What should I feed my lactating cow?", "category": "nutrition"},
        {"text": "When is the next vaccination camp scheduled?", "category": "vaccination"},
        {"text": "How do I improve milk fat and SNF percentage?", "category": "milk_quality"},
        {"text": "What is the optimal timing for Artificial Insemination (AI)?", "category": "breeding"},
        {"text": "How much colostrum should a newborn calf receive?", "category": "calf_care"},
        {"text": "What emergency signs mean I must contact a vet?", "category": "emergency"},
        {"text": "How to prevent and detect mastitis early?", "category": "health"}
    ]

@router.post("/chat", response_model=schemas.AssistantChatResponse)
def chat_with_assistant(
    data: schemas.AssistantChatRequest,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    coop_id = payload.get("cooperative_id")
    coop = db.query(models.Cooperative).filter(models.Cooperative.id == coop_id).first()

    coop_info = {
        "name": coop.name if coop else "",
        "vet_doctor_name": coop.vet_doctor_name if coop else "",
        "vet_contact_phone": coop.vet_contact_phone if coop else ""
    }

    resp = get_assistant_response(
        query=data.message,
        language=data.language,
        cooperative_info=coop_info
    )

    return schemas.AssistantChatResponse(
        response=resp["response"],
        source=resp["source"],
        vet_contact=resp["vet_contact"],
        suggested_followups=resp["suggested_followups"]
    )
