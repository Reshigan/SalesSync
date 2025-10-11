const { test, expect } = require('@playwright/test');

test.describe('Van Sales Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should create new customer', async ({ page }) => {
    // Navigate to customers
    await page.click('[data-testid="nav-customers"]');
    await page.waitForURL('**/customers');
    
    // Click add customer button
    await page.click('[data-testid="add-customer-btn"]');
    
    // Fill customer form
    await page.fill('[data-testid="customer-name"]', 'Test Customer');
    await page.fill('[data-testid="customer-email"]', 'test@customer.com');
    await page.fill('[data-testid="customer-phone"]', '+1234567890');
    await page.fill('[data-testid="customer-address"]', '123 Test Street');
    
    // Submit form
    await page.click('[data-testid="save-customer-btn"]');
    
    // Verify success message
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.success-message')).toContainText('Customer created');
  });

  test('should create new order', async ({ page }) => {
    // Navigate to orders
    await page.click('[data-testid="nav-orders"]');
    await page.waitForURL('**/orders');
    
    // Click add order button
    await page.click('[data-testid="add-order-btn"]');
    
    // Select customer
    await page.click('[data-testid="customer-select"]');
    await page.click('[data-testid="customer-option"]:first-child');
    
    // Add products to order
    await page.click('[data-testid="add-product-btn"]');
    await page.click('[data-testid="product-select"]');
    await page.click('[data-testid="product-option"]:first-child');
    await page.fill('[data-testid="product-quantity"]', '5');
    
    // Submit order
    await page.click('[data-testid="save-order-btn"]');
    
    // Verify success message
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.success-message')).toContainText('Order created');
  });

  test('should manage inventory', async ({ page }) => {
    // Navigate to products
    await page.click('[data-testid="nav-products"]');
    await page.waitForURL('**/products');
    
    // Check inventory levels
    const inventoryItems = page.locator('[data-testid="inventory-item"]');
    await expect(inventoryItems).toHaveCount({ min: 1 });
    
    // Update stock level
    await page.click('[data-testid="update-stock-btn"]:first-child');
    await page.fill('[data-testid="stock-quantity"]', '100');
    await page.click('[data-testid="save-stock-btn"]');
    
    // Verify update
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('should handle route planning', async ({ page }) => {
    // Navigate to routes
    await page.click('[data-testid="nav-routes"]');
    await page.waitForURL('**/routes');
    
    // Create new route
    await page.click('[data-testid="add-route-btn"]');
    await page.fill('[data-testid="route-name"]', 'Test Route');
    
    // Add customers to route
    await page.click('[data-testid="add-customer-to-route"]');
    await page.click('[data-testid="customer-checkbox"]:first-child');
    await page.click('[data-testid="customer-checkbox"]:nth-child(2)');
    
    // Optimize route
    await page.click('[data-testid="optimize-route-btn"]');
    
    // Save route
    await page.click('[data-testid="save-route-btn"]');
    
    // Verify route created
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('should track sales performance', async ({ page }) => {
    // Navigate to analytics
    await page.click('[data-testid="nav-analytics"]');
    await page.waitForURL('**/analytics');
    
    // Check sales metrics
    await expect(page.locator('[data-testid="sales-metrics"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="performance-table"]')).toBeVisible();
    
    // Filter by date range
    await page.click('[data-testid="date-filter"]');
    await page.click('[data-testid="last-30-days"]');
    
    // Verify chart updates
    await expect(page.locator('[data-testid="chart-loading"]')).toBeHidden();
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
  });

  test('should handle offline functionality', async ({ page, context }) => {
    // Navigate to orders
    await page.click('[data-testid="nav-orders"]');
    await page.waitForURL('**/orders');
    
    // Go offline
    await context.setOffline(true);
    
    // Try to create order offline
    await page.click('[data-testid="add-order-btn"]');
    
    // Verify offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Fill order form (should be cached)
    await page.fill('[data-testid="customer-name"]', 'Offline Customer');
    await page.click('[data-testid="save-offline-btn"]');
    
    // Verify offline storage
    await expect(page.locator('.info-message')).toContainText('saved offline');
    
    // Go back online
    await context.setOffline(false);
    
    // Sync offline data
    await page.click('[data-testid="sync-btn"]');
    
    // Verify sync success
    await expect(page.locator('.success-message')).toContainText('synced');
  });
});