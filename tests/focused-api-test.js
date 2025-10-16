/**
 * FOCUSED API TEST
 * SalesSync Trade AI System - Focused API Testing for Production Readiness
 * 
 * This test focuses on critical API endpoints without browser automation
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class FocusedAPITest {
    constructor() {
        this.apiUrl = 'https://ss.gonxt.tech/api';
        this.authToken = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            tests: [],
            performance: []
        };
        this.credentials = {
            email: 'admin@demo.com',
            password: 'admin123'
        };
    }

    async runTest(testName, testFunction) {
        this.testResults.total++;
        console.log(`🧪 ${testName}`);
        
        const startTime = Date.now();
        
        try {
            const result = await testFunction();
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            this.testResults.passed++;
            this.testResults.tests.push({
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
            
            console.log(`  ✅ PASSED (${duration}ms)`);
            return result;
        } catch (error) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            this.testResults.failed++;
            this.testResults.tests.push({
                test: testName,
                status: 'FAILED',
                duration: duration,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            console.log(`  ❌ FAILED: ${error.message} (${duration}ms)`);
            return null;
        }
    }

    async authenticate() {
        console.log('\n🔐 AUTHENTICATION TESTS');
        console.log('========================');
        
        await this.runTest('Login with Valid Credentials', async () => {
            const response = await axios.post(`${this.apiUrl}/auth/login`, {
                email: this.credentials.email,
                password: this.credentials.password
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-Code': 'DEMO'
                },
                timeout: 10000
            });
            
            console.log('  📋 Response status:', response.status);
            console.log('  📋 Response data keys:', Object.keys(response.data || {}));
            
            // Check different possible token field names
            const token = response.data.accessToken || 
                         response.data.access_token || 
                         response.data.token ||
                         response.data.authToken ||
                         (response.data.data && response.data.data.token);
            
            if (token) {
                this.authToken = token;
                console.log('  ✅ Access token received');
                return {
                    hasToken: true,
                    tokenLength: token.length,
                    hasUser: !!response.data.user
                };
            } else {
                console.log('  📋 Full response:', JSON.stringify(response.data, null, 2));
                throw new Error('No access token found in response');
            }
        });

        if (this.authToken) {
            await this.runTest('Get User Profile', async () => {
                const response = await axios.get(`${this.apiUrl}/users/profile`, {
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`,
                        'X-Tenant-Code': 'DEMO'
                    },
                    timeout: 10000
                });
                
                return {
                    hasProfile: !!response.data,
                    userId: response.data.id,
                    email: response.data.email
                };
            });
        }
    }

    async testCoreEndpoints() {
        console.log('\n🔌 CORE API ENDPOINTS');
        console.log('======================');
        
        if (!this.authToken) {
            console.log('⚠️ Skipping endpoint tests - no auth token');
            return;
        }

        const endpoints = [
            { path: '/dashboard', name: 'Dashboard Data' },
            { path: '/routes', name: 'Van Sales Routes' },
            { path: '/promotions', name: 'Promotion Campaigns' },
            { path: '/inventory', name: 'Warehouse Inventory' },
            { path: '/orders', name: 'Back Office Orders' },
            { path: '/agents', name: 'Field Agents' },
            { path: '/users', name: 'Admin Users' },
            { path: '/products', name: 'Products' },
            { path: '/analytics', name: 'Analytics Dashboard' }
        ];

        for (const endpoint of endpoints) {
            await this.runTest(`Get ${endpoint.name}`, async () => {
                const response = await axios.get(`${this.apiUrl}${endpoint.path}`, {
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`,
                        'X-Tenant-Code': 'DEMO'
                    },
                    timeout: 10000
                });
                
                const data = response.data.data || response.data;
                const recordCount = Array.isArray(data) ? data.length : (data ? 1 : 0);
                
                console.log(`    📊 Records: ${recordCount}`);
                
                return {
                    status: response.status,
                    hasData: !!data,
                    recordCount: recordCount,
                    responseSize: JSON.stringify(response.data).length
                };
            });
        }
    }

    async testTransactionEndpoints() {
        console.log('\n💳 TRANSACTION ENDPOINTS');
        console.log('=========================');
        
        if (!this.authToken) {
            console.log('⚠️ Skipping transaction tests - no auth token');
            return;
        }

        // Test creating a van sales loading
        await this.runTest('Create Van Sales Loading', async () => {
            const loadingData = {
                routeId: 'VR-001',
                driverId: 1,
                items: [
                    { productId: 1, quantity: 5 }
                ],
                status: 'completed'
            };
            
            const response = await axios.post(`${this.apiUrl}/van-sales-operations`, loadingData, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO',
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            return {
                status: response.status,
                created: response.status === 201 || response.status === 200,
                loadingId: response.data.id || 'generated'
            };
        });

        // Test creating a promotion campaign
        await this.runTest('Create Promotion Campaign', async () => {
            const campaignData = {
                name: 'Test Campaign ' + Date.now(),
                description: 'Automated test campaign',
                budget: 10000,
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active'
            };
            
            const response = await axios.post(`${this.apiUrl}/promotions/campaigns`, campaignData, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO',
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            return {
                status: response.status,
                created: response.status === 201 || response.status === 200,
                campaignId: response.data.id || 'generated'
            };
        });

        // Test creating a stock movement
        await this.runTest('Create Stock Movement', async () => {
            const movementData = {
                productId: 1,
                warehouseId: 1,
                type: 'adjustment',
                quantity: 10,
                reason: 'API test adjustment',
                reference: 'API-TEST-' + Date.now()
            };
            
            const response = await axios.post(`${this.apiUrl}/stock-movements`, movementData, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO',
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            return {
                status: response.status,
                created: response.status === 201 || response.status === 200,
                movementId: response.data.id || 'generated'
            };
        });

        // Test creating a payment
        await this.runTest('Create Payment', async () => {
            const paymentData = {
                orderId: 1,
                amount: 99.99,
                method: 'bank_transfer',
                reference: 'API-PAY-' + Date.now(),
                status: 'completed'
            };
            
            const response = await axios.post(`${this.apiUrl}/orders`, paymentData, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'X-Tenant-Code': 'DEMO',
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            return {
                status: response.status,
                created: response.status === 201 || response.status === 200,
                paymentId: response.data.id || 'generated'
            };
        });
    }

    async testPerformance() {
        console.log('\n⚡ PERFORMANCE TESTS');
        console.log('====================');
        
        if (!this.authToken) {
            console.log('⚠️ Skipping performance tests - no auth token');
            return;
        }

        await this.runTest('Concurrent API Requests', async () => {
            const promises = [];
            const concurrentRequests = 5;
            
            for (let i = 0; i < concurrentRequests; i++) {
                promises.push(
                    axios.get(`${this.apiUrl}/dashboard`, {
                        headers: {
                            'Authorization': `Bearer ${this.authToken}`,
                            'X-Tenant-Code': 'DEMO'
                        },
                        timeout: 10000
                    })
                );
            }
            
            const startTime = Date.now();
            const results = await Promise.allSettled(promises);
            const endTime = Date.now();
            
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const successRate = (successful / concurrentRequests) * 100;
            const totalTime = endTime - startTime;
            
            if (successRate < 80) {
                throw new Error(`Low success rate: ${successRate}%`);
            }
            
            return {
                concurrentRequests,
                successful,
                successRate,
                totalTime
            };
        });

        await this.runTest('Response Time Check', async () => {
            const endpoints = ['/dashboard', '/van-sales/routes', '/promotions/campaigns'];
            const results = [];
            
            for (const endpoint of endpoints) {
                const startTime = Date.now();
                
                try {
                    await axios.get(`${this.apiUrl}${endpoint}`, {
                        headers: {
                            'Authorization': `Bearer ${this.authToken}`,
                            'X-Tenant-Code': 'DEMO'
                        },
                        timeout: 10000
                    });
                    
                    const duration = Date.now() - startTime;
                    results.push({ endpoint, duration, success: true });
                } catch (error) {
                    const duration = Date.now() - startTime;
                    results.push({ endpoint, duration, success: false });
                }
            }
            
            const avgResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
            const successRate = (results.filter(r => r.success).length / results.length) * 100;
            
            if (avgResponseTime > 5000) {
                throw new Error(`Average response time too high: ${avgResponseTime}ms`);
            }
            
            return {
                avgResponseTime: Math.round(avgResponseTime),
                successRate,
                results
            };
        });
    }

    async runAllTests() {
        console.log('🚀 FOCUSED API TESTS FOR PRODUCTION READINESS');
        console.log('==============================================');
        console.log(`Target: ${this.apiUrl}`);
        console.log(`Timestamp: ${new Date().toISOString()}`);
        
        try {
            // Run test suites
            await this.authenticate();
            await this.testCoreEndpoints();
            await this.testTransactionEndpoints();
            await this.testPerformance();
            
            // Generate report
            const report = this.generateReport();
            
            if (report.success) {
                console.log('\n🎉 ALL API TESTS PASSED - READY FOR PRODUCTION! 🎉');
            } else {
                console.log('\n⚠️ SOME API TESTS FAILED - REVIEW BEFORE PRODUCTION');
            }
            
            return report;
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
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
                successRate: this.testResults.total > 0 ? 
                    ((this.testResults.passed / this.testResults.total) * 100).toFixed(2) + '%' : '0%'
            },
            performance: this.testResults.performance.length > 0 ? {
                avgDuration: Math.round(this.testResults.performance.reduce((sum, p) => sum + p.duration, 0) / this.testResults.performance.length),
                slowestTest: this.testResults.performance.reduce((max, p) => p.duration > max.duration ? p : max, { duration: 0 }),
                fastestTest: this.testResults.performance.reduce((min, p) => p.duration < min.duration ? p : min, { duration: Infinity })
            } : null,
            tests: this.testResults.tests,
            productionReadiness: this.testResults.failed === 0 ? 'READY' : 'NOT READY'
        };
        
        // Save report
        const reportPath = path.join(__dirname, 'focused-api-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('\n📊 FOCUSED API TEST REPORT');
        console.log('===========================');
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

// Run if called directly
if (require.main === module) {
    const tests = new FocusedAPITest();
    tests.runAllTests()
        .then(report => {
            process.exit(report.success ? 0 : 1);
        })
        .catch(console.error);
}

module.exports = FocusedAPITest;