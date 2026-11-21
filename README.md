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
- **Security:** HMAC-SHA256 JWT delivered in an **httpOnly session cookie** (Bearer tokens still accepted for API clients), CSRF header guard, per-account/IP login throttling, PBKDF2-SHA256 (600k iterations, legacy hashes upgraded on login), tenant-level cooperative isolation, and farmer data access restrictions. See [TECH_README.md](TECH_README.md).
- **Money:** exact `NUMERIC` columns with `Decimal` half-up arithmetic (`backend/app/money.py`).
- **Tooling:** pytest (19 backend tests), ESLint 9 + Vitest/Testing Library (62 frontend tests, including render smoke tests for every page), GitHub Actions CI.

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
- PostgreSQL service running (or local SQLite, which is the default when `DATABASE_URL` is not set)

### 1. Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment, then edit .env (see "3. Configuration" below)
cp .env.example .env

# Generate a SECRET_KEY and paste it into .env
python -c "import secrets; print(secrets.token_urlsafe(48))"

# Run database migrations (creates tables; on PostgreSQL applies migrations 0001-0006)
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

# Quality gates
npm run lint        # ESLint
npm test            # Vitest
npm run build       # production build verification

# Start Vite Development Server
npm run dev -- --port 5174
```
Access the application at `http://localhost:5174/`. To use it from another device on the same network, open `http://<this-machine-ip>:5174/` (the backend must be started with `--host 0.0.0.0`, and the firewall must allow ports 5174 and 8000). The page and API must be reached via the **same hostname** so the session cookie is sent; see [TECH_README.md](TECH_README.md) section 2.4.

### 3. Configuration (`backend/.env`)
| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `ENVIRONMENT` | `development` | Set `production` to make a weak/missing `SECRET_KEY` a startup error and to default cookies to `Secure` |
| `DATABASE_URL` | `sqlite:///./dairysathi.db` | e.g. `postgresql+psycopg://user:password@localhost:5432/dairysathi_db` |
| `SECRET_KEY` | *(random per process)* | 32+ random characters; **required in production** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | Session lifetime (8 h) |
| `CORS_ORIGINS` | `http://localhost:5174,http://127.0.0.1:5174,http://localhost:5173` | Comma-separated browser origins allowed to call the API |
| `CORS_ORIGIN_REGEX` | *(dev: localhost + private LAN IPs; production: none)* | Extra allowed origins as a regex. In development, `10.x`, `192.168.x` and `172.16-31.x` origins are allowed automatically so the app works over a LAN |
| `COOKIE_NAME` | `dairysathi_session` | Session cookie name |
| `COOKIE_SECURE` | `true` only in production | Cookie `Secure` flag |
| `COOKIE_SAMESITE` | `lax` | Use `none` (+ HTTPS) only if web and API are on different sites |
| `CSRF_HEADER_VALUE` | `dairysathi-web` | Value of the `X-Requested-With` header the web app sends |
| `LOGIN_MAX_ATTEMPTS` / `LOGIN_LOCKOUT_MINUTES` | `5` / `15` | Failed-login throttle |
| `GEMINI_API_KEY`, `OPENAI_API_KEY`, `SMS_GATEWAY_API_KEY`, `SMS_SENDER_ID` | empty / `DAIRYSTH` | Optional integrations (section 8) |

The frontend reads `VITE_API_URL`. If unset, it calls the API on **port 8000 of the same host that served the page** (`http://localhost:5174` -> `http://localhost:8000/api`, `http://192.168.1.20:5174` -> `http://192.168.1.20:8000/api`), so the same build works on localhost and over a LAN.

> **Upgrading an existing PostgreSQL database:** before running migrations, check for duplicate milk records (query in the header of `backend/migrations/0005_milk_unique_session_and_indexes.sql`) and resolve them; migration `0006` converts money columns to `NUMERIC`. Existing farmer PINs and admin passwords keep working and are re-hashed on next login.

---

## 6. Phase 3: Milk Collection Management & Pricing Engine

### A. Dynamic Rate Rules & Quality Matrix
DairySathi supports both flat-rate and fat/SNF-quality procurement rate rules per cooperative:
- **Flat Rate Method (`flat_rate`):**
  $$\text{Total Amount} = \text{Milk Quantity (L)} \times \text{Flat Rate per Litre}$$
