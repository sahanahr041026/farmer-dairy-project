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

# Run database migrations (applies 0003 Phase 3 schema extensions)
python -m app.migrate

# Run database seed script
python -m app.seed

# Start FastAPI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation is available at `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies if not already installed
npm install

# Build verification
npm run build

# Start Vite Development Server
npm run dev -- --port 5174
```
Access the application at `http://localhost:5174/`.

---

## 6. Phase 3: Milk Collection Management & Pricing Engine

### A. Dynamic Rate Rules & Quality Matrix
DairySathi supports both flat-rate and fat/SNF-quality procurement rate rules per cooperative:
- **Flat Rate Method (`flat_rate`):**
  $$\text{Total Amount} = \text{Milk Quantity (L)} \times \text{Flat Rate per Litre}$$
- **Quality Formula Method (`fat_snf_formula`):**
  $$\text{Rate per Litre} = \text{Base Rate} + (\text{Fat} - \text{Base Fat}) \times 10 \times \text{Fat Step} + (\text{SNF} - \text{Base SNF}) \times 10 \times \text{SNF Step}$$
  - Clamped within configured $[\text{Min Rate}, \text{Max Rate}]$ bounds.
  - Total milk value: $\text{Quantity} \times \text{Rate per Litre}$, rounded to 2 decimal places.
- **Rule Resolution by Effective Window:** Rate rules specify `effective_date` and optional `effective_to`. Collections resolve the authoritative rule active on the collection date. Historical milk records preserve their frozen rate, rule ID, and calculation inputs.
- **Policy Disclosure:** All demonstration rate rules are clearly disclosed as fictional academic demo data in both UI and docs. Admins can update rate policies via `/admin/rates` to reflect cooperative-approved pricing.

### B. Admin Milk Intake Workflow
1. **Searchable Farmer Picker:** Filter farmers within the admin's cooperative by name, farmer UID (`DS-FARM-xxx`), or registered phone number.
2. **Live Calculation Preview:** Computes estimated rate and milk value client-side as quantity, fat, or SNF change.
3. **Double-Click & Concurrent Submission Protection:** Save button disables and displays loading indicator during network transit.
4. **Duplicate Protection:** Submitting a duplicate intake for the same farmer, date, and session returns `HTTP 409 Conflict`. Admin is prompted via modal with the existing record details and can cancel or explicitly confirm an overwrite (`allow_duplicate=true`).
5. **Authoritative Server Calculation:** Frontend totals are never trusted; the backend re-validates physical bounds, resolves the rate rule, computes rate and total value, and persists inside an ACID transaction.
6. **Audit Trail for Corrections:** Records cannot be silently modified. Admin must provide a mandatory reason. Previous and new quantities, fat, SNF, and rates are logged into `MilkRecordAudit` with admin ID and timestamp, marking status as `corrected`.

### C. Farmer Portal Passbook & Live Sync
- **Transparent Earnings Disclosure:** Passbook displays all collections with session, quantity, fat, SNF, rate/L, and total value. All earnings are clearly labeled as **"Milk Value / Calculated Earnings" (ಹಾಲು ಮೌಲ್ಯ / ಲೆಕ್ಕಹಾಕಿದ ಆದಾಯ)**, with a clear disclaimer that payment disbursal occurs during cooperative batch settlements.
- **Summary Cards:** Shows Today's Litres & Milk Value, Monthly Litres & Milk Value, and Net Filtered Total.
- **Live Synchronization:** Automatic 20-second polling and `visibilitychange` auto-refresh updates the farmer view when switching back to the browser tab. Manual instant "Refresh" button provides visual confirmation of data freshness.
- **Audit Explanation:** Corrected collections display an amber "Corrected" badge and the cooperative admin's logged explanation reason.
- **Mobile Usability:** Large touch targets ($\ge 48\text{px}$) and fully localized bilingual display (English & Kannada).

---

## 7. Running Acceptance Tests

Run all unit, integration, security isolation, and compliance test suites:

```bash
# Run entire test suite with pytest from project root
python -m pytest backend/tests -v
```

Or execute individual test suites:
```bash
# Phase 3 Milk Collection, Pricing Rules & Farmer Passbook Tests
python -m pytest backend/tests/test_phase3_milk_rates.py -v

# Phase 2 Authentication, RBAC & Multi-Tenant Isolation Tests
python -m pytest backend/tests/test_phase2_auth.py -v

# Full 12-point End-to-End Compliance Suite
python -m pytest backend/tests/test_full_suite.py -v

# Complete API Workflow Test
python -m pytest backend/tests/test_api_flow.py -v
```

### Verified Test Cases:
1. **Rate Rule Calculation:** Flat rate vs quality matrix, bounds clamping, decimal rounding.
2. **Effective Window Resolution:** Past, present, and future rate rule resolution.
3. **Physical Bounds Validation:** Zero/negative quantities, out-of-range fat/SNF, invalid sessions rejected with HTTP 422.
4. **Duplicate Intake Protection:** Same farmer + date + session blocked with HTTP 409 Conflict.
5. **Admin-Farmer Automatic Synchronization:** Admin record creation instantly visible on farmer passbook with updated daily/monthly totals.
6. **Audit Trail Logging:** Record correction requires mandatory reason; previous and new values permanently stored.
7. **Database Persistence:** Verification across fresh SQLAlchemy sessions.
8. **Multi-Tenant Cooperative Isolation:** Admins restricted strictly to their cooperative; cross-tenant access blocked.
9. **Farmer IDOR Protection:** Farmers restricted strictly to their own milk collections and passbook.
10. **Accessibility & Responsive Design:** $48\text{px}$ touch targets and bilingual token verification.

---

## 8. External Integrations & Fallbacks

- **SMS Gateway:** Set `SMS_GATEWAY_API_KEY` and `SMS_SENDER_ID` in `.env`. When not provided, the system operates in **Simulated Development Mode**, previewing the message, validating recipient numbers, and logging the attempt without claiming false delivery.
- **AI Cattle Care Assistant:** Set `GEMINI_API_KEY` in `.env` to enable live LLM responses. When absent, the system seamlessly uses a curated, verified expert veterinary FAQ knowledge base clearly labeled as `[Expert Curated Dairy Advisory — Verified Local Mode]`.

