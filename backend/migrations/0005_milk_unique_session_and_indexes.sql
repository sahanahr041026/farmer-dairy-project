-- =============================================================================
-- DairySathi: enforce one milk record per farmer / date / session at DB level.
-- Run the duplicate check first; resolve any rows it returns before applying.
--   SELECT farmer_id, collection_date, session, COUNT(*) FROM milk_collections
--   GROUP BY 1,2,3 HAVING COUNT(*) > 1;
-- =============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS uq_milk_farmer_date_session
    ON milk_collections (farmer_id, collection_date, session);

CREATE INDEX IF NOT EXISTS ix_milk_coop_date
    ON milk_collections (cooperative_id, collection_date);
