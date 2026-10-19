# DairySathi (ಡೈರಿಸಾಥಿ) — Dairy Cooperative Management & Cattle Care Assistant

**DairySathi** is an accessible, bilingual, full-stack web application designed for Indian dairy farmers and cooperative societies. It bridges rural farmers with cooperative administration through real-time milk data synchronization, digital PDF e-passbooks, cattle health tracking, a safety-guarded cattle care assistant, and targeted SMS announcements.

---

## 1. System Architecture

The platform connects two distinct, synchronized interfaces through a unified backend and database:

1. **Farmer Portal (Mobile-First):**
   - Accessible to users with low digital literacy: simple terminology ("My Milk", "My Payments", "My Cows", "Ask for Help"), large $\ge 48\text{px}$ touch targets, and full bilingual support (English & Kannada).
   - Audio accessibility: Integrated text-to-speech (TTS) speaker buttons and speech recognition (STT) voice input.
   - Real-time daily milk collection logs with session tracking (Morning & Evening), butterfat %, SNF %, rates, and payment statuses.
   - Downloadable, print-friendly digital PDF E-Passbook certified with cooperative registration stamps.
   - Registered cattle herd management, vaccination & deworming reminders, and correction request submission.
   - **Ask DairySathi:** Bilingual cattle care assistant with strictly enforced veterinary escalation and knowledge-base fallback.
   - Real-time in-app notification center.

2. **Dairy Cooperative Admin Portal:**
   - Multi-tenant authenticated dashboard isolated by unique Cooperative Code (e.g., `KMF-MLN-108`).
   - Executive operations dashboard: Registered farmers, daily intake (morning/evening), monthly turnover, pending payouts, and upcoming vaccination schedules.
   - Interactive SVG analytics charts for daily collection intake trends and butterfat quality distribution.
   - Farmer management: Registration, KYC/bank accounts, linked herd profiles, and ledger status.
   - Milk collection recording with dynamic quality rate calculation and duplicate entry prevention.
   - Audit trail for milk record adjustments with mandatory reason logging.
   - Milk rate matrix configuration (Base Rate, Fat Step, SNF Step) with an interactive rate simulator.
   - Payment settlement generator: Batch payment calculation, NEFT/direct deposit confirmation, and auto-sync to 'settled' status.
   - Cattle care coordination: Schedule vaccination camps and track overdue schedules.
   - Audit reports with custom date-range CSV data exports.
   - **SMS Notifications (Last Menu Item):** Broadcast announcements for government schemes (e.g. *Karnataka Pashu Bhagya*), health camps, and payment alerts, complete with character calculation, interactive smartphone preview, recipient confirmation, and clearly labeled simulated/live delivery modes.

---

## 2. Design System & Accessibility

| Element | Specification | Value / Description |
| :--- | :--- | :--- |
| **Primary Color** | Forest Green | `#245C3A` |
| **Secondary Color** | Fresh Leaf Green | `#6FAF68` |
| **Page Background** | Warm Cream | `#F8F7EF` |
| **Cards & Surfaces** | Pure White | `#FFFFFF` |
| **Accent / Highlight** | Golden Yellow | `#F2C45A` |
| **Text Primary** | Dark Charcoal | `#24332A` |
| **Status / Alert** | Accessible Amber & Red | `#D97706` / `#DC2626` |
| **Typography** | Sans-Serif | `Plus Jakarta Sans` & `Noto Sans Kannada` |
| **Minimum Touch Target** | Mobile Usability | $48 \times 48\text{ CSS pixels}$ |

---

## 3. Technology Stack

- **Frontend:** React 18, Vite, React Router DOM v6, Custom Responsive SVG Charts, Web Speech API (TTS & STT).
- **Backend:** Python FastAPI, Starlette, Pydantic v2.
- **Database:** PostgreSQL (with `psycopg` driver) / SQLite fallback supported via SQLAlchemy ORM.
- **PDF Generation:** Pure Python standards-compliant PDF 1.4 document builder (`app/pdf_service.py`), generating verified binary PDFs with cooperative emblems, tabular logs, and summaries without external binary dependencies.
- **Security:** HMAC-SHA256 JWT tokens, PBKDF2 password hashing with cryptographically random salts, tenant-level cooperative isolation, and farmer data access restrictions.

---

## 4. Academic Demo & Development Seed Credentials

The database is pre-seeded with realistic sample data for an authorized Karnataka dairy cooperative society:

### Cooperative Profile
- **Cooperative Name:** Nandini Malnad Dairy Cooperative Society Ltd.
- **Cooperative Code:** `KMF-MLN-108`
- **Locality:** Shivamogga Rural, Karnataka
- **Senior Veterinary Officer:** Dr. Ramesh Hegde (`08182-249012` / `9845123456`)

### Admin Account
- **Cooperative Code:** `KMF-MLN-108`
- **Username / Email:** `admin` or `admin@dairysathi.com`
- **Password:** `admin123`

### Sample Farmer Accounts (PIN: `1234`)
| Farmer UID | Full Name | Village | Registered Cattle | Language |
| :--- | :--- | :--- | :--- | :--- |
| `DS-FARM-101` | Basavaraj Patil | Hosahalli | Ganga (Gir), Kaveri (HF), Bhavani (Heifer) | Kannada (`kn`) |
| `DS-FARM-102` | Manjula Gowda | Hosahalli | Lakshmi (Murrah Buffalo), Gauri (Jersey) | Kannada (`kn`) |
| `DS-FARM-103` | Suresh Kumar | Bhadravati | Kamadhenu (HF), Shanti (Sahiwal) | English (`en`) |
| `DS-FARM-104` | Devendrappa K | Shivamogga Rural | Kalyani (Gir) | Kannada (`kn`) |
| `DS-FARM-105` | Parvathamma N | Bhadravati | Radha (Jersey Cross) | English (`en`) |

---

## 5. Quickstart & Installation Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL service running (or local SQLite)

### 1. Backend Setup
```bash
cd backend

# Configure environment
cp .env.example .env

# Run database migrations and seed script
python -m app.seed

# Start FastAPI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend

# Start Vite Development Server
npm run dev -- --port 5174
```
Access the application at `http://localhost:5174/`.

---

## 6. Running Acceptance Tests

Run the comprehensive 12-point end-to-end compliance test suite:

```bash
cd backend
python tests/test_full_suite.py
```

### Verified Test Cases:
1. Admin authentication using registered cooperative code and credentials.
2. Admin records milk intake with quality rate calculation.
3. Automatic synchronization: Farmer logs in and sees newly saved records immediately.
4. Downloadable digital PDF e-passbook generation.
5. Record corrections with mandatory audit trail reflected in farmer portal.
6. Financial payment settlement tracking from pending to completed.
7. Cattle care and vaccination reminders synchronization.
8. Multi-tenant security: Farmer cannot view another farmer's data.
9. Cooperative security: Admin cannot access records from other cooperatives.
10. SMS notifications module mock/live transparency.
11. Robust input validation and human-readable error messages.
12. Accessibility compliance, touch targets, and responsive layout.

---

## 7. External Integrations & Fallbacks

- **SMS Gateway:** Set `SMS_GATEWAY_API_KEY` and `SMS_SENDER_ID` in `.env`. When not provided, the system operates in **Simulated Development Mode**, previewing the message, validating recipient numbers, and logging the attempt without claiming false delivery.
- **AI Cattle Care Assistant:** Set `GEMINI_API_KEY` in `.env` to enable live LLM responses. When absent, the system seamlessly uses a curated, verified expert veterinary FAQ knowledge base clearly labeled as `[Expert Curated Dairy Advisory — Verified Local Mode]`.