- **Quality Formula Method (`fat_snf_formula`):**
  $$\text{Rate per Litre} = \text{Base Rate} + (\text{Fat} - \text{Base Fat}) \times 10 \times \text{Fat Step} + (\text{SNF} - \text{Base SNF}) \times 10 \times \text{SNF Step}$$
  - Clamped within configured $[\text{Min Rate}, \text{Max Rate}]$ bounds.
  - Total milk value: $\text{Quantity} \times \text{Rate per Litre}$, computed with exact decimals and **rounded half-up to 2 decimal places** (paise-exact; stored as `NUMERIC`).
- **Rule Resolution by Effective Window:** Rate rules specify `effective_date` and optional `effective_to`. Collections resolve the authoritative rule active on the collection date. Historical milk records preserve their frozen rate, rule ID, and calculation inputs.
- **Policy Disclosure:** All demonstration rate rules are clearly disclosed as fictional academic demo data in both UI and docs. Admins can update rate policies via `/admin/rates` to reflect cooperative-approved pricing.

### B. Admin Milk Intake Workflow
1. **Searchable Farmer Picker:** Filter farmers within the admin's cooperative by name, farmer UID (`DS-FARM-xxx`), or registered phone number.
2. **Live Calculation Preview:** Computes estimated rate and milk value client-side as quantity, fat, or SNF change.
3. **Double-Click & Concurrent Submission Protection:** Save button disables and displays loading indicator during network transit.
4. **Duplicate Protection:** Submitting a duplicate intake for the same farmer, date, and session returns `HTTP 409 Conflict`. Admin is prompted via modal with the existing record details and can cancel or explicitly confirm an overwrite (`allow_duplicate=true` or `overwrite=true`, handled by a single code path with a full audit row). A record that is already part of an approved/settled payment can no longer be overwritten or corrected (`409`). The database also enforces uniqueness on (farmer, date, session).
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

### Backend (19 tests)
The suites expect a **seeded** database. A throwaway SQLite run:

```bash
cd backend
export DATABASE_URL=sqlite:///./test_run.db      # PowerShell: $env:DATABASE_URL="sqlite:///./test_run.db"
python -c "from app.main import app; from app.seed import seed_database; seed_database()"
python -m pytest -q
```

### Frontend (62 tests, lint, build)
```bash
cd frontend
npm run lint && npm test && npm run build
```

CI (`.github/workflows/ci.yml`) runs all of the above on every push and pull request.

Run all unit, integration, security isolation, and compliance test suites:

