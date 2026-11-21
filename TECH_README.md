# DairySathi — Technical Notes

This document explains **how and why** the system works the way it does: the security model, the money model, the ledger-integrity rules, the frontend structure, the tooling, configuration, and the known limits. For setup instructions and the complete list of changes, see [README.md](README.md).

---

## 1. Repository layout

```
backend/
  app/
    config.py        Settings (pydantic-settings) + startup validation
    security.py      Password hashing, JWT, session cookie, CSRF guard, login throttling, auth dependencies
    money.py         Exact decimal helpers (half-up rounding to paise)
    timeutil.py      utcnow() without the deprecated datetime.utcnow()
    models.py        SQLAlchemy models (Money / Rate / RateStep column types)
    schemas.py       Pydantic v2 request/response models
    routers/         auth, farmers, rates, milk, payments, cattle, passbook, assistant,
                     notifications, reports, sms, announcements
    migrate.py       Migration runner (see section 9)
  migrations/        0001 ... 0006 raw SQL (PostgreSQL)
  tests/             pytest suites (see section 8)
frontend/
  src/
    services/api.js  Single fetch wrapper used by every page
    context/         AuthContext (session state)
    components/      Shared UI (Navbar, Modal, Charts, ErrorBoundary, ...)
    pages/           Route components; the four largest are split into sub-folders (section 7)
    test/setup.js    Vitest setup
  eslint.config.js   ESLint 9 flat config
  vite.config.js     Vite + Vitest config
.github/workflows/ci.yml
```

---

## 2. Authentication & session model

### 2.1 Credentials and tokens
- Admins log in with `cooperative_code + username/email + password`; farmers with `cooperative_code + farmer UID/phone + 4-digit PIN`.
- The cooperative is matched on its **code only** (case-insensitive). Earlier versions also did a substring match on the cooperative *name*, which could resolve the wrong tenant.
- A successful login issues an HS256 JWT containing `role`, `user_id`, `cooperative_id`, and `exp`. Expiry defaults to **8 hours** (`ACCESS_TOKEN_EXPIRE_MINUTES=480`; it used to be 24 h).
- Token verification checks the signature (constant-time compare), requires `alg == HS256`, checks expiry with timezone-aware UTC time, and returns one generic error message instead of leaking the parser exception.
- `get_current_admin` / `get_current_farmer` re-load the user from the DB on every request and require `is_active` and a matching `cooperative_id`, so deactivating a user takes effect immediately. `/auth/me` applies the same checks (HTTP 401 for inactive or mismatched users).

### 2.2 Where the token lives (httpOnly cookie)
The web app **never sees or stores the token**:

| Aspect | Behaviour |
| :--- | :--- |
| Cookie | `dairysathi_session` (`COOKIE_NAME`), `HttpOnly`, `Path=/`, `Max-Age` = token lifetime |
| `Secure` | `COOKIE_SECURE`; defaults to **true only when `ENVIRONMENT=production`** |
| `SameSite` | `COOKIE_SAMESITE`, default `lax` |
| Set by | `POST /api/auth/admin/login`, `POST /api/auth/farmer/login` |
| Cleared by | `POST /api/auth/logout` |
| Frontend | `fetch(..., { credentials: 'include' })` on every call; `localStorage` keeps only a **non-secret profile hint** (`dairysathi_user`) used to decide whether to ask `/auth/me` on page load |

`get_current_user_payload` accepts **either** credential:
1. `Authorization: Bearer <token>` (API clients, tests, scripts) — takes precedence.
2. The session cookie (browser).

The login response body still contains `access_token` so non-browser clients keep working; the web client ignores it.

### 2.3 CSRF protection
Cookies are sent automatically, so cookie-authenticated **state-changing** requests (anything other than `GET/HEAD/OPTIONS`) must carry:

```
X-Requested-With: dairysathi-web        (value configurable via CSRF_HEADER_VALUE)
```

