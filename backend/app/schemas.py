import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# ----------------- Auth Schemas -----------------
class AdminLoginRequest(BaseModel):
    cooperative_code: str
    username_or_email: str
    password: str

class FarmerLoginRequest(BaseModel):
    cooperative_code: str
    farmer_uid_or_phone: str
    pin: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str # "admin" or "farmer"
    user_id: int
    name: str
    cooperative_id: int
    cooperative_name: str
    cooperative_code: str
    farmer_uid: Optional[str] = None
    language: Optional[str] = "en"

# ----------------- Cooperative Schemas -----------------
class CooperativeResponse(BaseModel):
    id: int
    name: str
    code: str
    locality: str
    district: str
    state: str
    contact_phone: str
    contact_email: Optional[str]
    vet_doctor_name: Optional[str]
    vet_contact_phone: Optional[str]
    address: Optional[str]

    class Config:
        from_attributes = True

# ----------------- Farmer Schemas -----------------
class FarmerCreate(BaseModel):
    farmer_uid: str
    full_name: str
    phone: str
    village: str
    pin_code: Optional[str] = ""
    bank_account_no: Optional[str] = ""
    ifsc_code: Optional[str] = ""
    initial_pin: Optional[str] = "1234"

class FarmerUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    village: Optional[str] = None
    pin_code: Optional[str] = None
    bank_account_no: Optional[str] = None
    ifsc_code: Optional[str] = None
    is_active: Optional[bool] = None

class FarmerResponse(BaseModel):
    id: int
    cooperative_id: int
    farmer_uid: str
    full_name: str
    phone: str
    village: str
    pin_code: Optional[str]
    bank_account_no: Optional[str]
    ifsc_code: Optional[str]
    is_active: bool
    created_at: datetime.datetime
    cattle_count: Optional[int] = 0
    total_litres_month: Optional[float] = 0.0
    pending_payout: Optional[float] = 0.0

    class Config:
        from_attributes = True

# ----------------- Cattle Schemas -----------------
class CattleCreate(BaseModel):
    farmer_id: int
    tag_number: str
    name: str
    breed: str
    age_years: Optional[float] = None
    gender: Optional[str] = "Female"
    milking_status: Optional[str] = "Milking"
    daily_yield_estimate: Optional[float] = 0.0
    health_notes: Optional[str] = None

class CattleUpdate(BaseModel):
    name: Optional[str] = None
    breed: Optional[str] = None
    age_years: Optional[float] = None
    gender: Optional[str] = None
    milking_status: Optional[str] = None
    daily_yield_estimate: Optional[float] = None
    health_notes: Optional[str] = None

class CattleReminderCreate(BaseModel):
    farmer_id: int
    cattle_id: Optional[int] = None
    title: str
    title_kn: Optional[str] = None
    care_type: str # vaccination, deworming, vet_camp, health_check, nutrition
    due_date: datetime.date
    veterinarian_notes: Optional[str] = None

class CattleReminderUpdate(BaseModel):
    status: str # upcoming, completed, overdue
    administered_date: Optional[datetime.date] = None
    veterinarian_notes: Optional[str] = None

class CattleReminderResponse(BaseModel):
    id: int
    cooperative_id: int
    farmer_id: int
    cattle_id: Optional[int]
    cattle_name: Optional[str] = None
    cattle_tag: Optional[str] = None
    title: str
    title_kn: Optional[str]
    care_type: str
    due_date: datetime.date
    status: str
    administered_date: Optional[datetime.date]
    veterinarian_notes: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class CattleResponse(BaseModel):
    id: int
    cooperative_id: int
    farmer_id: int
    farmer_name: Optional[str] = None
    tag_number: str
    name: str
    breed: str
    age_years: Optional[float]
    gender: str
    milking_status: str
    daily_yield_estimate: float
    health_notes: Optional[str]
    reminders: List[CattleReminderResponse] = []
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# ----------------- Milk Collection & Rates -----------------
class MilkRateRuleCreate(BaseModel):
    base_rate: float
    base_fat: float = 4.0
    base_snf: float = 8.5
    fat_rate_step: float = 0.40
    snf_rate_step: float = 0.25
    min_fat: float = 3.0
    min_snf: float = 7.5
    effective_date: datetime.date = Field(default_factory=datetime.date.today)

class MilkRateRuleResponse(BaseModel):
    id: int
    cooperative_id: int
    base_rate: float
    base_fat: float
    base_snf: float
    fat_rate_step: float
    snf_rate_step: float
    min_fat: float
    min_snf: float
    effective_date: datetime.date
    is_active: bool

    class Config:
        from_attributes = True

