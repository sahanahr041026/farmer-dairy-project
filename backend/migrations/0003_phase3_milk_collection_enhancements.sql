-- 0003_phase3_milk_collection_enhancements.sql
-- Migration for Phase 3: Configurable Rate Rules, Flat Rates, Calculation Methods, Audited Record Status

-- 1. Extend milk_rate_rules
ALTER TABLE milk_rate_rules ADD COLUMN IF NOT EXISTS rule_name VARCHAR(100) DEFAULT 'Standard Quality Matrix (Demo)';
ALTER TABLE milk_rate_rules ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT '1.0';
ALTER TABLE milk_rate_rules ADD COLUMN IF NOT EXISTS calculation_method VARCHAR(50) DEFAULT 'fat_snf_formula';
ALTER TABLE milk_rate_rules ADD COLUMN IF NOT EXISTS flat_rate DOUBLE PRECISION DEFAULT 40.0;
ALTER TABLE milk_rate_rules ADD COLUMN IF NOT EXISTS min_rate DOUBLE PRECISION DEFAULT 20.0;
ALTER TABLE milk_rate_rules ADD COLUMN IF NOT EXISTS max_rate DOUBLE PRECISION DEFAULT 80.0;
ALTER TABLE milk_rate_rules ADD COLUMN IF NOT EXISTS max_fat DOUBLE PRECISION DEFAULT 12.0;
ALTER TABLE milk_rate_rules ADD COLUMN IF NOT EXISTS max_snf DOUBLE PRECISION DEFAULT 12.0;
ALTER TABLE milk_rate_rules ADD COLUMN IF NOT EXISTS effective_to DATE;
ALTER TABLE milk_rate_rules ADD COLUMN IF NOT EXISTS created_by_admin_id INTEGER REFERENCES admin_users(id);
ALTER TABLE milk_rate_rules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc');

-- 2. Extend milk_collections
ALTER TABLE milk_collections ADD COLUMN IF NOT EXISTS rate_rule_id INTEGER REFERENCES milk_rate_rules(id);
ALTER TABLE milk_collections ADD COLUMN IF NOT EXISTS calculation_method VARCHAR(50) DEFAULT 'fat_snf_formula';
ALTER TABLE milk_collections ADD COLUMN IF NOT EXISTS record_status VARCHAR(30) DEFAULT 'recorded';
ALTER TABLE milk_collections ADD COLUMN IF NOT EXISTS correction_reason TEXT;

-- 3. Extend milk_record_audits
ALTER TABLE milk_record_audits ADD COLUMN IF NOT EXISTS previous_rate DOUBLE PRECISION;
ALTER TABLE milk_record_audits ADD COLUMN IF NOT EXISTS new_rate DOUBLE PRECISION;

-- 4. Unique index for duplicate prevention
CREATE UNIQUE INDEX IF NOT EXISTS uq_milk_collections_farmer_date_session ON milk_collections(farmer_id, collection_date, session);
