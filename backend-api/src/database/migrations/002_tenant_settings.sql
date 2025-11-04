
ALTER TABLE tenants ADD COLUMN settings TEXT DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_tenants_settings ON tenants(id);
