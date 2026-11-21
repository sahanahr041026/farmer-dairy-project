-- =============================================================================
-- DairySathi Phase 4 PostgreSQL Migration:
-- E-Passbook Audits, Announcements & Schemes, Cattle Vaccination Enhancements,
-- and SMS Notification Jobs Tracking
-- =============================================================================

-- 1. Extend Farmers Table
ALTER TABLE farmers 
ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT TRUE;

-- 2. Extend Cattle Reminders Table
ALTER TABLE cattle_reminders 
ADD COLUMN IF NOT EXISTS administered_by VARCHAR(150),
ADD COLUMN IF NOT EXISTS next_due_date DATE,
ADD COLUMN IF NOT EXISTS guidance TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc');

-- 3. Create Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    cooperative_id INTEGER NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
    admin_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    title_kn VARCHAR(250),
    content TEXT NOT NULL,
    content_kn TEXT,
    category VARCHAR(50) DEFAULT 'scheme',
    target_audience VARCHAR(50) DEFAULT 'all',
    target_village VARCHAR(100),
    target_farmer_id INTEGER REFERENCES farmers(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT TRUE,
    publish_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    sms_notify BOOLEAN DEFAULT FALSE,
    official_link VARCHAR(255),
    contact_info VARCHAR(150),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS idx_announcements_coop ON announcements(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_announcements_publish_date ON announcements(publish_date);

-- 4. Create SMS Notification Jobs Table
CREATE TABLE IF NOT EXISTS sms_notification_jobs (
    id SERIAL PRIMARY KEY,
    cooperative_id INTEGER NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
    campaign_id INTEGER REFERENCES sms_campaigns(id) ON DELETE SET NULL,
    source_type VARCHAR(50) DEFAULT 'campaign',
    source_id INTEGER,
    farmer_id INTEGER REFERENCES farmers(id) ON DELETE SET NULL,
    recipient_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    message_text TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'queued',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    idempotency_key VARCHAR(100) UNIQUE,
    provider_ref VARCHAR(100),
    is_mock BOOLEAN DEFAULT TRUE,
    scheduled_at TIMESTAMP WITHOUT TIME ZONE,
    sent_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS idx_sms_jobs_coop ON sms_notification_jobs(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_sms_jobs_status ON sms_notification_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sms_jobs_idempotency ON sms_notification_jobs(idempotency_key);

-- 5. Create Passbook Download Audits Table
CREATE TABLE IF NOT EXISTS passbook_download_audits (
    id SERIAL PRIMARY KEY,
    cooperative_id INTEGER NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
    farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    requested_by_role VARCHAR(20) NOT NULL,
    requested_by_id INTEGER NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    record_count INTEGER DEFAULT 0,
    total_milk_value FLOAT DEFAULT 0.0,
    reference_number VARCHAR(100) NOT NULL,
    generated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS idx_passbook_audits_coop ON passbook_download_audits(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_passbook_audits_farmer ON passbook_download_audits(farmer_id);
