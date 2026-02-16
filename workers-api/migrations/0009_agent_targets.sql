-- Agent Targets System + Org Hierarchy + Region Hierarchy
-- Supports daily/monthly targets per agent for boards and SIMs
-- Target types: boards, sims | Target scope: customers, stores
-- Org hierarchy: Agent -> Team Leader -> Junior Sales Manager -> Sales Manager
-- Region hierarchy: Country -> Province -> District -> Area

-- ========== UPGRADE EXISTING REGIONS TABLE ==========
ALTER TABLE regions ADD COLUMN level TEXT DEFAULT 'area';
ALTER TABLE regions ADD COLUMN parent_id TEXT;
ALTER TABLE regions ADD COLUMN manager_id TEXT;
ALTER TABLE regions ADD COLUMN updated_at TEXT DEFAULT (datetime('now'));

CREATE INDEX IF NOT EXISTS idx_regions_tenant ON regions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_regions_parent ON regions(parent_id);
CREATE INDEX IF NOT EXISTS idx_regions_level ON regions(level);
CREATE INDEX IF NOT EXISTS idx_regions_manager ON regions(manager_id);

-- ========== ORG HIERARCHY ==========
CREATE TABLE IF NOT EXISTS org_hierarchy (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  manager_id TEXT,
  role_level TEXT NOT NULL CHECK(role_level IN ('agent', 'team_leader', 'junior_sales_manager', 'sales_manager', 'regional_manager', 'director')),
  region_id TEXT,
  department TEXT DEFAULT 'field_sales',
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  effective_from TEXT DEFAULT (datetime('now')),
  effective_to TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_org_hierarchy_tenant ON org_hierarchy(tenant_id);
CREATE INDEX IF NOT EXISTS idx_org_hierarchy_user ON org_hierarchy(user_id);
CREATE INDEX IF NOT EXISTS idx_org_hierarchy_manager ON org_hierarchy(manager_id);
CREATE INDEX IF NOT EXISTS idx_org_hierarchy_region ON org_hierarchy(region_id);
CREATE INDEX IF NOT EXISTS idx_org_hierarchy_role ON org_hierarchy(role_level);

-- ========== AGENT TARGETS ==========
CREATE TABLE IF NOT EXISTS agent_targets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK(target_type IN ('boards', 'sims')),
  target_scope TEXT NOT NULL CHECK(target_scope IN ('customers', 'stores')),
  period_type TEXT NOT NULL CHECK(period_type IN ('daily', 'monthly')),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  target_value INTEGER NOT NULL DEFAULT 0,
  achieved_value INTEGER NOT NULL DEFAULT 0,
  region_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'missed', 'cancelled')),
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_targets_agent ON agent_targets(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_targets_tenant ON agent_targets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_targets_period ON agent_targets(period_type, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_agent_targets_type ON agent_targets(target_type, target_scope);
CREATE INDEX IF NOT EXISTS idx_agent_targets_status ON agent_targets(status);
CREATE INDEX IF NOT EXISTS idx_agent_targets_region ON agent_targets(region_id);

-- ========== TARGET PROGRESS ==========
CREATE TABLE IF NOT EXISTS target_progress (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  progress_date TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  reference_type TEXT,
  reference_id TEXT,
  customer_id TEXT,
  customer_name TEXT,
  region_id TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_target_progress_target ON target_progress(target_id);
CREATE INDEX IF NOT EXISTS idx_target_progress_agent ON target_progress(agent_id);
CREATE INDEX IF NOT EXISTS idx_target_progress_date ON target_progress(progress_date);
CREATE INDEX IF NOT EXISTS idx_target_progress_tenant ON target_progress(tenant_id);
CREATE INDEX IF NOT EXISTS idx_target_progress_region ON target_progress(region_id);
