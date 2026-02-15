-- Migration: Add tables for frontend wiring (document relationships, payment allocations, commission rules)

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

CREATE INDEX IF NOT EXISTS idx_doc_rel_source ON document_relationships(source_entity_type, source_entity_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_doc_rel_related ON document_relationships(related_entity_type, related_entity_id, tenant_id);

CREATE TABLE IF NOT EXISTS payment_allocations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  invoice_id TEXT,
  amount REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (payment_id) REFERENCES payments(id)
);

CREATE INDEX IF NOT EXISTS idx_payment_alloc_payment ON payment_allocations(payment_id, tenant_id);

CREATE TABLE IF NOT EXISTS commission_rules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL DEFAULT 'percentage',
  value REAL NOT NULL DEFAULT 0,
  conditions TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_commission_rules_tenant ON commission_rules(tenant_id, status);
