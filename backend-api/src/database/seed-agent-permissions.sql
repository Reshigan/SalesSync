



INSERT OR IGNORE INTO role_permissions (id, tenant_id, role, module_id, function_id, can_view, can_create, can_edit, can_delete, can_approve, can_export)
SELECT 
  lower(hex(randomblob(16))),
  '4589f101-f539-42e7-9955-589995dc00af',
  'agent',
  m.id,
  f.id,
  1, 0, 0, 0, 0, 0
FROM modules m
JOIN functions f ON f.module_id = m.id
WHERE m.code = 'customers' AND f.code = 'view'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions 
  WHERE tenant_id = '4589f101-f539-42e7-9955-589995dc00af' 
  AND role = 'agent' 
  AND module_id = m.id 
  AND function_id = f.id
);

INSERT OR IGNORE INTO role_permissions (id, tenant_id, role, module_id, function_id, can_view, can_create, can_edit, can_delete, can_approve, can_export)
SELECT 
  lower(hex(randomblob(16))),
  '4589f101-f539-42e7-9955-589995dc00af',
  'agent',
  m.id,
  f.id,
  1, 0, 0, 0, 0, 0
FROM modules m
JOIN functions f ON f.module_id = m.id
WHERE m.code = 'brands' AND f.code = 'view'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions 
  WHERE tenant_id = '4589f101-f539-42e7-9955-589995dc00af' 
  AND role = 'agent' 
  AND module_id = m.id 
  AND function_id = f.id
);

INSERT OR IGNORE INTO role_permissions (id, tenant_id, role, module_id, function_id, can_view, can_create, can_edit, can_delete, can_approve, can_export)
SELECT 
  lower(hex(randomblob(16))),
  '4589f101-f539-42e7-9955-589995dc00af',
  'agent',
  m.id,
  f.id,
  1, 0, 0, 0, 0, 0
FROM modules m
JOIN functions f ON f.module_id = m.id
WHERE m.code = 'products' AND f.code = 'view'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions 
  WHERE tenant_id = '4589f101-f539-42e7-9955-589995dc00af' 
  AND role = 'agent' 
  AND module_id = m.id 
  AND function_id = f.id
);

INSERT OR IGNORE INTO role_permissions (id, tenant_id, role, module_id, function_id, can_view, can_create, can_edit, can_delete, can_approve, can_export)
SELECT 
  lower(hex(randomblob(16))),
  '4589f101-f539-42e7-9955-589995dc00af',
  'agent',
  m.id,
  f.id,
  1, 1, 0, 0, 0, 0
FROM modules m
JOIN functions f ON f.module_id = m.id
WHERE m.code IN ('field-operations', 'visits', 'field_operations') AND f.code IN ('view', 'create')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions 
  WHERE tenant_id = '4589f101-f539-42e7-9955-589995dc00af' 
  AND role = 'agent' 
  AND module_id = m.id 
  AND function_id = f.id
);

INSERT OR IGNORE INTO role_permissions (id, tenant_id, role, module_id, function_id, can_view, can_create, can_edit, can_delete, can_approve, can_export)
SELECT 
  lower(hex(randomblob(16))),
  '4589f101-f539-42e7-9955-589995dc00af',
  'agent',
  m.id,
  f.id,
  1, 1, 0, 0, 0, 0
FROM modules m
JOIN functions f ON f.module_id = m.id
WHERE m.code = 'surveys' AND f.code IN ('view', 'create')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions 
  WHERE tenant_id = '4589f101-f539-42e7-9955-589995dc00af' 
  AND role = 'agent' 
  AND module_id = m.id 
  AND function_id = f.id
);

INSERT OR IGNORE INTO role_permissions (id, tenant_id, role, module_id, function_id, can_view, can_create, can_edit, can_delete, can_approve, can_export)
SELECT 
  lower(hex(randomblob(16))),
  '4589f101-f539-42e7-9955-589995dc00af',
  'agent',
  m.id,
  f.id,
  1, 1, 0, 0, 0, 0
FROM modules m
JOIN functions f ON f.module_id = m.id
WHERE m.code IN ('boards', 'board-placements') AND f.code IN ('view', 'create')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions 
  WHERE tenant_id = '4589f101-f539-42e7-9955-589995dc00af' 
  AND role = 'agent' 
  AND module_id = m.id 
  AND function_id = f.id
);

