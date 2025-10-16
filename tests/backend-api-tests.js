/**
 * BACKEND API TESTS
 * SalesSync Trade AI System - Comprehensive Backend API Testing
 * 
 * This test suite validates all backend API endpoints with real transactions
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class BackendAPITests {
    constructor() {
        this.apiUrl = 'https://ss.gonxt.tech/api';
        this.authToken = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            endpoints: [],
            transactions: [],
            performance: []
        };
        this.credentials = {
            email: 'admin@demo.com',
            password: 'admin123'
        };
    }

    async authenticate() {
        console.log('🔐 Authenticating with backend API...');
        
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
                console.log('✅ Backend authentication successful');
                return true;
            } else {
                throw new Error('No access token received');
            }
        } catch (error) {
            console.log('❌ Backend authentication failed:', error.message);
            return false;
        }
    }

    async runTest(testName, testFunction) {
        this.testResults.total++;
        console.log(`\n🧪 Testing: ${testName}`);
        
        const startTime = Date.now();
        
        try {
            const result = await testFunction();
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            this.testResults.passed++;
            this.testResults.endpoints.push({
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
            this.testResults.endpoints.push({
                test: testName,
                status: 'FAILED',
                duration: duration,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            console.log(`❌ FAILED: ${testName} - ${error.message} (${duration}ms)`);
            return null;
        }
    }

    // ========================================
    // AUTHENTICATION TESTS
    // ========================================
    
    async testAuthentication() {
        console.log('\n🔐 TESTING AUTHENTICATION ENDPOINTS');
        
        await this.runTest('Auth - Login with Valid Credentials', async () => {
            const response = await axios.post(`${this.apiUrl}/auth/login`, {
                email: this.credentials.email,
                password: this.credentials.password
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-Code': 'DEMO'
                }
            });
            
            if (!response.data.accessToken) {
                throw new Error('No access token in response');
            }
            
            return {
                hasAccessToken: !!response.data.accessToken,
                hasRefreshToken: !!response.data.refreshToken,
                userInfo: !!response.data.user
            };
        });

        await this.runTest('Auth - Get Profile', async () => {
            const response = await axios.get(`${this.apiUrl}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO'
                }
            });
            
            if (!response.data.id) {
                throw new Error('No user profile data');
            }
            
            return {
                userId: response.data.id,
                email: response.data.email,
                role: response.data.role
            };
        });

        await this.runTest('Auth - Invalid Credentials', async () => {
            try {
                await axios.post(`${this.apiUrl}/auth/login`, {
                    email: 'invalid@test.com',
                    password: 'wrongpassword'
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Tenant-Code': 'DEMO'
                    }
                });
                
                throw new Error('Should have failed with invalid credentials');
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    return { correctlyRejected: true };
                }
                throw error;
            }
        });
    }

    // ========================================
    // VAN SALES API TESTS
    // ========================================
    
    async testVanSalesAPI() {
        console.log('\n🚐 TESTING VAN SALES API ENDPOINTS');
        
        await this.runTest('Van Sales - Get Routes', async () => {
            const response = await axios.get(`${this.apiUrl}/van-sales/routes`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO'
                }
            });
            
            const routes = response.data.data || response.data;
            
            return {
                routeCount: Array.isArray(routes) ? routes.length : 0,
                hasRoutes: Array.isArray(routes) && routes.length > 0,
                sampleRoute: Array.isArray(routes) && routes.length > 0 ? routes[0] : null
            };
        });

        await this.runTest('Van Sales - Create Loading', async () => {
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
            
            return {
                created: response.status === 201 || response.status === 200,
                loadingId: response.data.id || 'generated',
                routeId: loadingData.routeId
            };
        });

        await this.runTest('Van Sales - Get Loadings', async () => {
            const response = await axios.get(`${this.apiUrl}/van-sales/loadings`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO'
                }
            });
            
            const loadings = response.data.data || response.data;
            
            return {
                loadingCount: Array.isArray(loadings) ? loadings.length : 0,
                hasLoadings: Array.isArray(loadings) && loadings.length > 0
            };
        });
    }

    // ========================================
    // PROMOTIONS API TESTS
    // ========================================
    
    async testPromotionsAPI() {
        console.log('\n🎯 TESTING PROMOTIONS API ENDPOINTS');
        
        await this.runTest('Promotions - Get Campaigns', async () => {
            const response = await axios.get(`${this.apiUrl}/promotions/campaigns`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO'
                }
            });
            
            const campaigns = response.data.data || response.data;
            
            return {
                campaignCount: Array.isArray(campaigns) ? campaigns.length : 0,
                hasCampaigns: Array.isArray(campaigns) && campaigns.length > 0,
                sampleCampaign: Array.isArray(campaigns) && campaigns.length > 0 ? campaigns[0] : null
            };
        });

        await this.runTest('Promotions - Create Campaign', async () => {
            const campaignData = {
                name: 'Backend Test Campaign ' + Date.now(),
                description: 'Automated backend test campaign',
                budget: 15000,
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
            
            return {
                created: response.status === 201 || response.status === 200,
                campaignId: response.data.id || 'generated',
                name: campaignData.name
            };
        });

        await this.runTest('Promotions - Get Surveys', async () => {
            const response = await axios.get(`${this.apiUrl}/promotions/surveys`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO'
                }
            });
            
            const surveys = response.data.data || response.data;
            
            return {
                surveyCount: Array.isArray(surveys) ? surveys.length : 0,
                hasSurveys: Array.isArray(surveys) && surveys.length > 0
            };
        });

        await this.runTest('Promotions - Get Materials', async () => {
            const response = await axios.get(`${this.apiUrl}/promotions/materials`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO'
                }
            });
            
            const materials = response.data.data || response.data;
            
            return {
                materialCount: Array.isArray(materials) ? materials.length : 0,
                hasMaterials: Array.isArray(materials) && materials.length > 0
            };
        });
    }

    // ========================================
    // WAREHOUSE API TESTS
    // ========================================
    
    async testWarehouseAPI() {
        console.log('\n📦 TESTING WAREHOUSE API ENDPOINTS');
        
        await this.runTest('Warehouse - Get Inventory', async () => {
            const response = await axios.get(`${this.apiUrl}/warehouse/inventory`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO'
                }
            });
            
            const inventory = response.data.data || response.data;
            
            return {
                inventoryCount: Array.isArray(inventory) ? inventory.length : 0,
                hasInventory: Array.isArray(inventory) && inventory.length > 0
            };
        });

        await this.runTest('Warehouse - Create Stock Movement', async () => {
            const movementData = {
                productId: 1,
                warehouseId: 1,
                type: 'adjustment',
                quantity: 15,
                reason: 'Backend API test adjustment',
                reference: 'BACKEND-TEST-' + Date.now()
            };
            
            const response = await axios.post(`${this.apiUrl}/warehouse/stock-movements`, movementData, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO',
                    'Content-Type': 'application/json'
                }
            });
            
            return {
                created: response.status === 201 || response.status === 200,
                movementId: response.data.id || 'generated',
                type: movementData.type
            };
        });

        await this.runTest('Warehouse - Get Stock Movements', async () => {
            const response = await axios.get(`${this.apiUrl}/warehouse/stock-movements`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO'
                }
            });
            
            const movements = response.data.data || response.data;
            
            return {
                movementCount: Array.isArray(movements) ? movements.length : 0,
                hasMovements: Array.isArray(movements) && movements.length > 0
            };
        });

        await this.runTest('Warehouse - Get Purchase Orders', async () => {
            const response = await axios.get(`${this.apiUrl}/warehouse/purchase-orders`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO'
                }
            });
            
            const pos = response.data.data || response.data;
            
            return {
                poCount: Array.isArray(pos) ? pos.length : 0,
                hasPOs: Array.isArray(pos) && pos.length > 0
            };
        });
    }

    // ========================================
    // BACK OFFICE API TESTS
    // ========================================
    
    async testBackOfficeAPI() {
        console.log('\n🏢 TESTING BACK OFFICE API ENDPOINTS');
        
        await this.runTest('Back Office - Get Orders', async () => {
            const response = await axios.get(`${this.apiUrl}/back-office/orders`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO'
                }
            });
            
            const orders = response.data.data || response.data;
            
            return {
                orderCount: Array.isArray(orders) ? orders.length : 0,
                hasOrders: Array.isArray(orders) && orders.length > 0
            };
        });

        await this.runTest('Back Office - Create Payment', async () => {
            const paymentData = {
                orderId: 1,
                amount: 125.50,
                method: 'bank_transfer',
                reference: 'BACKEND-PAY-' + Date.now(),
                status: 'completed'
            };
            
            const response = await axios.post(`${this.apiUrl}/back-office/payments`, paymentData, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO',
                    'Content-Type': 'application/json'
                }
            });
            
            return {
                created: response.status === 201 || response.status === 200,
                paymentId: response.data.id || 'generated',
                amount: paymentData.amount
            };
        });

        await this.runTest('Back Office - Get Payments', async () => {
            const response = await axios.get(`${this.apiUrl}/back-office/payments`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO'
                }
            });
            
            const payments = response.data.data || response.data;
            
            return {
                paymentCount: Array.isArray(payments) ? payments.length : 0,
                hasPayments: Array.isArray(payments) && payments.length > 0
            };
        });

        await this.runTest('Back Office - Get Invoices', async () => {
            const response = await axios.get(`${this.apiUrl}/back-office/invoices`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO'
                }
            });
            
            const invoices = response.data.data || response.data;
            
            return {
                invoiceCount: Array.isArray(invoices) ? invoices.length : 0,
                hasInvoices: Array.isArray(invoices) && invoices.length > 0
            };
        });

        await this.runTest('Back Office - Get Returns', async () => {
            const response = await axios.get(`${this.apiUrl}/back-office/returns`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO'
                }
            });
            
            const returns = response.data.data || response.data;
            
            return {
                returnCount: Array.isArray(returns) ? returns.length : 0,
                hasReturns: Array.isArray(returns) && returns.length > 0
            };
        });
    }

    // ========================================
    // FIELD AGENTS API TESTS
    // ========================================
    
    async testFieldAgentsAPI() {
        console.log('\n👥 TESTING FIELD AGENTS API ENDPOINTS');
        
        await this.runTest('Field Agents - Get Agents', async () => {
            const response = await axios.get(`${this.apiUrl}/field-agents`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO'
                }
            });
            
            const agents = response.data.data || response.data;
            
            return {
                agentCount: Array.isArray(agents) ? agents.length : 0,
                hasAgents: Array.isArray(agents) && agents.length > 0
            };
        });

        await this.runTest('Field Agents - Get SIM Distributions', async () => {
            const response = await axios.get(`${this.apiUrl}/field-agents/sim-distribution`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO'
                }
            });
            
            const distributions = response.data.data || response.data;
            
            return {
                distributionCount: Array.isArray(distributions) ? distributions.length : 0,
                hasDistributions: Array.isArray(distributions) && distributions.length > 0
            };
        });

        await this.runTest('Field Agents - Create Digital Voucher', async () => {
            const voucherData = {
                agentId: 1,
                code: 'BACKEND-VOUCHER-' + Date.now(),
                value: 50,
                type: 'data',
                status: 'active'
            };
            
            const response = await axios.post(`${this.apiUrl}/field-agents/digital-vouchers`, voucherData, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO',
                    'Content-Type': 'application/json'
                }
            });
            
            return {
                created: response.status === 201 || response.status === 200,
                voucherId: response.data.id || 'generated',
                code: voucherData.code
            };
        });

        await this.runTest('Field Agents - Get Digital Vouchers', async () => {
            const response = await axios.get(`${this.apiUrl}/field-agents/digital-vouchers`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO'
                }
            });
            
            const vouchers = response.data.data || response.data;
            
            return {
                voucherCount: Array.isArray(vouchers) ? vouchers.length : 0,
                hasVouchers: Array.isArray(vouchers) && vouchers.length > 0
            };
        });
    }

    // ========================================
    // ADMINISTRATION API TESTS
    // ========================================
    
    async testAdministrationAPI() {
        console.log('\n⚙️ TESTING ADMINISTRATION API ENDPOINTS');
        
        await this.runTest('Admin - Get Users', async () => {
            const response = await axios.get(`${this.apiUrl}/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO'
                }
            });
            
            const users = response.data.data || response.data;
            
            return {
                userCount: Array.isArray(users) ? users.length : 0,
                hasUsers: Array.isArray(users) && users.length > 0
            };
        });

        await this.runTest('Admin - Get Roles', async () => {
            const response = await axios.get(`${this.apiUrl}/admin/roles`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO'
                }
            });
            
            const roles = response.data.data || response.data;
            
            return {
                roleCount: Array.isArray(roles) ? roles.length : 0,
                hasRoles: Array.isArray(roles) && roles.length > 0,
                sampleRole: Array.isArray(roles) && roles.length > 0 ? roles[0] : null
            };
        });
    }

    // ========================================
    // ANALYTICS API TESTS
    // ========================================
    
    async testAnalyticsAPI() {
        console.log('\n📊 TESTING ANALYTICS API ENDPOINTS');
        
        await this.runTest('Analytics - Get Dashboard Data', async () => {
            const response = await axios.get(`${this.apiUrl}/analytics/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO'
                }
            });
            
            const dashboardData = response.data.data || response.data;
            
            return {
                hasDashboardData: !!dashboardData,
                hasMetrics: !!(dashboardData && (dashboardData.metrics || dashboardData.sales || dashboardData.performance))
            };
        });
    }

    // ========================================
    // MAIN TEST RUNNER
    // ========================================
    
    async runAllTests() {
        console.log('🚀 STARTING BACKEND API TESTS');
        console.log('==============================');
        
        try {
            // Authenticate
            const authSuccess = await this.authenticate();
            if (!authSuccess) {
                throw new Error('Authentication failed - cannot proceed with API tests');
            }
            
            // Run all test suites
            await this.testAuthentication();
            await this.testVanSalesAPI();
            await this.testPromotionsAPI();
            await this.testWarehouseAPI();
            await this.testBackOfficeAPI();
            await this.testFieldAgentsAPI();
            await this.testAdministrationAPI();
            await this.testAnalyticsAPI();
            
            // Generate report
            const report = this.generateReport();
            
            if (report.success) {
                console.log('\n🎉 ALL BACKEND API TESTS PASSED! 🎉');
            } else {
                console.log('\n⚠️ SOME BACKEND API TESTS FAILED');
            }
            
            return report;
            
        } catch (error) {
            console.error('❌ Backend API test suite failed:', error.message);
            return {
                success: false,
                error: error.message,
                results: this.testResults
            };
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
            endpoints: this.testResults.endpoints,
            transactions: this.testResults.transactions,
            apiReadiness: this.testResults.failed === 0 ? 'READY' : 'NOT READY'
        };
        
        // Save report
        const reportPath = path.join(__dirname, 'backend-api-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('\n📊 BACKEND API TEST REPORT');
        console.log('===========================');
        console.log(`Total Tests: ${report.summary.total}`);
        console.log(`Passed: ${report.summary.passed}`);
        console.log(`Failed: ${report.summary.failed}`);
        console.log(`Success Rate: ${report.summary.successRate}`);
        if (report.performance) {
            console.log(`Average Duration: ${report.performance.avgDuration}ms`);
        }
        console.log(`API Readiness: ${report.apiReadiness}`);
        console.log(`Report saved to: ${reportPath}`);
        
        return report;
    }
}

// Export for use in other scripts
module.exports = BackendAPITests;

// Run if called directly
if (require.main === module) {
    const tests = new BackendAPITests();
    tests.runAllTests().catch(console.error);
}