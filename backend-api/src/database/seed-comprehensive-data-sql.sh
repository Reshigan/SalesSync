#!/bin/bash

DB_PATH="/var/www/salessync-api/database/salessync.db"

echo "🌱 Starting comprehensive data seeding..."
echo ""

TENANT_ID=$(sqlite3 $DB_PATH "SELECT id FROM tenants WHERE code = 'DEMO';")
if [ -z "$TENANT_ID" ]; then
  echo "❌ DEMO tenant not found!"
  exit 1
fi
echo "✅ Found DEMO tenant: $TENANT_ID"
echo ""

ADMIN_ID=$(sqlite3 $DB_PATH "SELECT id FROM users WHERE email = 'admin@demo.com' AND tenant_id = '$TENANT_ID';")
if [ -z "$ADMIN_ID" ]; then
  echo "❌ Admin user not found!"
  exit 1
fi
echo "✅ Found admin user: $ADMIN_ID"
echo ""

generate_uuid() {
  cat /dev/urandom | tr -dc 'a-f0-9' | fold -w 32 | head -n 1
}

random_date() {
  echo "2024-$(printf "%02d" $((1 + RANDOM % 12)))-$(printf "%02d" $((1 + RANDOM % 28)))"
}

random_lat() {
  echo "-$((26 + RANDOM % 8)).$((RANDOM % 1000000))"
}

random_lng() {
  echo "$((16 + RANDOM % 16)).$((RANDOM % 1000000))"
}

echo "📦 Creating brands..."
sqlite3 $DB_PATH <<EOF
BEGIN TRANSACTION;

-- Brands
INSERT OR IGNORE INTO brands (id, tenant_id, name, description, created_at, updated_at) VALUES
('$(generate_uuid)', '$TENANT_ID', 'Coca-Cola', 'Coca-Cola - Beverages', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('$(generate_uuid)', '$TENANT_ID', 'Pepsi', 'Pepsi - Beverages', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('$(generate_uuid)', '$TENANT_ID', 'MTN', 'MTN - Telecommunications', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('$(generate_uuid)', '$TENANT_ID', 'Vodacom', 'Vodacom - Telecommunications', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('$(generate_uuid)', '$TENANT_ID', 'Samsung', 'Samsung - Electronics', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('$(generate_uuid)', '$TENANT_ID', 'Huawei', 'Huawei - Electronics', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('$(generate_uuid)', '$TENANT_ID', 'Castle Lager', 'Castle Lager - Alcohol', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('$(generate_uuid)', '$TENANT_ID', 'Nandos', 'Nandos - Food', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('$(generate_uuid)', '$TENANT_ID', 'Shoprite', 'Shoprite - Retail', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('$(generate_uuid)', '$TENANT_ID', 'Pick n Pay', 'Pick n Pay - Retail', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

COMMIT;
EOF

BRAND_COUNT=$(sqlite3 $DB_PATH "SELECT COUNT(*) FROM brands WHERE tenant_id = '$TENANT_ID';")
echo "✅ Created brands (total: $BRAND_COUNT)"
echo ""

echo "🖼️  Creating brand pictures..."
BRAND_IDS=$(sqlite3 $DB_PATH "SELECT id FROM brands WHERE tenant_id = '$TENANT_ID' LIMIT 10;")

PICTURE_COUNT=0
for BRAND_ID in $BRAND_IDS; do
  BRAND_NAME=$(sqlite3 $DB_PATH "SELECT name FROM brands WHERE id = '$BRAND_ID';")
  
  for PICTURE_TYPE in logo board product; do
    PICTURE_ID=$(generate_uuid)
    PICTURE_URL="/uploads/brands/$(echo $BRAND_NAME | tr '[:upper:]' '[:lower:]' | tr ' ' '-')/${PICTURE_TYPE}-v1.jpg"
    METADATA='{"width":1920,"height":1080,"file_size":245678,"format":"jpg","upload_source":"admin_portal"}'
    
    sqlite3 $DB_PATH "INSERT INTO brand_pictures (id, tenant_id, brand_id, picture_url, picture_type, version, is_active, valid_from, metadata, created_by, created_at, updated_at) VALUES ('$PICTURE_ID', '$TENANT_ID', '$BRAND_ID', '$PICTURE_URL', '$PICTURE_TYPE', 1, 1, '2024-01-01', '$METADATA', '$ADMIN_ID', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);"
    
    PICTURE_COUNT=$((PICTURE_COUNT + 1))
  done
done

echo "✅ Created $PICTURE_COUNT brand pictures"
echo ""

echo "👥 Creating customers..."
for i in $(seq 1 50); do
  CUSTOMER_ID=$(generate_uuid)
  LAT=$(random_lat)
  LNG=$(random_lng)
  
  sqlite3 $DB_PATH "INSERT INTO customers (id, tenant_id, name, email, phone, customer_type, address, city, province, postal_code, latitude, longitude, credit_limit, payment_terms, status, created_at, updated_at) VALUES ('$CUSTOMER_ID', '$TENANT_ID', 'SPAZA SHOP $i', 'customer$i@demo.com', '+27810000$i', 'spaza_shop', '$i Main Street', 'Johannesburg', 'Gauteng', '$(printf "%04d" $i)', $LAT, $LNG, $((10000 + i * 1000)), 30, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);"
done

CUSTOMER_COUNT=$(sqlite3 $DB_PATH "SELECT COUNT(*) FROM customers WHERE tenant_id = '$TENANT_ID';")
echo "✅ Created customers (total: $CUSTOMER_COUNT)"
echo ""

echo "📦 Creating products..."
for i in $(seq 1 30); do
  PRODUCT_ID=$(generate_uuid)
  UNIT_PRICE=$((10 + RANDOM % 490))
  COST_PRICE=$((UNIT_PRICE * 60 / 100))
  
  sqlite3 $DB_PATH "INSERT INTO products (id, tenant_id, code, name, description, category, unit_price, cost_price, unit_of_measure, status, created_at, updated_at) VALUES ('$PRODUCT_ID', '$TENANT_ID', 'PROD$(printf "%04d" $i)', 'Beverages Product $i', 'High quality beverages product', 'Beverages', $UNIT_PRICE, $COST_PRICE, 'case', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);"
done

PRODUCT_COUNT=$(sqlite3 $DB_PATH "SELECT COUNT(*) FROM products WHERE tenant_id = '$TENANT_ID';")
echo "✅ Created products (total: $PRODUCT_COUNT)"
echo ""

echo "✅ Comprehensive data seeding completed successfully!"
echo ""
echo "📊 Summary:"
echo "   - Brands: $BRAND_COUNT"
echo "   - Brand Pictures: $PICTURE_COUNT"
echo "   - Customers: $CUSTOMER_COUNT"
echo "   - Products: $PRODUCT_COUNT"
echo ""
