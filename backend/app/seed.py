import datetime
import random
from app.database import SessionLocal, Base, engine
from app import models
from app.security import hash_password
from app.routers.rates import compute_rate

def seed_database():
    print("Creating tables if not exists...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if already seeded
        existing_coop = db.query(models.Cooperative).filter_by(code="KMF-MLN-108").first()
        if existing_coop:
            print("Database already contains seed data for KMF-MLN-108. Skipping re-seed.")
            return

        print("Seeding Nandini Malnad Cooperative...")
        coop = models.Cooperative(
            name="Nandini Malnad Dairy Cooperative Society Ltd.",
            code="KMF-MLN-108",
            locality="Shivamogga Rural",
            district="Shivamogga",
            state="Karnataka",
            contact_phone="08182-249012",
            contact_email="malnad.coop@kmfdairy.org",
            vet_doctor_name="Dr. Ramesh Hegde (Senior Veterinary Officer)",
            vet_contact_phone="9845123456",
            address="APMC Yard Road, Near Milk Chilling Centre, Shivamogga, Karnataka - 577201"
        )
        db.add(coop)
        db.flush()

        print("Seeding Admin Account...")
        admin = models.AdminUser(
            cooperative_id=coop.id,
            username="admin",
            email="admin@dairysathi.com",
            password_hash=hash_password("admin123"), # Development credentials
            full_name="Somashekar Aradhya (Secretary)",
            role="admin",
            is_active=True
        )
        db.add(admin)
        db.flush()

        print("Seeding Rate Rule...")
        rate_rule = models.MilkRateRule(
            cooperative_id=coop.id,
            base_rate=41.0,
            base_fat=4.0,
            base_snf=8.5,
            fat_rate_step=0.45,
            snf_rate_step=0.30,
            min_fat=3.0,
            min_snf=7.5,
            effective_date=datetime.date.today() - datetime.timedelta(days=60),
            is_active=True
        )
        db.add(rate_rule)
        db.flush()

        print("Seeding Farmers...")
        farmers_data = [
            {
                "uid": "DS-FARM-101",
                "name": "Basavaraj Patil",
                "phone": "9845012345",
                "village": "Hosahalli",
                "pin_code": "577202",
                "bank": "30918274615",
                "ifsc": "SBIN0001234",
                "lang": "kn",
                "cows": [
                    ("KA-14-GIR-01", "Ganga", "Gir", 4.5, "Milking", 14.0, "High yielding native breed, calm temperament."),
                    ("KA-14-HF-02", "Kaveri", "Holstein Friesian", 3.2, "Milking", 18.5, "Peak lactation stage, daily yield ~18L."),
                    ("KA-14-HEIF-03", "Bhavani", "Gir Cross", 1.2, "Heifer", 0.0, "Young heifer, vaccinated against Brucellosis.")
                ]
            },
            {
                "uid": "DS-FARM-102",
                "name": "Manjula Gowda",
                "phone": "9845023456",
                "village": "Hosahalli",
                "pin_code": "577202",
                "bank": "40192837461",
                "ifsc": "CNRB0002345",
                "lang": "kn",
                "cows": [
                    ("KA-14-MUR-04", "Lakshmi", "Murrah Buffalo", 5.0, "Milking", 11.0, "High fat milk producer (7.5% fat average)."),
                    ("KA-14-JER-05", "Gauri", "Jersey", 3.8, "Milking", 15.0, "Consistent yield, sweet milk.")
                ]
            },
            {
                "uid": "DS-FARM-103",
                "name": "Suresh Kumar",
                "phone": "9845034567",
                "village": "Bhadravati",
                "pin_code": "577301",
                "bank": "50192837462",
                "ifsc": "BARB0BHADRA",
                "lang": "en",
                "cows": [
                    ("KA-14-HF-06", "Kamadhenu", "Holstein Friesian", 4.0, "Milking", 20.0, "Excellent producer, requires regular mineral mix."),
                    ("KA-14-SAH-07", "Shanti", "Sahiwal", 3.5, "Dry", 0.0, "In dry period, expected calving in 6 weeks.")
                ]
            },
            {
                "uid": "DS-FARM-104",
                "name": "Devendrappa K",
                "phone": "9845045678",
                "village": "Shivamogga Rural",
                "pin_code": "577204",
                "bank": "60192837463",
                "ifsc": "SBIN0004567",
                "lang": "kn",
                "cows": [
                    ("KA-14-GIR-08", "Kalyani", "Gir", 4.2, "Milking", 13.0, "Strong immunity, grazing oriented.")
                ]
            },
            {
                "uid": "DS-FARM-105",
                "name": "Parvathamma N",
                "phone": "9845056789",
                "village": "Bhadravati",
                "pin_code": "577301",
                "bank": "70192837464",
                "ifsc": "CNRB0005678",
                "lang": "en",
                "cows": [
                    ("KA-14-JER-09", "Radha", "Jersey Cross", 3.0, "Milking", 12.5, "Healthy young cow.")
                ]
            }
        ]

        created_farmers = []
        for fdata in farmers_data:
            f = models.Farmer(
                cooperative_id=coop.id,
                farmer_uid=fdata["uid"],
                full_name=fdata["name"],
                phone=fdata["phone"],
                village=fdata["village"],
                pin_code=fdata["pin_code"],
                bank_account_no=fdata["bank"],
                ifsc_code=fdata["ifsc"],
                is_active=True
            )
            db.add(f)
            db.flush()

            # Account
            acc = models.FarmerAccount(
                farmer_id=f.id,
                pin_hash=hash_password("1234"), # Development PIN for farmers
                language_preference=fdata["lang"],
                is_active=True
            )
            db.add(acc)

            # Cattle
            for c_tag, c_name, c_breed, c_age, c_status, c_yield, c_notes in fdata["cows"]:
                cow = models.Cattle(
                    cooperative_id=coop.id,
                    farmer_id=f.id,
                    tag_number=c_tag,
                    name=c_name,
                    breed=c_breed,
                    age_years=c_age,
                    gender="Female",
                    milking_status=c_status,
                    daily_yield_estimate=c_yield,
                    health_notes=c_notes
                )
                db.add(cow)
                db.flush()

                # Cattle reminder
                due = datetime.date.today() + datetime.timedelta(days=random.randint(4, 18))
                rem = models.CattleReminder(
                    cooperative_id=coop.id,
                    farmer_id=f.id,
                    cattle_id=cow.id,
                    title=f"Foot & Mouth (FMD) Booster for {cow.name}",
                    title_kn=f"{cow.name} ಗೆ ಕಾಲುಬಾಯಿ ರೋಗದ ಲಸಿಕೆ",
                    care_type="vaccination",
                    due_date=due,
                    status="upcoming",
                    veterinarian_notes="Bi-annual national immunization drive. Ensure animal is healthy before vaccination."
                )
                db.add(rem)

            created_farmers.append(f)

        print("Seeding Past Milk Collection Records (Past 14 Days)...")
        today = datetime.date.today()
        for f in created_farmers:
            base_yield = 10.0 if f.farmer_uid in ["DS-FARM-101", "DS-FARM-103"] else 6.5
            for day_offset in range(13, -1, -1):
                c_date = today - datetime.timedelta(days=day_offset)

                # Morning session
                m_qty = round(base_yield + random.uniform(-1.0, 1.5), 1)
                m_fat = round(random.uniform(3.9, 4.4), 1)
                m_snf = round(random.uniform(8.4, 8.7), 1)
                m_rate = compute_rate(rate_rule, m_fat, m_snf)
                m_amt = round(m_qty * m_rate, 2)
                # Settle first 7 days, keep last 7 days pending
                m_status = "settled" if day_offset >= 7 else "pending"

                coll_m = models.MilkCollection(
                    cooperative_id=coop.id,
                    farmer_id=f.id,
                    collection_date=c_date,
                    session="morning",
                    quantity_litres=m_qty,
                    fat_percentage=m_fat,
                    snf_percentage=m_snf,
                    rate_per_litre=m_rate,
                    total_amount=m_amt,
                    payment_status=m_status,
                    recorded_by_admin_id=admin.id
                )
                db.add(coll_m)

                # Evening session (skip today evening if still afternoon)
                if day_offset > 0:
                    e_qty = round(base_yield * 0.85 + random.uniform(-0.8, 1.2), 1)
                    e_fat = round(random.uniform(4.0, 4.6), 1) # Evening fat often slightly higher
                    e_snf = round(random.uniform(8.5, 8.8), 1)
                    e_rate = compute_rate(rate_rule, e_fat, e_snf)
                    e_amt = round(e_qty * e_rate, 2)
                    e_status = "settled" if day_offset >= 7 else "pending"

                    coll_e = models.MilkCollection(
                        cooperative_id=coop.id,
                        farmer_id=f.id,
                        collection_date=c_date,
                        session="evening",
                        quantity_litres=e_qty,
                        fat_percentage=e_fat,
                        snf_percentage=e_snf,
                        rate_per_litre=e_rate,
                        total_amount=e_amt,
                        payment_status=e_status,
                        recorded_by_admin_id=admin.id
                    )
                    db.add(coll_e)

        print("Seeding Completed Past Payment Settlements...")
        period_start = today - datetime.timedelta(days=14)
        period_end = today - datetime.timedelta(days=7)
        for f in created_farmers:
            settlement = models.PaymentSettlement(
                cooperative_id=coop.id,
                farmer_id=f.id,
                period_start=period_start,
                period_end=period_end,
                total_litres=115.0,
                calculated_amount=4850.00,
                approved_amount=4850.00,
                paid_amount=4850.00,
                payment_mode="Direct Deposit",
                reference_no=f"NEFT-KMF-{random.randint(100000, 999999)}",
                payment_date=today - datetime.timedelta(days=6),
                status="completed"
            )
            db.add(settlement)

        print("Seeding In-App Notifications...")
        for f in created_farmers:
            n1 = models.Notification(
                cooperative_id=coop.id,
                farmer_id=f.id,
                title="Weekly Payment Credited",
                title_kn="ವಾರದ ಹಾಲಿನ ಹಣ ಜಮೆಯಾಗಿದೆ",
                message="Your milk settlement for last week (₹4,850.00) was credited to your bank account via NEFT.",
                message_kn="ಕಳೆದ ವಾರದ ಹಾಲಿನ ಪಾವತಿ ₹4,850.00 ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ NEFT ಮೂಲಕ ಜಮೆಯಾಗಿದೆ.",
                category="payment"
            )
            n2 = models.Notification(
                cooperative_id=coop.id,
                farmer_id=f.id,
                title="Free Vaccination Camp on 25th",
                title_kn="ಉಚಿತ ಜಾನುವಾರು ಲಸಿಕಾ ಶಿಬಿರ",
                message="KMF Veterinary team will visit Hosahalli dairy chilling centre this Saturday for free FMD & Black Quarter vaccination.",
                message_kn="ಈ ಶನಿವಾರ ಹೊಸಹಳ್ಳಿ ಹಾಲು ಕೇಂದ್ರದಲ್ಲಿ ಉಚಿತ ಕಾಲುಬಾಯಿ ರೋಗ ಮತ್ತು ಚಪ್ಪೆ ರೋಗ ಲಸಿಕಾ ಶಿಬಿರ ನಡೆಯಲಿದೆ.",
                category="cattle"
            )
            db.add(n1)
            db.add(n2)

        print("Seeding Past SMS Campaigns...")
        sms1 = models.SMSCampaign(
            cooperative_id=coop.id,
            admin_id=admin.id,
            title="Karnataka Pashu Bhagya Scheme 2026",
            message="Govt of Karnataka announces 50% subsidy under Pashu Bhagya Scheme for purchase of crossbred dairy cattle. Submit applications at cooperative office by Oct 30.",
            target_audience="all",
            recipient_count=len(created_farmers),
            is_mock_delivery=True,
            delivery_status="Simulated Delivered",
            notes="Logged in development mock mode. Real SMS API key not configured."
        )
        db.add(sms1)

        db.commit()
        print("Database seeding completed successfully!")
        print("Sample Admin: admin@dairysathi.com (or username 'admin') | Password: 'admin123' | Coop Code: 'KMF-MLN-108'")
        print("Sample Farmer: Farmer ID 'DS-FARM-101' (Basavaraj Patil) | PIN: '1234' | Coop Code: 'KMF-MLN-108'")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
