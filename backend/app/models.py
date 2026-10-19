import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Cooperative(Base):
    __tablename__ = "cooperatives"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    locality = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False, default="Shivamogga")
    state = Column(String(100), nullable=False, default="Karnataka")
    contact_phone = Column(String(20), nullable=False)
    contact_email = Column(String(100), nullable=True)
    vet_doctor_name = Column(String(150), nullable=True)
    vet_contact_phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    admins = relationship("AdminUser", back_populates="cooperative", cascade="all, delete-orphan")
    farmers = relationship("Farmer", back_populates="cooperative", cascade="all, delete-orphan")
    rate_rules = relationship("MilkRateRule", back_populates="cooperative", cascade="all, delete-orphan")
    collections = relationship("MilkCollection", back_populates="cooperative", cascade="all, delete-orphan")
    cattle = relationship("Cattle", back_populates="cooperative", cascade="all, delete-orphan")
    reminders = relationship("CattleReminder", back_populates="cooperative", cascade="all, delete-orphan")
    settlements = relationship("PaymentSettlement", back_populates="cooperative", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="cooperative", cascade="all, delete-orphan")
    sms_campaigns = relationship("SMSCampaign", back_populates="cooperative", cascade="all, delete-orphan")


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    cooperative_id = Column(Integer, ForeignKey("cooperatives.id"), nullable=False, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(50), default="admin") # admin, supervisor
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    cooperative = relationship("Cooperative", back_populates="admins")


class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    cooperative_id = Column(Integer, ForeignKey("cooperatives.id"), nullable=False, index=True)
    farmer_uid = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=False, index=True)
    village = Column(String(100), nullable=False, index=True)
    pin_code = Column(String(10), nullable=True)
    bank_account_no = Column(String(50), nullable=True)
    ifsc_code = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    cooperative = relationship("Cooperative", back_populates="farmers")
    account = relationship("FarmerAccount", back_populates="farmer", uselist=False, cascade="all, delete-orphan")
    cattle = relationship("Cattle", back_populates="farmer", cascade="all, delete-orphan")
    collections = relationship("MilkCollection", back_populates="farmer", cascade="all, delete-orphan")
    reminders = relationship("CattleReminder", back_populates="farmer", cascade="all, delete-orphan")
    settlements = relationship("PaymentSettlement", back_populates="farmer", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="farmer", cascade="all, delete-orphan")


class FarmerAccount(Base):
    __tablename__ = "farmer_accounts"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), unique=True, nullable=False, index=True)
    pin_hash = Column(String(255), nullable=False)
    language_preference = Column(String(10), default="en") # en, kn
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)

    farmer = relationship("Farmer", back_populates="account")


class Cattle(Base):
    __tablename__ = "cattle"

    id = Column(Integer, primary_key=True, index=True)
    cooperative_id = Column(Integer, ForeignKey("cooperatives.id"), nullable=False, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False, index=True)
    tag_number = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    breed = Column(String(100), nullable=False)
    age_years = Column(Float, nullable=True)
    gender = Column(String(20), default="Female") # Female, Male
    milking_status = Column(String(50), default="Milking") # Milking, Dry, Pregnant, Heifer
    daily_yield_estimate = Column(Float, default=0.0)
    health_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    cooperative = relationship("Cooperative", back_populates="cattle")
    farmer = relationship("Farmer", back_populates="cattle")
    reminders = relationship("CattleReminder", back_populates="cattle", cascade="all, delete-orphan")