A custom header cannot be added cross-origin without a CORS preflight, and the preflight only succeeds for origins in `CORS_ORIGINS`. Bearer-token requests are exempt (no ambient credentials). Missing header → `403 Missing CSRF header`. `SameSite=Lax` is the second layer.

### 2.4 CORS
`allow_origins = CORS_ORIGINS` (comma-separated, default `http://localhost:5174,http://127.0.0.1:5174,http://localhost:5173`), `allow_credentials=True`, methods `GET/POST/PUT/DELETE/OPTIONS`, headers `Authorization, Content-Type, X-Requested-With`, and `Content-Disposition` exposed for downloads. The previous `*` + credentials combination is gone.

> **Dev gotcha:** `localhost` and `127.0.0.1` are different *sites*. Open the app on the same hostname the API is reached on (the default API URL is `http://localhost:8000/api`, so use `http://localhost:5174`). For a deployment where web and API are on different registrable domains, set `COOKIE_SAMESITE=none` (requires HTTPS / `Secure`) and add the web origin to `CORS_ORIGINS`.

### 2.5 Login throttling
- Failed logins are counted in memory in a rolling window (`LOGIN_LOCKOUT_MINUTES`, default 15).
- **Per account** (`kind + cooperative + identifier`): locked after `LOGIN_MAX_ATTEMPTS` (default 5) failures → HTTP 429. A 4-digit PIN therefore cannot be brute-forced by rotating IPs.
- **Per client IP**: limit is `4 × LOGIN_MAX_ATTEMPTS`, so one noisy address cannot lock everyone but still cannot spray.
- A successful login clears the account counter.
- All failure paths return the same message (`Invalid cooperative code, ...`) so responses do not reveal whether the cooperative, user, or secret was wrong. Inactive accounts are only reported *after* the secret verified.
- Limitation: state is per process (see section 10).

### 2.6 Password / PIN hashing
- New format: `pbkdf2_sha256$<iterations>$<salt hex>$<hash hex>` with **600,000** iterations and a 16-byte random salt.
- Legacy `salt$hash` values (100,000 iterations) still verify, and are **re-hashed to the new format on the next successful login** (`password_needs_rehash`), so no bulk migration is needed.
- New farmers must be created with an explicit 4-digit `initial_pin` (`^\d{4}$`); there is no default PIN. The admin form pre-fills a crypto-random PIN.

### 2.7 Startup validation (`config.py`)
- `SECRET_KEY` missing, shorter than 32 chars, or starting with `change-this`:
  - `ENVIRONMENT=production` → **startup fails**;
  - otherwise → a random per-process key is generated with a warning (tokens die on restart).
- `DATABASE_URL` no longer has baked-in credentials; it defaults to `sqlite:///./dairysathi.db`.

---

## 3. Money model

### 3.1 Why
Python `float` rounding is subtly wrong for money: `round(2.675, 2) == 2.67`, `round(1.005, 2) == 1.0`, and `0.1 + 0.2 + 0.3 == 0.6000000000000001`. Totals that drift by a paisa break reconciliation.

### 3.2 Storage
Declared once in `models.py`:

```python
Money    = Numeric(12, 2, asdecimal=False)   # amounts and per-litre rates in ledgers
Rate     = Numeric(10, 2, asdecimal=False)   # rule rates
RateStep = Numeric(8, 4,  asdecimal=False)   # fat/SNF step values (e.g. 0.4500)
```

| Table | Columns |
| :--- | :--- |
| `milk_rate_rules` | `flat_rate`, `base_rate`, `min_rate`, `max_rate` (`Rate`); `fat_rate_step`, `snf_rate_step` (`RateStep`) |
| `milk_collections` | `rate_per_litre`, `total_amount` (`Money`) |
| `milk_record_audits` | `previous_rate`, `new_rate`, `previous_amount`, `new_amount` (`Money`) |
| `payment_settlements` | `calculated_amount`, `approved_amount`, `paid_amount` (`Money`) |
| `passbook_download_audits` | `total_milk_value` (`Money`) |

In PostgreSQL these are exact `NUMERIC`. `asdecimal=False` means the ORM hands the application a `float` that is already 2-dp, so existing schemas and code keep working. Fat %, SNF %, litres, ages and yields remain `Float` (they are measurements, not money).

