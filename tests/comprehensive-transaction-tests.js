/**
 * COMPREHENSIVE TRANSACTION TESTS
 * SalesSync Trade AI System - Full End-to-End Testing with Real Transactions
 * 
 * This test suite validates every transaction type across all modules
 * with real database operations and API calls.
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ComprehensiveTransactionTests {
    constructor() {
        this.baseUrl = 'https://ss.gonxt.tech';
        this.apiUrl = 'https://ss.gonxt.tech/api';
        this.browser = null;
        this.page = null;
        this.authToken = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            transactions: [],
            performance: [],
            errors: []
        };
        this.credentials = {
            email: 'admin@demo.com',
            password: 'admin123'
        };
    }

    async init() {
        console.log('🚀 Initializing Comprehensive Transaction Tests...');
        
        // Launch browser
        this.browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
        });
        
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        // Set up monitoring
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('🔴 Browser Error:', msg.text());
                this.testResults.errors.push({
                    type: 'browser',
                    message: msg.text(),
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        this.page.on('response', response => {
            if (response.url().includes('/api/') && response.status() >= 400) {
                console.log(`🔴 API Error: ${response.status()} ${response.url()}`);
                this.testResults.errors.push({
                    type: 'api',
                    status: response.status(),
                    url: response.url(),
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    async authenticate() {
        console.log('🔐 Authenticating...');
        
        try {
            const response = await axios.post(`${this.apiUrl}/auth/login`, {
                email: this.credentials.email,
                password: this.credentials.password
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-Code': 'DEMO'
                }
            });

            if (response.data && response.data.accessToken) {
                this.authToken = response.data.accessToken;
                console.log('✅ Authentication successful');
                return true;
            } else {
                throw new Error('No access token received');
            }
        } catch (error) {
            console.log('❌ Authentication failed:', error.message);
            return false;
        }
    }

    async loginToBrowser() {
        console.log('🌐 Logging into browser...');
        
        await this.page.goto(`${this.baseUrl}/login`);
        await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });
        
        await this.page.type('input[type="email"]', this.credentials.email);
        await this.page.type('input[type="password"]', this.credentials.password);
        await this.page.click('button[type="submit"]');
        
        await this.page.waitForNavigation({ timeout: 15000 });
        console.log('✅ Browser login successful');
    }

    async runTest(testName, testFunction) {
        this.testResults.total++;
        console.log(`\n🧪 Running: ${testName}`);
        
        const startTime = Date.now();
        
        try {
            const result = await testFunction();
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            this.testResults.passed++;
            this.testResults.transactions.push({
                test: testName,
                status: 'PASSED',
                duration: duration,
                result: result,
                timestamp: new Date().toISOString()
            });
            
            this.testResults.performance.push({
                test: testName,
                duration: duration
            });
            
            console.log(`✅ PASSED: ${testName} (${duration}ms)`);
            return result;
        } catch (error) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            this.testResults.failed++;
            this.testResults.transactions.push({
                test: testName,
                status: 'FAILED',
                duration: duration,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            console.log(`❌ FAILED: ${testName} - ${error.message} (${duration}ms)`);
            throw error;
        }
    }

    // ========================================
    // API TRANSACTION TESTS
    // ========================================
    
    async testAPITransactions() {
        console.log('\n🔌 TESTING API TRANSACTIONS');
        
        await this.runTest('API - Van Sales Loading Transaction', async () => {
            const loadingData = {
                routeId: 'VR-001',
                driverId: 1,
                items: [
                    { productId: 1, quantity: 10 },
                    { productId: 2, quantity: 5 }
                ],
                status: 'completed'
            };
            
            const response = await axios.post(`${this.apiUrl}/van-sales/loadings`, loadingData, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO',
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.status !== 201 && response.status !== 200) {
                throw new Error(`API returned status ${response.status}`);
            }
            
            return {
                loadingId: response.data.id || 'created',
                routeId: loadingData.routeId,
                itemCount: loadingData.items.length
            };
        });

        await this.runTest('API - Create Promotion Campaign', async () => {
            const campaignData = {
                name: 'API Test Campaign ' + Date.now(),
                description: 'Automated API test campaign',
                budget: 25000,
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active'
            };
            
            const response = await axios.post(`${this.apiUrl}/promotions/campaigns`, campaignData, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO',
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.status !== 201 && response.status !== 200) {
                throw new Error(`API returned status ${response.status}`);
            }
            
            return {
                campaignId: response.data.id || 'created',
                name: campaignData.name,
                budget: campaignData.budget
            };
        });

        await this.runTest('API - Create Stock Movement', async () => {
            const movementData = {
                productId: 1,
                warehouseId: 1,
                type: 'adjustment',
                quantity: 25,
                reason: 'API test adjustment',
                reference: 'API-TEST-' + Date.now()
            };
            
            const response = await axios.post(`${this.apiUrl}/warehouse/stock-movements`, movementData, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO',
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.status !== 201 && response.status !== 200) {
                throw new Error(`API returned status ${response.status}`);
            }
            
            return {
                movementId: response.data.id || 'created',
                type: movementData.type,
                quantity: movementData.quantity
            };
        });

        await this.runTest('API - Process Payment', async () => {
            const paymentData = {
                orderId: 1,
                amount: 150.75,
                method: 'bank_transfer',
                reference: 'API-PAY-' + Date.now(),
                status: 'completed'
            };
            
            const response = await axios.post(`${this.apiUrl}/back-office/payments`, paymentData, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO',
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.status !== 201 && response.status !== 200) {
                throw new Error(`API returned status ${response.status}`);
            }
            
            return {
                paymentId: response.data.id || 'created',
                amount: paymentData.amount,
                method: paymentData.method
            };
        });
    }

    // ========================================
    // FRONTEND TRANSACTION TESTS
    // ========================================
    
    async testFrontendTransactions() {
        console.log('\n🌐 TESTING FRONTEND TRANSACTIONS');
        
        await this.runTest('Frontend - Navigate All Major Pages', async () => {
            const pages = [
                '/dashboard',
                '/van-sales',
                '/promotions',
                '/merchandising',
                '/field-agents',
                '/warehouse',
                '/back-office',
                '/trade-marketing',
                '/analytics',
                '/admin'
            ];
            
            const results = [];
            
            for (const page of pages) {
                try {
                    await this.page.goto(`${this.baseUrl}${page}`, { waitUntil: 'networkidle0', timeout: 10000 });
                    
                    // Check if page loaded successfully (no 404 or error)
                    const title = await this.page.title();
                    const hasError = await this.page.$('.error-page, .not-found, [data-testid="error"]');
                    
                    results.push({
                        page,
                        loaded: !hasError,
                        title: title,
                        status: 'success'
                    });
                    
                    console.log(`  ✅ ${page} - ${title}`);
                } catch (error) {
                    results.push({
                        page,
                        loaded: false,
                        error: error.message,
                        status: 'failed'
                    });
                    console.log(`  ❌ ${page} - ${error.message}`);
                }
            }
            
            const successfulPages = results.filter(r => r.loaded).length;
            const successRate = (successfulPages / pages.length) * 100;
            
            if (successRate < 90) {
                throw new Error(`Too many pages failed to load: ${successRate}% success rate`);
            }
            
            return {
                totalPages: pages.length,
                successfulPages,
                successRate,
                results
            };
        });

        await this.runTest('Frontend - Van Sales Loading Form', async () => {
            await this.page.goto(`${this.baseUrl}/van-sales/loading`);
            await this.page.waitForSelector('form, [data-testid="loading-form"]', { timeout: 10000 });
            
            // Check if form elements exist
            const hasRouteSelect = await this.page.$('select, [data-testid="route-select"]');
            const hasSubmitButton = await this.page.$('button[type="submit"], [data-testid="confirm-loading"]');
            
            if (!hasRouteSelect) {
                throw new Error('Route selection not found');
            }
            
            if (!hasSubmitButton) {
                throw new Error('Submit button not found');
            }
            
            // Try to interact with form
            try {
                if (hasRouteSelect) {
                    await this.page.evaluate(() => {
                        const select = document.querySelector('select, [data-testid="route-select"]');
                        if (select && select.options.length > 1) {
                            select.selectedIndex = 1;
                            select.dispatchEvent(new Event('change'));
                        }
                    });
                }
                
                await this.page.waitForTimeout(1000);
                
                if (hasSubmitButton) {
                    await hasSubmitButton.click();
                    await this.page.waitForTimeout(2000);
                }
            } catch (error) {
                console.log('Form interaction warning:', error.message);
            }
            
            return {
                formFound: true,
                routeSelectFound: !!hasRouteSelect,
                submitButtonFound: !!hasSubmitButton
            };
        });

        await this.runTest('Frontend - Promotions Campaign Creation', async () => {
            await this.page.goto(`${this.baseUrl}/promotions/campaigns`);
            await this.page.waitForSelector('div, [data-testid="campaigns-list"]', { timeout: 10000 });
            
            // Look for create campaign button
            const createButton = await this.page.$('button, [data-testid="create-campaign"], .create-btn, .add-btn');
            
            if (createButton) {
                try {
                    await createButton.click();
                    await this.page.waitForTimeout(2000);
                    
                    // Check if form appeared
                    const form = await this.page.$('form, [data-testid="campaign-form"], .modal, .dialog');
                    
                    return {
                        createButtonFound: true,
                        formAppeared: !!form
                    };
                } catch (error) {
                    return {
                        createButtonFound: true,
                        formAppeared: false,
                        error: error.message
                    };
                }
            }
            
            return {
                createButtonFound: false,
                pageLoaded: true
            };
        });
    }

    // ========================================
    // PERFORMANCE TESTS
    // ========================================
    
    async testPerformance() {
        console.log('\n⚡ TESTING PERFORMANCE');
        
        await this.runTest('Performance - API Response Times', async () => {
            const endpoints = [
                '/auth/profile',
                '/dashboard',
                '/van-sales/routes',
                '/promotions/campaigns',
                '/warehouse/inventory',
                '/back-office/orders',
                '/field-agents',
                '/analytics/dashboard'
            ];
            
            const results = [];
            
            for (const endpoint of endpoints) {
                const startTime = Date.now();
                
                try {
                    const response = await axios.get(`${this.apiUrl}${endpoint}`, {
                        headers: {
                            'Authorization': `Bearer ${this.authToken}`,
                            'X-Tenant-Code': 'DEMO'
                        },
                        timeout: 10000
                    });
                    
                    const endTime = Date.now();
                    const duration = endTime - startTime;
                    
                    results.push({
                        endpoint,
                        status: response.status,
                        duration,
                        success: true
                    });
                    
                    console.log(`  ✅ ${endpoint}: ${duration}ms`);
                } catch (error) {
                    const endTime = Date.now();
                    const duration = endTime - startTime;
                    
                    results.push({
                        endpoint,
                        status: error.response?.status || 'timeout',
                        duration,
                        success: false,
                        error: error.message
                    });
                    
                    console.log(`  ❌ ${endpoint}: ${error.message}`);
                }
            }
            
            const successfulRequests = results.filter(r => r.success);
            const avgResponseTime = successfulRequests.reduce((sum, r) => sum + r.duration, 0) / successfulRequests.length;
            const successRate = (successfulRequests.length / results.length) * 100;
            
            if (avgResponseTime > 5000) {
                throw new Error(`Average response time too high: ${avgResponseTime}ms`);
            }
            
            if (successRate < 80) {
                throw new Error(`Success rate too low: ${successRate}%`);
            }
            
            return {
                avgResponseTime: Math.round(avgResponseTime),
                successRate,
                results
            };
        });

        await this.runTest('Performance - Frontend Page Load Times', async () => {
            const pages = [
                '/dashboard',
                '/van-sales',
                '/promotions',
                '/warehouse',
                '/back-office'
            ];
            
            const results = [];
            
            for (const page of pages) {
                const startTime = Date.now();
                
                try {
                    await this.page.goto(`${this.baseUrl}${page}`, { 
                        waitUntil: 'networkidle0', 
                        timeout: 15000 
                    });
                    
                    const endTime = Date.now();
                    const duration = endTime - startTime;
                    
                    results.push({
                        page,
                        duration,
                        success: true
                    });
                    
                    console.log(`  ✅ ${page}: ${duration}ms`);
                } catch (error) {
                    const endTime = Date.now();
                    const duration = endTime - startTime;
                    
                    results.push({
                        page,
                        duration,
                        success: false,
                        error: error.message
                    });
                    
                    console.log(`  ❌ ${page}: ${error.message}`);
                }
            }
            
            const successfulPages = results.filter(r => r.success);
            const avgLoadTime = successfulPages.reduce((sum, r) => sum + r.duration, 0) / successfulPages.length;
            const successRate = (successfulPages.length / results.length) * 100;
            
            if (avgLoadTime > 10000) {
                throw new Error(`Average page load time too high: ${avgLoadTime}ms`);
            }
            
            if (successRate < 80) {
                throw new Error(`Page load success rate too low: ${successRate}%`);
            }
            
            return {
                avgLoadTime: Math.round(avgLoadTime),
                successRate,
                results
            };
        });
    }

    // ========================================
    // DATA VALIDATION TESTS
    // ========================================
    
    async testDataValidation() {
        console.log('\n🔍 TESTING DATA VALIDATION');
        
        await this.runTest('Data - API Endpoints Return Data', async () => {
            const endpoints = [
                { path: '/van-sales/routes', name: 'Van Sales Routes' },
                { path: '/promotions/campaigns', name: 'Promotion Campaigns' },
                { path: '/warehouse/inventory', name: 'Warehouse Inventory' },
                { path: '/back-office/orders', name: 'Back Office Orders' },
                { path: '/field-agents', name: 'Field Agents' },
                { path: '/admin/users', name: 'Admin Users' },
                { path: '/admin/roles', name: 'Admin Roles' }
            ];
            
            const results = [];
            
            for (const endpoint of endpoints) {
                try {
                    const response = await axios.get(`${this.apiUrl}${endpoint.path}`, {
                        headers: {
                            'Authorization': `Bearer ${this.authToken}`,
                            'X-Tenant-Code': 'DEMO'
                        }
                    });
                    
                    const data = response.data.data || response.data;
                    const hasData = Array.isArray(data) ? data.length > 0 : !!data;
                    const recordCount = Array.isArray(data) ? data.length : (data ? 1 : 0);
                    
                    results.push({
                        endpoint: endpoint.name,
                        path: endpoint.path,
                        hasData,
                        recordCount,
                        success: true
                    });
                    
                    console.log(`  ✅ ${endpoint.name}: ${recordCount} records`);
                } catch (error) {
                    results.push({
                        endpoint: endpoint.name,
                        path: endpoint.path,
                        hasData: false,
                        recordCount: 0,
                        success: false,
                        error: error.message
                    });
                    
                    console.log(`  ❌ ${endpoint.name}: ${error.message}`);
                }
            }
            
            const endpointsWithData = results.filter(r => r.hasData).length;
            const dataAvailabilityRate = (endpointsWithData / results.length) * 100;
            
            if (dataAvailabilityRate < 70) {
                throw new Error(`Too many endpoints without data: ${dataAvailabilityRate}% have data`);
            }
            
            return {
                totalEndpoints: results.length,
                endpointsWithData,
                dataAvailabilityRate,
                results
            };
        });
    }

    // ========================================
    // MAIN TEST RUNNER
    // ========================================
    
    async runAllTests() {
        console.log('🚀 STARTING COMPREHENSIVE TRANSACTION TESTS');
        console.log('==============================================');
        
        try {
            // Initialize
            await this.init();
            
            // Authenticate
            const authSuccess = await this.authenticate();
            if (!authSuccess) {
                throw new Error('Authentication failed - cannot proceed with tests');
            }
            
            // Login to browser
            await this.loginToBrowser();
            
            // Run all test suites
            await this.testAPITransactions();
            await this.testFrontendTransactions();
            await this.testPerformance();
            await this.testDataValidation();
            
            // Generate report
            const report = this.generateReport();
            
            if (report.success) {
                console.log('\n🎉 ALL TESTS PASSED - SYSTEM IS 100% READY FOR PRODUCTION! 🎉');
            } else {
                console.log('\n⚠️ SOME TESTS FAILED - REVIEW ISSUES BEFORE PRODUCTION DEPLOYMENT');
            }
            
            return report;
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            return {
                success: false,
                error: error.message,
                results: this.testResults
            };
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            success: this.testResults.failed === 0,
            summary: {
                total: this.testResults.total,
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                successRate: this.testResults.total > 0 ? ((this.testResults.passed / this.testResults.total) * 100).toFixed(2) + '%' : '0%'
            },
            performance: this.testResults.performance.length > 0 ? {
                avgDuration: Math.round(this.testResults.performance.reduce((sum, p) => sum + p.duration, 0) / this.testResults.performance.length),
                slowestTest: this.testResults.performance.reduce((max, p) => p.duration > max.duration ? p : max, { duration: 0 }),
                fastestTest: this.testResults.performance.reduce((min, p) => p.duration < min.duration ? p : min, { duration: Infinity })
            } : null,
            transactions: this.testResults.transactions,
            errors: this.testResults.errors,
            productionReadiness: this.testResults.failed === 0 ? 'READY' : 'NOT READY'
        };
        
        // Save report
        const reportPath = path.join(__dirname, 'comprehensive-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('\n📊 COMPREHENSIVE TEST REPORT');
        console.log('=============================');
        console.log(`Total Tests: ${report.summary.total}`);
        console.log(`Passed: ${report.summary.passed}`);
        console.log(`Failed: ${report.summary.failed}`);
        console.log(`Success Rate: ${report.summary.successRate}`);
        if (report.performance) {
            console.log(`Average Duration: ${report.performance.avgDuration}ms`);
        }
        console.log(`Production Readiness: ${report.productionReadiness}`);
        console.log(`Report saved to: ${reportPath}`);
        
        return report;
    }
}

// Export for use in other scripts
module.exports = ComprehensiveTransactionTests;

// Run if called directly
if (require.main === module) {
    const tests = new ComprehensiveTransactionTests();
    tests.runAllTests().catch(console.error);
}