class CattleReminder(Base):
    __tablename__ = "cattle_reminders"

    id = Column(Integer, primary_key=True, index=True)
    cooperative_id = Column(Integer, ForeignKey("cooperatives.id"), nullable=False, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False, index=True)
    cattle_id = Column(Integer, ForeignKey("cattle.id"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    title_kn = Column(String(250), nullable=True)
    care_type = Column(String(50), nullable=False) # vaccination, deworming, vet_camp, health_check, nutrition
    due_date = Column(Date, nullable=False, index=True)
    status = Column(String(30), default="upcoming") # upcoming, completed, overdue
    administered_date = Column(Date, nullable=True)
    veterinarian_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    cooperative = relationship("Cooperative", back_populates="reminders")
    farmer = relationship("Farmer", back_populates="reminders")
    cattle = relationship("Cattle", back_populates="reminders")


class MilkRateRule(Base):
    __tablename__ = "milk_rate_rules"

    id = Column(Integer, primary_key=True, index=True)
    cooperative_id = Column(Integer, ForeignKey("cooperatives.id"), nullable=False, index=True)
    rule_name = Column(String(100), nullable=False, default="Standard Quality Matrix (Demo)")
    version = Column(String(20), nullable=False, default="1.0")
    calculation_method = Column(String(50), nullable=False, default="fat_snf_formula") # "fat_snf_formula" or "flat_rate"
    flat_rate = Column(Float, nullable=False, default=40.0) # Used when calculation_method == 'flat_rate'
    base_rate = Column(Float, nullable=False, default=40.0) # Base rate per litre at standard quality
    base_fat = Column(Float, nullable=False, default=4.0)
    base_snf = Column(Float, nullable=False, default=8.5)
    fat_rate_step = Column(Float, nullable=False, default=0.45) # Rate adjustment per 0.1% fat diff
    snf_rate_step = Column(Float, nullable=False, default=0.30) # Rate adjustment per 0.1% snf diff
    min_fat = Column(Float, nullable=False, default=2.0)
    max_fat = Column(Float, nullable=False, default=12.0)
    min_snf = Column(Float, nullable=False, default=5.0)
    max_snf = Column(Float, nullable=False, default=12.0)
    min_rate = Column(Float, nullable=False, default=20.0)
    max_rate = Column(Float, nullable=False, default=80.0)
    effective_date = Column(Date, nullable=False, default=datetime.date.today)
    effective_to = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    created_by_admin_id = Column(Integer, ForeignKey("admin_users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    cooperative = relationship("Cooperative", back_populates="rate_rules")
    creator = relationship("AdminUser")


class MilkCollection(Base):
    __tablename__ = "milk_collections"

    id = Column(Integer, primary_key=True, index=True)
    cooperative_id = Column(Integer, ForeignKey("cooperatives.id"), nullable=False, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False, index=True)
    collection_date = Column(Date, nullable=False, index=True)
    session = Column(String(20), nullable=False) # morning, evening
    quantity_litres = Column(Float, nullable=False)
    fat_percentage = Column(Float, nullable=True)
    snf_percentage = Column(Float, nullable=True)
    rate_per_litre = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    rate_rule_id = Column(Integer, ForeignKey("milk_rate_rules.id"), nullable=True)
    calculation_method = Column(String(50), default="fat_snf_formula") # "fat_snf_formula" or "flat_rate"
    record_status = Column(String(30), default="recorded") # "recorded", "corrected"
    payment_status = Column(String(30), default="pending") # pending, approved, settled
    settlement_id = Column(Integer, nullable=True)
    recorded_by_admin_id = Column(Integer, ForeignKey("admin_users.id"), nullable=True)
    correction_reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    cooperative = relationship("Cooperative", back_populates="collections")
    farmer = relationship("Farmer", back_populates="collections")
    rate_rule = relationship("MilkRateRule")
    audits = relationship("MilkRecordAudit", back_populates="collection", cascade="all, delete-orphan")


class MilkRecordAudit(Base):
    __tablename__ = "milk_record_audits"

    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("milk_collections.id"), nullable=False, index=True)
    admin_id = Column(Integer, ForeignKey("admin_users.id"), nullable=True)
    previous_quantity = Column(Float, nullable=False)
    new_quantity = Column(Float, nullable=False)
    previous_fat = Column(Float, nullable=True)
    new_fat = Column(Float, nullable=True)
    previous_snf = Column(Float, nullable=True)
    new_snf = Column(Float, nullable=True)
    previous_rate = Column(Float, nullable=True)
    new_rate = Column(Float, nullable=True)
    previous_amount = Column(Float, nullable=False)
    new_amount = Column(Float, nullable=False)
    reason = Column(String(255), nullable=False)
    corrected_at = Column(DateTime, default=datetime.datetime.utcnow)

    collection = relationship("MilkCollection", back_populates="audits")
    admin = relationship("AdminUser")


class PaymentSettlement(Base):
    __tablename__ = "payment_settlements"

    id = Column(Integer, primary_key=True, index=True)
    cooperative_id = Column(Integer, ForeignKey("cooperatives.id"), nullable=False, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False, index=True)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    total_litres = Column(Float, nullable=False)
    calculated_amount = Column(Float, nullable=False)
    approved_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0.0)
    payment_mode = Column(String(50), default="Direct Deposit") # Direct Deposit, Bank Transfer, Cash
    reference_no = Column(String(100), nullable=True)
    payment_date = Column(Date, nullable=True)
    status = Column(String(30), default="pending") # pending, approved, completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    cooperative = relationship("Cooperative", back_populates="settlements")
    farmer = relationship("Farmer", back_populates="settlements")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    cooperative_id = Column(Integer, ForeignKey("cooperatives.id"), nullable=False, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=True, index=True) # None = all farmers in cooperative
    title = Column(String(200), nullable=False)
    title_kn = Column(String(250), nullable=True)
    message = Column(Text, nullable=False)
    message_kn = Column(Text, nullable=True)
    category = Column(String(50), default="milk") # milk, payment, cattle, announcement
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    cooperative = relationship("Cooperative", back_populates="notifications")
    farmer = relationship("Farmer", back_populates="notifications")


class SMSCampaign(Base):
    __tablename__ = "sms_campaigns"

    id = Column(Integer, primary_key=True, index=True)
    cooperative_id = Column(Integer, ForeignKey("cooperatives.id"), nullable=False, index=True)
    admin_id = Column(Integer, ForeignKey("admin_users.id"), nullable=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    target_audience = Column(String(50), default="all") # all, locality, individual
    target_locality = Column(String(100), nullable=True)
    target_farmer_id = Column(Integer, nullable=True)
    recipient_count = Column(Integer, default=0)
    is_mock_delivery = Column(Boolean, default=True)
    delivery_status = Column(String(50), default="Simulated Delivered")
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(Text, nullable=True)

    cooperative = relationship("Cooperative", back_populates="sms_campaigns")


class CattleRequest(Base):
    __tablename__ = "cattle_requests"

    id = Column(Integer, primary_key=True, index=True)
    cooperative_id = Column(Integer, ForeignKey("cooperatives.id"), nullable=False, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False, index=True)
    request_type = Column(String(50), nullable=False) # new_cattle, correction, health_report
    details = Column(Text, nullable=False)
    status = Column(String(30), default="pending") # pending, approved, rejected
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
