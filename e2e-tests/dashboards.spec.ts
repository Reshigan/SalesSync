import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'https://ss.gonxt.tech'
const TEST_EMAIL = 'demo@demo.com'
const TEST_PASSWORD = 'demo123'

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', TEST_EMAIL)
    await page.fill('input[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard', { timeout: 10000 })
  })

  test('Finance Dashboard - Load and Display Metrics', async ({ page }) => {
    await page.goto(`${BASE_URL}/finance/dashboard`)
    await page.waitForLoadState('networkidle')
    
    // Check page title
    await expect(page.locator('h4:has-text("Finance Dashboard")')).toBeVisible()
    
    // Check metric cards are visible
    await expect(page.locator('text=Total Revenue')).toBeVisible()
    await expect(page.locator('text=Outstanding AR')).toBeVisible()
    await expect(page.locator('text=Outstanding AP')).toBeVisible()
    await expect(page.locator('text=Net Cash Flow')).toBeVisible()
    
    // Check for chart components
    await expect(page.locator('text=Cash Flow Trend')).toBeVisible()
    
    // Verify data is loaded (not showing loading spinner)
    await expect(page.locator('div[role="progressbar"]')).not.toBeVisible()
  })

  test('Sales Dashboard - Load and Display Metrics', async ({ page }) => {
    await page.goto(`${BASE_URL}/sales/dashboard`)
    await page.waitForLoadState('networkidle')
    
    // Check page title
    await expect(page.locator('h4:has-text("Sales Dashboard")')).toBeVisible()
    
    // Check metric cards
    await expect(page.locator('text=Total Orders')).toBeVisible()
    await expect(page.locator('text=Total Sales')).toBeVisible()
    await expect(page.locator('text=Average Order Value')).toBeVisible()
    await expect(page.locator('text=Conversion Rate')).toBeVisible()
    
    // Check for charts
    await expect(page.locator('text=Sales Trends')).toBeVisible()
    
    // Verify no errors
    await expect(page.locator('text=Failed to load')).not.toBeVisible()
  })

  test('Customer Dashboard - Load and Display Metrics', async ({ page }) => {
    await page.goto(`${BASE_URL}/customers/dashboard`)
    await page.waitForLoadState('networkidle')
    
    // Check page title
    await expect(page.locator('h4:has-text("Customer Dashboard")')).toBeVisible()
    
    // Check metric cards
    await expect(page.locator('text=Total Customers')).toBeVisible()
    await expect(page.locator('text=New Customers')).toBeVisible()
    await expect(page.locator('text=Active Customers')).toBeVisible()
    await expect(page.locator('text=Customer Lifetime Value')).toBeVisible()
    
    // Check for top customers table
    await expect(page.locator('text=Top Customers')).toBeVisible()
    
    // Verify table headers
    await expect(page.locator('th:has-text("Customer Name")')).toBeVisible()
    await expect(page.locator('th:has-text("Total Spent")')).toBeVisible()
  })

  test('Orders Dashboard - Load and Display Metrics', async ({ page }) => {
    await page.goto(`${BASE_URL}/orders/dashboard`)
    await page.waitForLoadState('networkidle')
    
    // Check page title
    await expect(page.locator('h4:has-text("Orders Dashboard")')).toBeVisible()
    
    // Check metric cards
    await expect(page.locator('text=Total Orders')).toBeVisible()
    await expect(page.locator('text=Pending Orders')).toBeVisible()
    await expect(page.locator('text=Delivered Orders')).toBeVisible()
    await expect(page.locator('text=Total Order Value')).toBeVisible()
    
    // Check for recent orders table
    await expect(page.locator('text=Recent Orders')).toBeVisible()
    
    // Verify table headers
    await expect(page.locator('th:has-text("Order Number")')).toBeVisible()
    await expect(page.locator('th:has-text("Customer")')).toBeVisible()
    await expect(page.locator('th:has-text("Amount")')).toBeVisible()
  })

  test('Admin Dashboard - Load and Display Metrics', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`)
    await page.waitForLoadState('networkidle')
    
    // Check page title
    await expect(page.locator('h4:has-text("Admin Dashboard")')).toBeVisible()
    
    // Check metric cards
    await expect(page.locator('text=Total Users')).toBeVisible()
    await expect(page.locator('text=Total Agents')).toBeVisible()
    await expect(page.locator('text=Total Customers')).toBeVisible()
    await expect(page.locator('text=Total Revenue')).toBeVisible()
    
    // Check system health section
    await expect(page.locator('text=System Health')).toBeVisible()
    await expect(page.locator('text=Pending Payments')).toBeVisible()
    
    // Check agent performance table
    await expect(page.locator('text=Top Performing Agents')).toBeVisible()
  })

  test('Navigation - All Dashboard Links Work', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    
    // Test Finance Dashboard link
    await page.click('a[href="/finance/dashboard"]')
    await expect(page).toHaveURL(/.*finance\/dashboard/)
    await expect(page.locator('h4:has-text("Finance Dashboard")')).toBeVisible()
    
    // Test Sales Dashboard link
    await page.click('a[href="/sales/dashboard"]')
    await expect(page).toHaveURL(/.*sales\/dashboard/)
    await expect(page.locator('h4:has-text("Sales Dashboard")')).toBeVisible()
    
    // Test Customer Dashboard link
    await page.click('a[href="/customers/dashboard"]')
    await expect(page).toHaveURL(/.*customers\/dashboard/)
    await expect(page.locator('h4:has-text("Customer Dashboard")')).toBeVisible()
    
    // Test Orders Dashboard link
    await page.click('a[href="/orders/dashboard"]')
    await expect(page).toHaveURL(/.*orders\/dashboard/)
    await expect(page.locator('h4:has-text("Orders Dashboard")')).toBeVisible()
    
    // Test Admin Dashboard link
    await page.click('a[href="/admin/dashboard"]')
    await expect(page).toHaveURL(/.*admin\/dashboard/)
    await expect(page.locator('h4:has-text("Admin Dashboard")')).toBeVisible()
  })

  test('API Integration - All Dashboards Load Real Data', async ({ page }) => {
    // Intercept API calls to verify they're being made
    const apiCalls = {
      finance: false,
      sales: false,
      customers: false,
      orders: false,
      admin: false
    }
    
    page.on('response', response => {
      if (response.url().includes('/api/dashboard/finance')) apiCalls.finance = true
      if (response.url().includes('/api/dashboard/sales')) apiCalls.sales = true
      if (response.url().includes('/api/dashboard/customers')) apiCalls.customers = true
      if (response.url().includes('/api/dashboard/orders')) apiCalls.orders = true
      if (response.url().includes('/api/dashboard/admin')) apiCalls.admin = true
    })
    
    // Visit each dashboard
    await page.goto(`${BASE_URL}/finance/dashboard`)
    await page.waitForLoadState('networkidle')
    
    await page.goto(`${BASE_URL}/sales/dashboard`)
    await page.waitForLoadState('networkidle')
    
    await page.goto(`${BASE_URL}/customers/dashboard`)
    await page.waitForLoadState('networkidle')
    
    await page.goto(`${BASE_URL}/orders/dashboard`)
    await page.waitForLoadState('networkidle')
    
    await page.goto(`${BASE_URL}/admin/dashboard`)
    await page.waitForLoadState('networkidle')
    
    // Verify all API calls were made
    expect(apiCalls.finance).toBe(true)
    expect(apiCalls.sales).toBe(true)
    expect(apiCalls.customers).toBe(true)
    expect(apiCalls.orders).toBe(true)
    expect(apiCalls.admin).toBe(true)
  })

  test('Responsive Design - Dashboards Work on Mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    const dashboards = [
      '/finance/dashboard',
      '/sales/dashboard',
      '/customers/dashboard',
      '/orders/dashboard',
      '/admin/dashboard'
    ]
    
    for (const dashboard of dashboards) {
      await page.goto(`${BASE_URL}${dashboard}`)
      await page.waitForLoadState('networkidle')
      
      // Verify page loads without horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(375)
      
      // Verify no error messages
      await expect(page.locator('text=Failed to load')).not.toBeVisible()
    }
  })

  test('Error Handling - Graceful Degradation', async ({ page }) => {
    // Test with invalid auth token
    await page.goto(`${BASE_URL}/logout`)
    await page.goto(`${BASE_URL}/finance/dashboard`)
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/)
  })
})

test.describe('API Health Checks', () => {
  test('Backend APIs Are Responding', async ({ request }) => {
    // Test each dashboard API endpoint
    const endpoints = [
      '/api/dashboard/finance',
      '/api/dashboard/sales',
      '/api/dashboard/customers',
      '/api/dashboard/orders',
      '/api/dashboard/admin'
    ]
    
    for (const endpoint of endpoints) {
      const response = await request.get(`${BASE_URL}${endpoint}`)
      expect(response.status()).toBeLessThan(500) // Accept 401 but not 500
    }
  })

  test('Frontend Static Assets Load', async ({ request }) => {
    const response = await request.get(BASE_URL)
    expect(response.status()).toBe(200)
    
    const html = await response.text()
    expect(html).toContain('<!doctype html>')
  })
})
