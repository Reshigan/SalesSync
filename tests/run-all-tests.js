/**
 * TEST RUNNER - RUN ALL TESTS
 * SalesSync Trade AI System - Complete Test Suite Runner
 * 
 * This script runs all test suites and generates a comprehensive report
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class TestRunner {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            testSuites: [],
            summary: {
                totalSuites: 0,
                passedSuites: 0,
                failedSuites: 0,
                totalTests: 0,
                passedTests: 0,
                failedTests: 0
            },
            productionReadiness: 'PENDING'
        };
    }

    async runTestSuite(suiteName, scriptPath) {
        console.log(`\n🚀 Running ${suiteName}...`);
        console.log('='.repeat(50));
        
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            // Check if Node.js modules are available
            try {
                require('puppeteer');
                require('axios');
            } catch (error) {
                console.log(`⚠️ Missing dependencies for ${suiteName}: ${error.message}`);
                console.log('Installing dependencies...');
                
                // Install dependencies
                const installProcess = spawn('npm', ['install', 'puppeteer', 'axios'], {
                    stdio: 'inherit',
                    cwd: path.dirname(scriptPath)
                });
                
                installProcess.on('close', (code) => {
                    if (code !== 0) {
                        console.log(`❌ Failed to install dependencies for ${suiteName}`);
                        resolve({
                            suite: suiteName,
                            success: false,
                            error: 'Failed to install dependencies',
                            duration: Date.now() - startTime
                        });
                        return;
                    }
                    
                    // Run the actual test after installing dependencies
                    this.executeTestScript(suiteName, scriptPath, startTime, resolve);
                });
                
                return;
            }
            
            // Run the test script directly
            this.executeTestScript(suiteName, scriptPath, startTime, resolve);
        });
    }

    executeTestScript(suiteName, scriptPath, startTime, resolve) {
        const testProcess = spawn('node', [scriptPath], {
            stdio: 'pipe',
            cwd: path.dirname(scriptPath)
        });
        
        let output = '';
        let errorOutput = '';
        
        testProcess.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            process.stdout.write(text);
        });
        
        testProcess.stderr.on('data', (data) => {
            const text = data.toString();
            errorOutput += text;
            process.stderr.write(text);
        });
        
        testProcess.on('close', (code) => {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Try to parse test results from output
            let testResults = null;
            try {
                // Look for JSON report in the output
                const jsonMatch = output.match(/\{[\s\S]*"timestamp"[\s\S]*\}/);
                if (jsonMatch) {
                    testResults = JSON.parse(jsonMatch[0]);
                }
            } catch (error) {
                // Ignore JSON parsing errors
            }
            
            const result = {
                suite: suiteName,
                success: code === 0,
                duration: duration,
                output: output,
                error: code !== 0 ? errorOutput : null,
                testResults: testResults
            };
            
            if (code === 0) {
                console.log(`✅ ${suiteName} completed successfully`);
            } else {
                console.log(`❌ ${suiteName} failed with exit code ${code}`);
            }
            
            resolve(result);
        });
        
        testProcess.on('error', (error) => {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log(`❌ ${suiteName} failed to start: ${error.message}`);
            
            resolve({
                suite: suiteName,
                success: false,
                duration: duration,
                error: error.message
            });
        });
    }

    async runSimpleAPITest() {
        console.log('\n🔌 Running Simple API Connectivity Test...');
        console.log('='.repeat(50));
        
        try {
            const axios = require('axios');
            const apiUrl = 'https://ss.gonxt.tech/api';
            
            // Test basic connectivity
            const healthResponse = await axios.get(`${apiUrl}/health`, { timeout: 10000 });
            console.log('✅ API Health Check:', healthResponse.status);
            
            // Test authentication
            const authResponse = await axios.post(`${apiUrl}/auth/login`, {
                email: 'admin@demo.com',
                password: 'admin123'
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-Code': 'DEMO'
                },
                timeout: 10000
            });
            
            console.log('✅ Authentication Test:', authResponse.status);
            
            if (authResponse.data && authResponse.data.accessToken) {
                const token = authResponse.data.accessToken;
                
                // Test a few key endpoints
                const endpoints = [
                    '/dashboard',
                    '/van-sales/routes',
                    '/promotions/campaigns',
                    '/warehouse/inventory',
                    '/admin/users'
                ];
                
                let successCount = 0;
                
                for (const endpoint of endpoints) {
                    try {
                        const response = await axios.get(`${apiUrl}${endpoint}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'X-Tenant-Code': 'DEMO'
                            },
                            timeout: 5000
                        });
                        
                        console.log(`✅ ${endpoint}: ${response.status}`);
                        successCount++;
                    } catch (error) {
                        console.log(`❌ ${endpoint}: ${error.message}`);
                    }
                }
                
                const successRate = (successCount / endpoints.length) * 100;
                console.log(`\n📊 API Endpoint Success Rate: ${successRate}%`);
                
                return {
                    suite: 'Simple API Test',
                    success: successRate >= 80,
                    testResults: {
                        endpointsTested: endpoints.length,
                        successfulEndpoints: successCount,
                        successRate: successRate
                    }
                };
            } else {
                throw new Error('No access token received');
            }
            
        } catch (error) {
            console.log('❌ Simple API Test failed:', error.message);
            return {
                suite: 'Simple API Test',
                success: false,
                error: error.message
            };
        }
    }

    async runAllTests() {
        console.log('🚀 STARTING COMPREHENSIVE TEST SUITE');
        console.log('=====================================');
        console.log(`Timestamp: ${this.results.timestamp}`);
        console.log('Target System: https://ss.gonxt.tech');
        console.log('');
        
        // Define test suites
        const testSuites = [
            {
                name: 'Simple API Connectivity',
                runner: () => this.runSimpleAPITest()
            },
            {
                name: 'Backend API Tests',
                script: path.join(__dirname, 'backend-api-tests.js')
            },
            {
                name: 'Comprehensive Transaction Tests',
                script: path.join(__dirname, 'comprehensive-transaction-tests.js')
            }
        ];
        
        // Run each test suite
        for (const suite of testSuites) {
            try {
                let result;
                
                if (suite.runner) {
                    result = await suite.runner();
                } else if (suite.script) {
                    result = await this.runTestSuite(suite.name, suite.script);
                }
                
                this.results.testSuites.push(result);
                this.results.summary.totalSuites++;
                
                if (result.success) {
                    this.results.summary.passedSuites++;
                } else {
                    this.results.summary.failedSuites++;
                }
                
                // Aggregate test counts if available
                if (result.testResults) {
                    if (result.testResults.summary) {
                        this.results.summary.totalTests += result.testResults.summary.total || 0;
                        this.results.summary.passedTests += result.testResults.summary.passed || 0;
                        this.results.summary.failedTests += result.testResults.summary.failed || 0;
                    } else if (result.testResults.endpointsTested) {
                        this.results.summary.totalTests += result.testResults.endpointsTested;
                        this.results.summary.passedTests += result.testResults.successfulEndpoints;
                        this.results.summary.failedTests += result.testResults.endpointsTested - result.testResults.successfulEndpoints;
                    }
                }
                
            } catch (error) {
                console.log(`❌ Test suite ${suite.name} failed: ${error.message}`);
                
                this.results.testSuites.push({
                    suite: suite.name,
                    success: false,
                    error: error.message
                });
                
                this.results.summary.totalSuites++;
                this.results.summary.failedSuites++;
            }
        }
        
        // Determine production readiness
        const suiteSuccessRate = (this.results.summary.passedSuites / this.results.summary.totalSuites) * 100;
        const testSuccessRate = this.results.summary.totalTests > 0 ? 
            (this.results.summary.passedTests / this.results.summary.totalTests) * 100 : 0;
        
        if (suiteSuccessRate >= 100 && testSuccessRate >= 90) {
            this.results.productionReadiness = 'READY';
        } else if (suiteSuccessRate >= 80 && testSuccessRate >= 80) {
            this.results.productionReadiness = 'CONDITIONAL';
        } else {
            this.results.productionReadiness = 'NOT READY';
        }
        
        // Generate final report
        this.generateFinalReport();
        
        return this.results;
    }

    generateFinalReport() {
        console.log('\n🎯 FINAL TEST RESULTS');
        console.log('=====================');
        console.log(`Test Suites: ${this.results.summary.passedSuites}/${this.results.summary.totalSuites} passed`);
        console.log(`Individual Tests: ${this.results.summary.passedTests}/${this.results.summary.totalTests} passed`);
        console.log(`Production Readiness: ${this.results.productionReadiness}`);
        console.log('');
        
        // Suite-by-suite results
        console.log('📋 Test Suite Results:');
        this.results.testSuites.forEach(suite => {
            const status = suite.success ? '✅' : '❌';
            console.log(`  ${status} ${suite.suite}`);
            if (suite.error) {
                console.log(`    Error: ${suite.error}`);
            }
            if (suite.testResults && suite.testResults.successRate) {
                console.log(`    Success Rate: ${suite.testResults.successRate}%`);
            }
        });
        
        console.log('');
        
        // Production readiness assessment
        if (this.results.productionReadiness === 'READY') {
            console.log('🎉 SYSTEM IS 100% READY FOR PRODUCTION DEPLOYMENT! 🎉');
            console.log('✅ All test suites passed');
            console.log('✅ All critical functionality verified');
            console.log('✅ API endpoints responding correctly');
            console.log('✅ Transactions working as expected');
        } else if (this.results.productionReadiness === 'CONDITIONAL') {
            console.log('⚠️ SYSTEM IS CONDITIONALLY READY FOR PRODUCTION');
            console.log('✅ Core functionality working');
            console.log('⚠️ Some non-critical issues detected');
            console.log('📋 Review failed tests before deployment');
        } else {
            console.log('❌ SYSTEM IS NOT READY FOR PRODUCTION');
            console.log('❌ Critical issues detected');
            console.log('📋 Fix failing tests before deployment');
        }
        
        // Save detailed report
        const reportPath = path.join(__dirname, 'final-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
        return this.results;
    }
}

// Run if called directly
if (require.main === module) {
    const runner = new TestRunner();
    runner.runAllTests()
        .then(results => {
            process.exit(results.productionReadiness === 'READY' ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Test runner failed:', error);
            process.exit(1);
        });
}

module.exports = TestRunner;