class MilkCollectionCreate(BaseModel):
    farmer_id: int
    collection_date: datetime.date
    session: str # morning, evening
    quantity_litres: float
    fat_percentage: Optional[float] = None
    snf_percentage: Optional[float] = None
    notes: Optional[str] = None

class MilkCollectionCorrection(BaseModel):
    quantity_litres: float
    fat_percentage: Optional[float] = None
    snf_percentage: Optional[float] = None
    reason: str
    notes: Optional[str] = None

class MilkAuditResponse(BaseModel):
    id: int
    collection_id: int
    admin_id: Optional[int]
    previous_quantity: float
    new_quantity: float
    previous_fat: Optional[float]
    new_fat: Optional[float]
    previous_snf: Optional[float]
    new_snf: Optional[float]
    previous_amount: float
    new_amount: float
    reason: str
    corrected_at: datetime.datetime

    class Config:
        from_attributes = True

class MilkCollectionResponse(BaseModel):
    id: int
    cooperative_id: int
    farmer_id: int
    farmer_name: Optional[str] = None
    farmer_uid: Optional[str] = None
    collection_date: datetime.date
    session: str
    quantity_litres: float
    fat_percentage: Optional[float]
    snf_percentage: Optional[float]
    rate_per_litre: float
    total_amount: float
    payment_status: str
    notes: Optional[str]
    created_at: datetime.datetime
    updated_at: datetime.datetime
    audits: List[MilkAuditResponse] = []

    class Config:
        from_attributes = True

# ----------------- Payments & Settlements -----------------
class SettlementCreate(BaseModel):
    farmer_id: int
    period_start: datetime.date
    period_end: datetime.date
    payment_mode: str = "Direct Deposit"
    reference_no: Optional[str] = None

class SettlementUpdate(BaseModel):
    status: str # pending, approved, completed
    paid_amount: Optional[float] = None
    payment_date: Optional[datetime.date] = None
    reference_no: Optional[str] = None

class PaymentSettlementResponse(BaseModel):
    id: int
    cooperative_id: int
    farmer_id: int
    farmer_name: Optional[str] = None
    farmer_uid: Optional[str] = None
    period_start: datetime.date
    period_end: datetime.date
    total_litres: float
    calculated_amount: float
    approved_amount: float
    paid_amount: float
    payment_mode: str
    reference_no: Optional[str]
    payment_date: Optional[datetime.date]
    status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# ----------------- SMS Campaign Schemas -----------------
class SMSPreviewRequest(BaseModel):
    title: str
    message: str
    target_audience: str # all, locality, individual
    target_locality: Optional[str] = None
    target_farmer_id: Optional[int] = None

class SMSPreviewResponse(BaseModel):
    recipient_count: int
    estimated_parts: int
    sample_recipients: List[Dict[str, str]]
    message_length: int
    is_unicode: bool
    is_mock_gateway: bool
    mock_banner: str

class SMSCampaignCreate(BaseModel):
    title: str
    message: str
    target_audience: str # all, locality, individual
    target_locality: Optional[str] = None
    target_farmer_id: Optional[int] = None

class SMSCampaignResponse(BaseModel):
    id: int
    cooperative_id: int
    title: str
    message: str
    target_audience: str
    target_locality: Optional[str]
    recipient_count: int
    is_mock_delivery: bool
    delivery_status: str
    sent_at: datetime.datetime
    notes: Optional[str]

    class Config:
        from_attributes = True

# ----------------- Notifications & Assistant -----------------
class NotificationResponse(BaseModel):
    id: int
    cooperative_id: int
    farmer_id: Optional[int]
    title: str
    title_kn: Optional[str]
    message: str
    message_kn: Optional[str]
    category: str
    is_read: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class AssistantChatRequest(BaseModel):
    message: str
    language: str = "en" # "en" or "kn"
    farmer_id: Optional[int] = None

class AssistantChatResponse(BaseModel):
    response: str
    response_kn: Optional[str] = None
    source: str # "live_llm" or "curated_expert_faq"
    vet_contact: Optional[Dict[str, str]] = None
    suggested_followups: List[str] = []

class PassbookSummaryResponse(BaseModel):
    farmer_id: int
    farmer_name: str
    farmer_uid: str
    cooperative_name: str
    cooperative_code: str
    total_litres: float
    avg_fat: float
    avg_snf: float
    total_earnings: float
    paid_amount: float
    pending_amount: float
    records: List[MilkCollectionResponse]
