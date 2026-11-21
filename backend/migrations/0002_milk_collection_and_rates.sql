-- 0002_milk_collection_and_rates.sql
-- Migration for Milk Rate Rules, Milk Collection Intake, and Audit Adjustments

CREATE TABLE IF NOT EXISTS milk_rate_rules (
    id SERIAL PRIMARY KEY,
    cooperative_id INTEGER NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
    base_rate DOUBLE PRECISION NOT NULL DEFAULT 41.0,
    base_fat DOUBLE PRECISION NOT NULL DEFAULT 4.0,
    base_snf DOUBLE PRECISION NOT NULL DEFAULT 8.5,
    fat_rate_step DOUBLE PRECISION NOT NULL DEFAULT 0.45,
    snf_rate_step DOUBLE PRECISION NOT NULL DEFAULT 0.30,
    min_fat DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    min_snf DOUBLE PRECISION NOT NULL DEFAULT 7.5,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS idx_milk_rate_rules_coop ON milk_rate_rules(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_milk_rate_rules_active ON milk_rate_rules(cooperative_id, is_active);

CREATE TABLE IF NOT EXISTS milk_collections (
    id SERIAL PRIMARY KEY,
    cooperative_id INTEGER NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
    farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    collection_date DATE NOT NULL,
    session VARCHAR(20) NOT NULL, -- 'morning' or 'evening'
    quantity_litres DOUBLE PRECISION NOT NULL,
    fat_percentage DOUBLE PRECISION,
    snf_percentage DOUBLE PRECISION,
    rate_per_litre DOUBLE PRECISION NOT NULL,
    total_amount DOUBLE PRECISION NOT NULL,
    payment_status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'approved', 'settled'
    settlement_id INTEGER,
    recorded_by_admin_id INTEGER REFERENCES admin_users(id),
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS idx_milk_collections_coop ON milk_collections(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_milk_collections_farmer ON milk_collections(farmer_id);
CREATE INDEX IF NOT EXISTS idx_milk_collections_date ON milk_collections(collection_date);
CREATE INDEX IF NOT EXISTS idx_milk_collections_farmer_date ON milk_collections(farmer_id, collection_date, session);

CREATE TABLE IF NOT EXISTS milk_record_audits (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER NOT NULL REFERENCES milk_collections(id) ON DELETE CASCADE,
    admin_id INTEGER REFERENCES admin_users(id),
    previous_quantity DOUBLE PRECISION NOT NULL,
    new_quantity DOUBLE PRECISION NOT NULL,
    previous_fat DOUBLE PRECISION,
    new_fat DOUBLE PRECISION,
    previous_snf DOUBLE PRECISION,
    new_snf DOUBLE PRECISION,
    previous_amount DOUBLE PRECISION NOT NULL,
    new_amount DOUBLE PRECISION NOT NULL,
    reason VARCHAR(255) NOT NULL,
    corrected_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS idx_milk_audits_collection ON milk_record_audits(collection_id);