### 3.3 Arithmetic (`app/money.py`)
All calculations go through exact `Decimal` helpers with **half-up** rounding:

| Helper | Purpose |
| :--- | :--- |
| `q2(x)` | Round half-up to 2 dp, return `float` |
| `calc_amount(qty, rate)` | `qty × rate` → paise-exact amount |
| `money_sum(iterable)` | Exact sum (ignores `None`) |
| `clamp(v, lo, hi)` | Decimal clamp used for rule bounds |

`compute_rate` (rates router) now evaluates `base + (fat−base_fat)×10×fat_step + (snf−base_snf)×10×snf_step` in `Decimal`, clamps to `[min_rate, max_rate]`, and rounds once at the end. `milk` create/correct, `payments`, `passbook`, `farmers`, `reports` use `calc_amount` / `money_sum` / `q2`. SQL `SUM()` over `NUMERIC` is exact in PostgreSQL and is passed through `q2`.

### 3.4 Migration
`migrations/0006_money_columns_numeric.sql` converts the columns above with `ALTER COLUMN ... TYPE NUMERIC(...) USING ROUND(col::numeric, n)`. It is idempotent and contains no `BEGIN/COMMIT` (the runner already wraps a transaction). It is PostgreSQL-only; the SQLite dev database is built from the models and is type-lax.

---

## 4. Ledger integrity rules (milk, payments)

### 4.1 Recording milk (`POST /api/milk`)
1. Validate quantity (`0 < qty ≤ 1000`), session (`morning|evening`), date (**not in the future**), fat/SNF bounds (0–20).
2. The farmer must belong to the admin's cooperative and be active.
3. Look up an existing record for `(cooperative, farmer, date, session)`.
   - Exists and neither `allow_duplicate` nor `overwrite` → `409 Conflict`.
   - Exists with either flag → **one** overwrite path (they used to be two near-identical branches):
     - blocked with `409` if the record is already `approved` or `settled`;
     - writes a `MilkRecordAudit` row (previous/new quantity, fat, SNF, **rate** and amount);
     - sets `record_status="corrected"`, `payment_status="pending"`, updates rate rule and method.
4. The rate rule is resolved **by collection date** via `resolve_rate_rule` — the same resolver corrections and the preview use — so a back-dated entry gets the rule that was in force that day.
5. The server calculates rate and amount; client values are never trusted.
6. A farmer notification (English + Kannada) is created in the same transaction.

The database also enforces `UNIQUE(farmer_id, collection_date, session)` (model `UniqueConstraint` + migration 0005), so concurrent requests cannot both insert.

### 4.2 Correcting milk (`PUT /api/milk/{id}`)
Needs a reason (min 3 chars). Rejected with `409` when the record is `approved` or `settled`, because changing it would desynchronise the settlement it belongs to.

### 4.3 Rate rules
- `resolve_rate_rule`: (1) rule whose `[effective_date, effective_to]` window covers the date; (2) else the latest active rule; (3) else **HTTP 404** ("No milk rate rule is configured..."). It no longer inserts a "demo" rule as a side effect of a `GET`.
- `create_rate_rule` validates `effective_to >= effective_date` and `min_rate <= max_rate`, and closes the previous rule's window.
- The frontend `api.getCurrentRate()` returns `null` on a 404 so pages render instead of failing a `Promise.all`.

### 4.4 Payments
State machine: **`pending` records → settlement `approved` → settlement `completed`**.
- `POST /payments/settle`: validates `period_start <= period_end`; picks only collections with `payment_status == "pending"` (previously `!= "settled"`, which could re-link already-approved records); links them via `settlement_id`.
- `PUT /payments/{id}`: body `status` is a `Literal["approved","completed"]`; only `approved → completed` is allowed. Completing twice → `409`; same-state or unknown transitions → `409/422`. `paid_amount` must be `≥ 0` and `≤ approved_amount`. Only collections **linked to that settlement** (`settlement_id == id`) are marked `settled` — before, *every* collection in the date range was, including records added later or belonging to other settlements.