```bash
# Run entire backend test suite with pytest
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

# Review regressions: throttling, settlement scoping, edit locks, notification ownership
python -m pytest backend/tests/test_review_fixes.py -v

# Cookie sessions, CSRF guard, exact money arithmetic
python -m pytest backend/tests/test_cookie_auth_and_money.py -v
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
11. **Login Hardening:** Failed-login throttling (HTTP 429), generic error messages, whole-name cooperative matching rejected.
12. **Session Security:** httpOnly cookie, CSRF header required on cookie writes (403 without it), Bearer still works, logout clears the session.
13. **Ledger Integrity:** Settlement completes only its own linked records, no double completion, settled/approved records locked from edits.
14. **Exact Money:** Half-up paise rounding (2.675 becomes 2.68), exact sums, rule bounds clamping.
15. **Frontend Units:** API client (cookie/CSRF/401/error formatting), auth context (no token in `localStorage`), error boundary, extracted helpers.
16. **Import Guard:** every relative named/default/lazy import in `frontend/src` must resolve to a real export (catches `does not provide an export named ...` before the browser does).
17. **Page Smoke Tests:** all 16 pages are rendered with backend-accurate mock data and every on-screen button is clicked; the test fails if the error boundary trips.

---

## 8. External Integrations & Fallbacks

- **SMS Gateway:** Set `SMS_GATEWAY_API_KEY` and `SMS_SENDER_ID` in `.env`. When not provided, the system operates in **Simulated Development Mode**, previewing the message, validating recipient numbers, and logging the attempt without claiming false delivery.
- **AI Cattle Care Assistant:** Set `GEMINI_API_KEY` in `.env` to enable live LLM responses. When absent, the system seamlessly uses a curated, verified expert veterinary FAQ knowledge base clearly labeled as `[Expert Curated Dairy Advisory — Verified Local Mode]`.

---

## 9. Change Log — Project Review & Hardening

Design rationale and internals live in [TECH_README.md](TECH_README.md). This section lists **every change**, grouped by area.

### 9.1 Build blockers repaired
- `backend/app/routers/milk.py` did not compile (`IndentationError`) and referenced undefined `calc_fat` / `calc_snf`. `record_milk_collection` was rewritten: one overwrite path (the `overwrite` and `allow_duplicate` branches were near-duplicates), rate rule resolved **by collection date** (same resolver as corrections), complete audit rows (previous/new rate included), future-date check de-duplicated (today or earlier only).
- Frontend build was broken by the last commit:
  - `FarmerPassbook.jsx`: unclosed wrapper `<div>` (closed with `</>`).
  - `FarmerNotifications.jsx`: duplicate `SpeakerIcon` import and duplicated `handleSpeakNotification`.
  - `AdminCattleCare.jsx`: half-applied redesign rebuilt from the last working version, re-adding the quick templates bar, edit-cattle modal/handlers, Hallikar breed option and cattle health-notes field.

### 9.2 Backend — security
- **Config:** `SECRET_KEY` validated at startup (required + 32+ chars in production, random per-process key with a warning otherwise); no baked-in DB credentials (default `sqlite:///./dairysathi.db`); `ENVIRONMENT`, `CORS_ORIGINS`, cookie, CSRF and throttle settings added; session lifetime default reduced from 24 h to 8 h.
- **CORS:** explicit origin list instead of `*` with credentials; methods/headers restricted; `Content-Disposition` exposed. In development, localhost and private-network origins (`10.x`, `192.168.x`, `172.16-31.x`) are also allowed via `CORS_ORIGIN_REGEX` so the app works when opened from another device on the LAN; production allows only `CORS_ORIGINS`.
- **Login:** per-account and per-IP failed-login throttling (HTTP 429); a single generic error message for every credential failure; cooperative matched by **code only** (the substring name match is gone); inactive accounts reported only after the secret verified; `/auth/me` rejects inactive/mismatched users with 401.
- **Passwords/PINs:** PBKDF2-SHA256 at 600,000 iterations in a versioned `pbkdf2_sha256$iter$salt$hash` format; legacy 100k hashes still verify and are upgraded on next login.
- **Tokens:** timezone-correct expiry, `alg` check, generic invalid-token message.
- **httpOnly session cookie** (`dairysathi_session`) set at login and cleared by the new `POST /api/auth/logout`; Bearer tokens are still accepted (and take precedence).
- **CSRF guard:** cookie-authenticated writes require `X-Requested-With: dairysathi-web`.
- **Farmers:** new farmers require an explicit 4-digit `initial_pin` (no `"1234"` default); farmer login `pin` length-bounded.
- **CSV export:** spreadsheet-formula injection neutralised; date range validated.

### 9.3 Backend — correctness
- **Payments:** completing a settlement now settles **only its linked collections** (it used to settle every record in the date range); settle picks only `pending` records and validates the period; status limited to `approved|completed` with an `approved → completed` transition only; double completion → 409; `paid_amount` must satisfy `0 ≤ paid ≤ approved`.
- **Edit locks:** records that are `approved`/`settled` cannot be corrected or overwritten (409).
- **Notifications:** farmers can only mark their own notifications read (404 otherwise); `read-all` is limited to the farmer's own rows.
- **Rates:** `GET /rates/current` no longer creates a "demo" rule (404 with a clear message when none exists); rule creation validates `effective_to ≥ effective_date` and `min_rate ≤ max_rate`.
- **Milk:** `/milk/summary?farmer_id=` verifies cooperative ownership (404); `/milk` `limit` capped 1–500, `offset ≥ 0`.
- **Passbook:** start date after end date → 400.
- **Database:** unique constraint on `(farmer_id, collection_date, session)` so concurrent requests cannot create duplicates.