INSERT OR IGNORE INTO role_permissions (id, tenant_id, role, module_id, function_id, can_view, can_create, can_edit, can_delete, can_approve, can_export)
SELECT 
  lower(hex(randomblob(16))),
  '4589f101-f539-42e7-9955-589995dc00af',
  'agent',
  m.id,
  f.id,
  1, 0, 0, 0, 0, 0
FROM modules m
JOIN functions f ON f.module_id = m.id
WHERE m.code = 'commissions' AND f.code = 'view'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions 
  WHERE tenant_id = '4589f101-f539-42e7-9955-589995dc00af' 
  AND role = 'agent' 
  AND module_id = m.id 
  AND function_id = f.id
);

INSERT OR IGNORE INTO role_permissions (id, tenant_id, role, module_id, function_id, can_view, can_create, can_edit, can_delete, can_approve, can_export)
SELECT 
  lower(hex(randomblob(16))),
  '4589f101-f539-42e7-9955-589995dc00af',
  'agent',
  m.id,
  f.id,
  1, 0, 0, 0, 0, 0
FROM modules m
JOIN functions f ON f.module_id = m.id
WHERE m.code = 'users' AND f.code = 'view'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions 
  WHERE tenant_id = '4589f101-f539-42e7-9955-589995dc00af' 
  AND role = 'agent' 
  AND module_id = m.id 
  AND function_id = f.id
);

INSERT OR IGNORE INTO role_permissions (id, tenant_id, role, module_id, function_id, can_view, can_create, can_edit, can_delete, can_approve, can_export)
SELECT 
  lower(hex(randomblob(16))),
  '4589f101-f539-42e7-9955-589995dc00af',
  'agent',
  m.id,
  f.id,
  1, 1, 0, 0, 0, 0
FROM modules m
JOIN functions f ON f.module_id = m.id
WHERE m.code = 'files' AND f.code IN ('view', 'create', 'upload')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions 
  WHERE tenant_id = '4589f101-f539-42e7-9955-589995dc00af' 
  AND role = 'agent' 
  AND module_id = m.id 
  AND function_id = f.id
);

INSERT OR IGNORE INTO role_permissions (id, tenant_id, role, module_id, function_id, can_view, can_create, can_edit, can_delete, can_approve, can_export)
SELECT 
  lower(hex(randomblob(16))),
  '4589f101-f539-42e7-9955-589995dc00af',
  'agent',
  m.id,
  f.id,
  1, 1, 0, 0, 0, 0
FROM modules m
JOIN functions f ON f.module_id = m.id
WHERE m.code = 'samples' AND f.code IN ('view', 'create')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions 
  WHERE tenant_id = '4589f101-f539-42e7-9955-589995dc00af' 
  AND role = 'agent' 
  AND module_id = m.id 
  AND function_id = f.id
);

INSERT OR IGNORE INTO role_permissions (id, tenant_id, role, module_id, function_id, can_view, can_create, can_edit, can_delete, can_approve, can_export)
SELECT 
  lower(hex(randomblob(16))),
  '4589f101-f539-42e7-9955-589995dc00af',
  'agent',
  m.id,
  f.id,
  1, 1, 0, 0, 0, 0
FROM modules m
JOIN functions f ON f.module_id = m.id
WHERE m.code IN ('van-sales', 'orders') AND f.code IN ('view', 'create')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions 
  WHERE tenant_id = '4589f101-f539-42e7-9955-589995dc00af' 
  AND role = 'agent' 
  AND module_id = m.id 
  AND function_id = f.id
);

INSERT OR IGNORE INTO role_permissions (id, tenant_id, role, module_id, function_id, can_view, can_create, can_edit, can_delete, can_approve, can_export)
SELECT 
  lower(hex(randomblob(16))),
  '4589f101-f539-42e7-9955-589995dc00af',
  'agent',
  m.id,
  f.id,
  1, 0, 0, 0, 0, 0
FROM modules m
JOIN functions f ON f.module_id = m.id
WHERE m.code = 'inventory' AND f.code = 'view'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions 
  WHERE tenant_id = '4589f101-f539-42e7-9955-589995dc00af' 
  AND role = 'agent' 
  AND module_id = m.id 
  AND function_id = f.id
);

SELECT 
  'Agent permissions created:' as message,
  COUNT(*) as count
FROM role_permissions
WHERE tenant_id = '4589f101-f539-42e7-9955-589995dc00af'
AND role = 'agent';
