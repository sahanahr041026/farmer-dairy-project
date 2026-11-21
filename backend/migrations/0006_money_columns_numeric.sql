-- =============================================================================
-- DairySathi: store money and rates as exact NUMERIC instead of FLOAT.
-- PostgreSQL only (the SQLite dev database is created from the models directly).
-- Existing values are rounded to paise (2 dp) / step precision (4 dp) during the cast.
-- Idempotent: re-running leaves already-converted columns unchanged. No BEGIN/COMMIT here, because
-- app.migrate wraps all migration files in a single transaction.
-- =============================================================================
ALTER TABLE milk_rate_rules ALTER COLUMN flat_rate TYPE NUMERIC(10,2) USING ROUND(flat_rate::numeric, 2);
ALTER TABLE milk_rate_rules ALTER COLUMN base_rate TYPE NUMERIC(10,2) USING ROUND(base_rate::numeric, 2);
ALTER TABLE milk_rate_rules ALTER COLUMN min_rate TYPE NUMERIC(10,2) USING ROUND(min_rate::numeric, 2);
ALTER TABLE milk_rate_rules ALTER COLUMN max_rate TYPE NUMERIC(10,2) USING ROUND(max_rate::numeric, 2);
ALTER TABLE milk_rate_rules ALTER COLUMN fat_rate_step TYPE NUMERIC(8,4) USING ROUND(fat_rate_step::numeric, 4);
ALTER TABLE milk_rate_rules ALTER COLUMN snf_rate_step TYPE NUMERIC(8,4) USING ROUND(snf_rate_step::numeric, 4);
ALTER TABLE milk_collections ALTER COLUMN rate_per_litre TYPE NUMERIC(12,2) USING ROUND(rate_per_litre::numeric, 2);
ALTER TABLE milk_collections ALTER COLUMN total_amount TYPE NUMERIC(12,2) USING ROUND(total_amount::numeric, 2);
ALTER TABLE milk_record_audits ALTER COLUMN previous_rate TYPE NUMERIC(12,2) USING ROUND(previous_rate::numeric, 2);
ALTER TABLE milk_record_audits ALTER COLUMN new_rate TYPE NUMERIC(12,2) USING ROUND(new_rate::numeric, 2);
ALTER TABLE milk_record_audits ALTER COLUMN previous_amount TYPE NUMERIC(12,2) USING ROUND(previous_amount::numeric, 2);
ALTER TABLE milk_record_audits ALTER COLUMN new_amount TYPE NUMERIC(12,2) USING ROUND(new_amount::numeric, 2);
ALTER TABLE payment_settlements ALTER COLUMN calculated_amount TYPE NUMERIC(12,2) USING ROUND(calculated_amount::numeric, 2);
ALTER TABLE payment_settlements ALTER COLUMN approved_amount TYPE NUMERIC(12,2) USING ROUND(approved_amount::numeric, 2);
ALTER TABLE payment_settlements ALTER COLUMN paid_amount TYPE NUMERIC(12,2) USING ROUND(paid_amount::numeric, 2);
ALTER TABLE passbook_download_audits ALTER COLUMN total_milk_value TYPE NUMERIC(12,2) USING ROUND(total_milk_value::numeric, 2);