### 9.4 Backend — performance
- SQL aggregates (`SUM/COUNT/AVG/CASE`) replace Python-side summing in `/milk/summary`, `/milk/today`, `/reports/summary`, and **`/passbook`** (totals, paid/pending, today, month, average fat/SNF).
- `GET /farmers` N+1 queries replaced by three grouped queries.
- `/reports/trends` `days` capped 1–366.

### 9.5 Backend — money
- Money and rate columns changed from `FLOAT` to exact `NUMERIC` (`Money` 12,2 / `Rate` 10,2 / `RateStep` 8,4) on `milk_rate_rules`, `milk_collections`, `milk_record_audits`, `payment_settlements`, `passbook_download_audits`.
- New `app/money.py` (`q2`, `calc_amount`, `money_sum`, `clamp`, `D`): `Decimal` arithmetic with half-up rounding; `compute_rate`, milk create/correct, settlements, passbook, farmers and reports all use it. `round(2.675, 2)` gave 2.67; the system now gives 2.68.
- Migration `0006_money_columns_numeric.sql` (PostgreSQL).

### 9.6 Backend — housekeeping
- `datetime.utcnow()` replaced everywhere by `app/timeutil.utcnow()`; `from_orm` → `model_validate`; Pydantic `class Config` → `ConfigDict`.
- `requirements.txt`: `psycopg[binary]` added, `sqlalchemy>=2.0.0,<2.1`.
- `.env.example` rewritten with placeholders and every setting documented.
- Migrations `0005` (unique + coop/date indexes) and `0006` written to be idempotent and safe for the runner (no `BEGIN/COMMIT`, no `;` inside comments).

### 9.7 Frontend — behaviour
- **Auth:** token no longer stored in `localStorage` (httpOnly cookie); `credentials: 'include'` + CSRF header on every request; logout calls the server; `AuthContext` signs the user out when the API reports an expired/invalid session (`dairysathi:unauthorized` event) but keeps the session on network errors; `/auth/me` is called on load only if a cached profile hint exists.
- **API address:** defaults to port 8000 of the host that served the page (override with `VITE_API_URL`), so localhost and LAN-IP access both work and the cookie stays same-site.
- **API client:** FastAPI validation-error lists formatted into readable text (no more `[object Object]`); `URLSearchParams` query builder; `Content-Type` only when there is a body; errors expose `.status`; `204` handled; `getCurrentRate` returns `null` on 404; `calculateRatePreview` accepts a collection date.
- **Downloads:** CSV export fixed (it used `window.open`, which could not authenticate → 401); PDF and CSV both download through the authenticated client.
- **Pages:** `AdminFarmers` pre-fills a random 4-digit PIN (digits only, max 4); `AdminReports` shows download errors; `FarmerHome` shows `—` instead of an invented ₹41 rate when no rule exists.
- **App shell:** route-level code splitting (`React.lazy`/`Suspense`) and an `ErrorBoundary`.

### 9.8 Frontend — structure (no behaviour change)
| Page | Before → after | New folder |
| :--- | :--- | :--- |
| `AdminSMSNotifications.jsx` | ~1150 → 146 lines | `pages/admin/sms/` (13 files) |
| `FarmerCattle.jsx` | 843 → 84 lines | `pages/farmer/cattle/` (11 files) |
| `AdminMilkCollection.jsx` | 826 → 134 lines | `pages/admin/milk/` (11 files) |
| `AdminCattleCare.jsx` | 874 → 160 lines | `pages/admin/cattlecare/` (9 files) |

Pure logic was extracted into testable helpers (`rateUtils`, `smsHelpers`, `reminderStyles`). The SMS character-count check was rewritten without a control-character regex (`Array.from(msg).some(ch => ch.codePointAt(0) > 0x7f)`), which also removed stray NUL/DEL bytes that had made git treat the file as binary.

