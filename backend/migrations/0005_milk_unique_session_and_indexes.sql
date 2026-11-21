-- =============================================================================
-- DairySathi: enforce one milk record per farmer, date and session at DB level.
-- Before applying to a database that already has data, check for duplicates:
--   SELECT farmer_id, collection_date, session, COUNT(*) FROM milk_collections
--   GROUP BY 1, 2, 3 HAVING COUNT(*) > 1
-- and resolve any rows it returns, otherwise the unique index cannot be created.
-- (No semicolons inside comments: app.migrate splits files on semicolons.)
-- =============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS uq_milk_farmer_date_session
    ON milk_collections (farmer_id, collection_date, session);

CREATE INDEX IF NOT EXISTS ix_milk_coop_date
    ON milk_collections (cooperative_id, collection_date);
