-- 0001_initial_core_schema.sql
-- Core PostgreSQL schema for DairySathi Cooperatives, Admins, Farmers & Accounts

CREATE TABLE IF NOT EXISTS cooperatives (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    locality VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL DEFAULT 'Shivamogga',
    state VARCHAR(100) NOT NULL DEFAULT 'Karnataka',
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(100),
    vet_doctor_name VARCHAR(150),
    vet_contact_phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS idx_cooperatives_code ON cooperatives(code);

CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    cooperative_id INTEGER NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS idx_admin_users_coop ON admin_users(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

CREATE TABLE IF NOT EXISTS farmers (
    id SERIAL PRIMARY KEY,
    cooperative_id INTEGER NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
    farmer_uid VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    village VARCHAR(100) NOT NULL,
    pin_code VARCHAR(10),
    bank_account_no VARCHAR(50),
    ifsc_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS idx_farmers_coop ON farmers(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_farmers_uid ON farmers(farmer_uid);
CREATE INDEX IF NOT EXISTS idx_farmers_phone ON farmers(phone);
CREATE INDEX IF NOT EXISTS idx_farmers_village ON farmers(village);

CREATE TABLE IF NOT EXISTS farmer_accounts (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER NOT NULL UNIQUE REFERENCES farmers(id) ON DELETE CASCADE,
    pin_hash VARCHAR(255) NOT NULL,
    language_preference VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_farmer_accounts_farmer ON farmer_accounts(farmer_id);