### 4.5 Notifications
- Single mark-read: farmers can only touch their own rows; unknown/foreign IDs return `404` (previously a silent success).
- `read-all` for farmers updates only their own rows. Broadcast rows (`farmer_id IS NULL`) share one `is_read` flag, so they are deliberately **not** bulk-updated by one farmer (see section 10).

---

## 5. Reporting & query efficiency
- `/milk/summary`, `/milk/today`, `/reports/summary`, and `/passbook` aggregate in SQL (`SUM`, `COUNT`, `AVG`, `CASE`) instead of loading rows and summing in Python. The passbook still returns the full record list for the period (it is the statement), but its totals, today/month figures and fat/SNF averages are SQL aggregates.
- `GET /farmers` uses three grouped queries (cattle count, month litres, pending amount) keyed by farmer instead of two queries per farmer (N+1).
- Bounds: `/milk` `limit` 1–500, `offset ≥ 0`; `/reports/trends` `days` 1–366.
- `/passbook` and the CSV export validate `start_date <= end_date`.
- CSV export neutralises spreadsheet formulas: text cells starting with `= + - @` (or tab/CR) are prefixed with `'`.
- `/milk/summary?farmer_id=` verifies the farmer belongs to the caller's cooperative (404 otherwise).

---

## 6. Backend housekeeping
- `app/timeutil.utcnow()` replaces every `datetime.utcnow()` (deprecated); naive-UTC values keep the existing `DateTime` columns compatible.
- `from_orm` → `model_validate`; `class Config` → `model_config = ConfigDict(from_attributes=True)`.
- `requirements.txt`: added `psycopg[binary]` (the default Postgres URL needs it) and pinned `sqlalchemy>=2.0.0,<2.1`.
- `.env.example`: placeholders only; documents every setting (`ENVIRONMENT`, `DATABASE_URL`, `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `CORS_ORIGINS`, cookie settings, throttle settings, integrations).

---

## 7. Frontend

### 7.1 API client (`services/api.js`)
- One `request()` wrapper: sends `credentials: 'include'` and the CSRF header; only sets `Content-Type` when there is a body; no token handling at all.
- Error text: FastAPI `detail` may be a string **or** a list of validation errors; `formatErrorDetail` turns lists into `field: message; ...` (previously rendered as `[object Object]`). Errors carry `.status`.
- `401` (except on the login endpoints) → clears the cached profile and dispatches `dairysathi:unauthorized`; `AuthContext` listens and signs the user out so routing follows.
- `buildQuery()` (URLSearchParams) replaces hand-built query strings; it drops empty values but keeps `false`/`0`.
- Downloads: `downloadPassbookPdf` and `downloadCollectionsCsv` fetch through `request()` (cookie + CSRF) and save a blob. The old `window.open(csvUrl)` could not authenticate and returned 401.
- `getCurrentRate` → `null` on 404; `204` → `null`; `calculateRatePreview` accepts `collection_date`.

### 7.2 Auth context
- `clearSession()` (local state only) vs `logout()` (calls `POST /auth/logout`, then clears even if the call fails).
- On mount, `/auth/me` is called **only if** a cached profile hint exists; `401/403` clears the session, a network error keeps it.

### 7.3 Routing & resilience
- All pages are `React.lazy` + `Suspense` (route-level code splitting).
- `ErrorBoundary` wraps the app and shows a "Something went wrong / Reload" screen.
- `FarmerHome` shows `—` instead of an invented ₹41 rate when no rule exists.
- `AdminFarmers`: PIN input accepts digits only (max 4) and is pre-filled with a crypto-random PIN.

### 7.4 Component split (no behaviour change)
Each large page keeps its original path and named export (the router imports them unchanged) and delegates to a sibling folder:

| Page (lines before → after) | New folder | Contents |
| :--- | :--- | :--- |
| `AdminSMSNotifications.jsx` (~1150 → 146) | `pages/admin/sms/` | `useSmsAdmin.js` (state + handlers), `smsTemplates.js`, `smsHelpers.js` (`getCharStats`), `SmsTabs`, `GatewayBanner`, `BroadcastComposer`, `PhonePreview`, `CampaignHistory`, `SchemesTab`, `JobsSummary`, `JobsTable`, `PreviewModal`, `SchemeModal` |
| `FarmerCattle.jsx` (843 → 84) | `pages/farmer/cattle/` | `useCattleData`, `useAddCattle`, `useEditCattle`, `speakReminder.js`, `CattleHeader`, `CattleTabs`, `CattleCard`, `CattleListTab`, `RemindersTab`, `BreedsTab`, `CattleModals` |
| `AdminMilkCollection.jsx` (826 → 134) | `pages/admin/milk/` | `rateUtils.js` (`computePreviewRate`), `useMilkCollections`, `useMilkEntryForm`, `useCorrection`, `useHistoryFilters`, `MilkEntryForm`, `RatePreviewBox`, `RatePolicyCard`, `CollectionsTable`, `DuplicateModal`, `CorrectionModal` |
| `AdminCattleCare.jsx` (874 → 160) | `pages/admin/cattlecare/` | `useCattleCare`, `reminderStyles.js` (`getReminderColors`), `ReminderCard`, `RemindersList`, `HerdTable`, `CompletionModal`, `ReminderModal`, `RegisterCattleModal`, `EditCattleModal` |

Conventions used: state + handlers live in custom hooks called unconditionally at the top of the page; presentational pieces take props; pure logic is extracted into plain `.js` helpers (which is what makes it unit-testable).

### 7.5 Pre-existing breakage that was repaired
The last commit before this work (`updation of project`) left the frontend **unbuildable**:
- `FarmerPassbook.jsx`: a wrapper `<div>` was closed with `</>`.
- `FarmerNotifications.jsx`: duplicate `SpeakerIcon` import and a duplicated `handleSpeakNotification`.
- `AdminCattleCare.jsx`: a half-applied redesign (mixed old/new markup, calls to non-existent handlers). It was rebuilt from the last working version, re-adding that commit's intended features (quick templates bar, edit-cattle modal + handlers, Hallikar breed, cattle notes field).

---

## 8. Tooling & tests

### 8.1 Backend (pytest) — 17 tests
Tests require a **seeded** database. To run against a throwaway SQLite file:

```bash
cd backend
export DATABASE_URL=sqlite:///./test_run.db        # PowerShell: $env:DATABASE_URL="sqlite:///./test_run.db"
python -c "from app.main import app; from app.seed import seed_database; seed_database()"
python -m pytest -q
```

| File | Covers |
| :--- | :--- |
| `test_api_flow.py`, `test_full_suite.py`, `test_phase2_auth.py`, `test_phase3_milk.py`, `test_phase3_milk_rates.py`, `test_phase4_cattle.py` | Original suites (updated for the generic auth messages, validation-list `detail`, and date windows) |
| `test_review_fixes.py` | Login throttling (401×5 then 429), partial cooperative name rejected, PIN validation, settlement scoping + double-complete (409) + invalid status (422) + edit locks (409), notification ownership (404), CSV export auth |
| `test_cookie_auth_and_money.py` | `HttpOnly` + `SameSite=lax` cookie, cookie-only GET works, cookie POST without CSRF header → 403 (with header → 201), Bearer works without CSRF header, logout clears the session, `q2(2.675)==2.68`, `q2(1.005)==1.01`, exact `money_sum`, `compute_rate` formula/clamp/flat |
| `conftest.py` | Autouse fixture resetting the in-memory throttle between tests |

Note: `TestClient` keeps a cookie jar, so tests that assert "no credentials → 401" call `client.cookies.clear()` first.

### 8.2 Frontend (Vitest + Testing Library) — 28 tests
```bash
cd frontend
npm test            # vitest run (jsdom)
npm run test:watch
```
| File | Covers |
| :--- | :--- |
| `services/api.test.js` | `buildQuery`, `formatErrorDetail`, cookie + CSRF header and **no** `Authorization`, Content-Type only with body, validation-error message + status, 401 → event + cleared profile, failed login ≠ session expiry, network error text, `getCurrentRate` 404 → `null`, `204` → `null`, authenticated CSV download |
| `context/AuthContext.test.jsx` | No `/auth/me` without a hint, session restore, 401 clears vs network error keeps, **login never writes a token to `localStorage`**, logout calls server and clears even on failure, unauthorized event signs out |
| `components/ErrorBoundary.test.jsx` | Renders children; fallback screen on error |
| `pages/admin/milk/rateUtils.test.js`, `pages/admin/sms/smsHelpers.test.js`, `pages/admin/cattlecare/reminderStyles.test.js` | Extracted pure helpers (formula/clamp/flat, GSM vs Unicode SMS parts incl. Kannada, status colours) |

### 8.3 Lint
```bash
npm run lint        # eslint .
npm run lint:fix
```
`eslint.config.js` (ESLint 9 flat config): `@eslint/js` recommended, `eslint-plugin-react` (+ `jsx-runtime`), `react-hooks/rules-of-hooks` (error) and `exhaustive-deps` (warn), `prop-types` off, unused vars as warnings (ignore `_`-prefixed names and `React`). Current state: **0 errors, 10 warnings** — all `react-hooks/exhaustive-deps` on mount-only data-loading effects that were intentionally left (naively adding the function to the dependency array would re-fetch on every render). One real error (`no-control-regex`) was fixed by replacing the control-character regex in `getCharStats` with `Array.from(msg).some(ch => ch.codePointAt(0) > 0x7f)`.

41 unused imports/variables were removed (imports) or `_`-prefixed (unused state/locals) across 16 files during the lint pass.

### 8.4 CI (`.github/workflows/ci.yml`)
- **backend:** install, `compileall` (catches syntax errors like the `milk.py` one), seed a SQLite DB, `pytest`.
- **frontend:** `npm ci`, `npm run lint`, `npm test`, `npm run build`.

---

## 9. Migrations
- Files `migrations/0001`–`0006` are PostgreSQL SQL. `python -m app.migrate` runs `Base.metadata.create_all`; on PostgreSQL it then applies **every** `.sql` file in order, **each run**, splitting statements on `;` inside one transaction. On SQLite it only adds missing columns.
- Consequences for authors: migrations must be **idempotent** (`IF NOT EXISTS`, safe re-runs), must not contain `BEGIN/COMMIT`, and must not put a `;` inside a comment or string (it would split the file mid-statement). There is **no applied-migrations table** yet.
- `0005_milk_unique_session_and_indexes.sql`: unique index on `(farmer_id, collection_date, session)` + index on `(cooperative_id, collection_date)`. **Run the duplicate-check query in its header first** on databases with existing data, or the unique index will fail to build.
- `0006_money_columns_numeric.sql`: see section 3.4.
- `main.py` still calls `Base.metadata.create_all` at import, so a fresh SQLite database needs no migration step.

---

## 10. Known limitations / not done
- **Login throttle is per process, in memory.** With multiple workers/instances use a shared store (e.g. Redis).
- **Broadcast notifications** (`farmer_id IS NULL`) have one shared read flag; per-farmer read state would need a join table.
- **No migration version table** (section 9).
- **Hand-rolled JWT/PBKDF2** (hardened, but a vetted library such as PyJWT + argon2 would be preferable long term).
- `Base.metadata.create_all` at import time coexists with SQL migrations.
- Litres, fat %, SNF % remain `Float`; only money/rates are `NUMERIC`.
- 10 `exhaustive-deps` lint warnings remain by choice (section 8.3).
- Frontend/refactor behaviour was verified by build, lint and unit tests, not by manual browser testing; the split pages deserve a quick click-through (milk entry, duplicate modal, correction, SMS broadcast, cattle edit, reminders).
- Cross-site deployments must configure `COOKIE_SAMESITE=none` + HTTPS (section 2.4).