### 9.8b Bugs found after the refactor (fixed)
- **Broken imports from the lint cleanup:** the unused-import cleanup prefixed 12 unused icon imports with `_` (e.g. `_ArrowRightIcon`) in `AdminDashboard`, `AdminFarmers`, `FarmerAssistant`, `FarmerHome`, `FarmerPassbook` instead of deleting them. Vite served the page, then the browser failed with `The requested module '/src/components/Icons.jsx' does not provide an export named '_ArrowRightIcon'`, and the build and unit tests did not notice. The imports were removed, and the import guard test now prevents this class of bug.
- **SMS jobs table crashed the page** (pre-existing): it read `job.job_type`, `job.farmer_name` and `job.phone_masked`, but the API returns `source_type`, `recipient_name` and `phone_number`. Any real job in the queue threw `Cannot read properties of undefined (reading 'replace')`. The table now uses the real field names (old names kept as fallbacks).
- **SMS summary cards showed blank/`undefined%`** (pre-existing): the "Pending" and "Success Rate" cards read `pending` and `success_rate_percent`, which the API does not return. They are now derived from `queued + submitted` and `(sent + delivered) / total_jobs`.

### 9.8c UI layout fixes (found by rendering the pages in Chrome)
- **Assistant page overlap** (`/farmer/assistant`): the suggested-question chips were squeezed into narrow pills and their text printed on top of each other. The chips are flex children of a horizontally scrolling row with `nowrap` text, so the browser shrank them; they now keep their natural width (`flexShrink: 0`) and the row scrolls sideways.
- **Phone layout stretched wider than the screen** (all farmer pages): the top bar (brand + tagline, Online pill, language button, name, Logout) needed ~455px, so phones zoomed the page out and cut off the fifth bottom-nav tab. Below 480px the tagline and the "Online" label are hidden and Logout becomes icon-only (with an `aria-label`). Verified no horizontal overflow at 360, 390 and 414px on every farmer page.
- Minor: the "Call Vet" button no longer wraps onto two lines, and the message timestamp row wraps cleanly on narrow screens.
- Known remaining (very small phones, 320px only): the farmer cattle list (`Edit`/`ತಿದ್ದುಪಡಿ` button) overflows by 7-30px and the farmer home "Pending Payment" card by 11px.

### 9.9 Tooling, tests, CI
- **ESLint 9** flat config (`npm run lint`, `lint:fix`): 0 errors; 10 intentional `exhaustive-deps` warnings remain; 41 unused imports/variables cleaned across 16 files.
- **Vitest + Testing Library** (`npm test`, `test:watch`): 62 tests in 8 files: API client, auth context, error boundary, three extracted helpers, an **import guard** (`src/test/imports.test.js`) and **page smoke tests** for all 16 pages (`src/test/pages.smoke.test.jsx`).
- **Backend tests:** 19 total — new `test_review_fixes.py` (6) and `test_cookie_auth_and_money.py` (9, including CORS preflight checks for localhost/LAN origins and rejection of public origins), plus `conftest.py` resetting the login throttle; existing tests updated for generic auth messages, validation-list `detail`, non-colliding dates, and cookie-jar isolation.
- **CI:** GitHub Actions — backend (`compileall`, seed, `pytest`) and frontend (`npm ci`, lint, test, build).

### 9.10 Behaviour changes to be aware of
- Auth error texts are now generic and identical for wrong cooperative / user / secret.
- `POST /api/farmers` requires `initial_pin` (4 digits).
- Cookie-authenticated writes need the `X-Requested-With` header (the web app sends it; Bearer clients are unaffected).
- Sessions last 8 hours by default.
- Without a `.env`, the backend uses SQLite and a random secret (tokens reset on restart).
- Browsers must reach the page and the API via the same hostname (the frontend now derives the API host from the page URL), or configure `COOKIE_SAMESITE` / `CORS_ORIGINS`.
- In development the API allows localhost and private-LAN origins automatically (`CORS_ORIGIN_REGEX`); in production only `CORS_ORIGINS` is allowed.
- `GET /api/rates/current` returns 404 when the cooperative has no rate rule.
- Approved/settled milk records can no longer be edited or overwritten.
- Settlement status updates accept only `completed` (from `approved`).

### 9.11 Known limitations
Login throttle is in-memory per process; broadcast notifications share one read flag; no applied-migrations table (migrations must stay idempotent); hand-rolled JWT/PBKDF2 (hardened, not replaced by a library); litres and fat/SNF % remain `FLOAT`; pages are verified by build, lint, unit tests and automated render/click smoke tests (jsdom) rather than a manual browser pass. Details in [TECH_README.md](TECH_README.md) section 10.
