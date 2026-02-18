-- Migration 0012: Add 21 tables that exist in production D1 but were missing from migrations
-- This ensures dev/test environments created from migrations match production exactly

CREATE TABLE IF NOT EXISTS backup_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    user_id TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('backup_started', 'backup_completed', 'backup_failed', 'restore_started', 'restore_completed', 'restore_failed')),
    details TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS bank_deposits (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    session_id TEXT,
    deposit_date TEXT,
    amount REAL NOT NULL DEFAULT 0,
    bank_name TEXT,
    reference_number TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS beat_plans (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    beat_route_id TEXT NOT NULL,
    salesman_id TEXT NOT NULL,
    plan_date TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    status TEXT NOT NULL DEFAULT 'planned',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS commission_deductions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    amount REAL NOT NULL,
    reason TEXT,
    reference_type TEXT,
    reference_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'cancelled')),
    applied_to_payout_id TEXT,
    applied_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (agent_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS commission_reversals (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    commission_id TEXT NOT NULL,
    return_id TEXT NOT NULL,
    original_amount REAL NOT NULL,
    reversal_amount REAL NOT NULL,
    reason TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (commission_id) REFERENCES commissions(id),
    FOREIGN KEY (return_id) REFERENCES returns(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS competitor_activities (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    competitor_id TEXT NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('promotion', 'campaign', 'product_launch', 'price_change', 'expansion', 'partnership', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    activity_date TEXT NOT NULL,
    end_date TEXT,
    impact_level TEXT DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
    location TEXT,
    observed_by TEXT,
    evidence_url TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE,
    FOREIGN KEY (observed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS competitor_price_history (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    competitor_id TEXT NOT NULL,
    product_id TEXT,
    price REAL NOT NULL,
    price_index REAL DEFAULT 100,
    location TEXT,
    observed_by TEXT,
    recorded_at TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES competitor_products(id) ON DELETE SET NULL,
    FOREIGN KEY (observed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS competitor_products (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    competitor_id TEXT NOT NULL,
    name TEXT NOT NULL,
    sku TEXT,
    category TEXT,
    price REAL DEFAULT 0,
    price_index REAL DEFAULT 100,
    our_equivalent_product_id TEXT,
    description TEXT,
    image_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE,
    FOREIGN KEY (our_equivalent_product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS document_relationships (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    source_entity_type TEXT NOT NULL,
    source_entity_id TEXT NOT NULL,
    source_entity_number TEXT,
    relationship_type TEXT NOT NULL,
    related_entity_type TEXT NOT NULL,
    related_entity_id TEXT NOT NULL,
    related_entity_number TEXT,
    created_by TEXT,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS integration_sync_log (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    config_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    direction TEXT CHECK (direction IN ('pushed', 'pulled')),
    external_id TEXT,
    synced_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS location_currencies (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    country_code TEXT NOT NULL,
    country_name TEXT NOT NULL,
    region TEXT,
    currency_id TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (currency_id) REFERENCES currencies(id)
);

CREATE TABLE IF NOT EXISTS master_data_audit_log (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    user_id TEXT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'activate', 'deactivate')),
    old_data TEXT,
    new_data TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notification_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'push')),
    recipient TEXT NOT NULL,
    subject TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'failed', 'skipped')),
    metadata TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS order_lines (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 0,
    unit_price REAL NOT NULL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    line_total REAL DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS price_change_requests (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    old_price REAL,
    new_price REAL NOT NULL,
    requested_by TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    processed_by TEXT,
    processed_at TEXT,
    comments TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (processed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS quotation_items (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    quotation_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 0,
    unit_price REAL NOT NULL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    line_total REAL DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (quotation_id) REFERENCES quotations(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS route_customers (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    beat_route_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    visit_order INTEGER DEFAULT 0,
    visit_frequency TEXT,
    last_visit_date TEXT,
    next_visit_date TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sync_jobs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    config_id TEXT NOT NULL,
    sync_type TEXT DEFAULT 'full' CHECK (sync_type IN ('full', 'incremental', 'manual')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    started_at TEXT,
    completed_at TEXT,
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_log TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS territory_assignments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    territory_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    assigned_by TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (territory_id) REFERENCES territories(id),
    FOREIGN KEY (agent_id) REFERENCES users(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_devices (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    device_token TEXT NOT NULL,
    device_type TEXT CHECK (device_type IN ('ios', 'android', 'web')),
    device_name TEXT,
    is_active INTEGER DEFAULT 1,
    last_used_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS warehouse_stock (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    warehouse_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 0,
    reserved_quantity REAL DEFAULT 0,
    min_stock_level REAL,
    max_stock_level REAL,
    reorder_point REAL,
    created_at TEXT DEFAULT (datetime('now'))
);
