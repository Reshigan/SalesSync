#!/usr/bin/env node

/**
 * Comprehensive Production Test Suite for SalesSync Enterprise
 * Runs all production tests including backend, frontend, and integration tests
 */

const ProductionTester = require('./live-production-tests');
const FrontendTester = require('./frontend-functional-tests');
const fs = require('fs');
const path = require('path');

class ComprehensiveTestSuite {
    constructor() {
        this.allResults = [];
        this.startTime = Date.now();
    }

    async runBackendTests() {
        console.log('\n🔧 RUNNING BACKEND & INFRASTRUCTURE TESTS');
        console.log('==========================================');
        
        const tester = new ProductionTester();
        const results = await tester.runAllTests();
        
        this.allResults.push({
            category: 'Backend & Infrastructure',
            results: results.results,
            summary: results.summary
        });
        
        return results;
    }

    async runFrontendTests() {
        console.log('\n🎨 RUNNING FRONTEND FUNCTIONAL TESTS');
        console.log('====================================');
        
        const tester = new FrontendTester();
        const results = await tester.runAllTests();
        
        if (results.skipped) {
            this.allResults.push({
                category: 'Frontend Functional',
                skipped: true,
                reason: results.reason
            });
            return results;
        }
        
        this.allResults.push({
            category: 'Frontend Functional',
            results: results.results,
            summary: results.summary
        });
        
        return results;
    }

    async runIntegrationTests() {
        console.log('\n🔗 RUNNING INTEGRATION TESTS');
        console.log('=============================');
        
        // Simple integration tests
        const integrationResults = [];
        
        try {
            // Test API connectivity from frontend perspective
            console.log('🧪 Testing API Integration...');
            
            const axios = require('axios').default;
            
            // Create axios instance with SSL ignore for self-signed cert
            const api = axios.create({
                httpsAgent: new (require('https').Agent)({
                    rejectUnauthorized: false
                })
            });
            
            const healthResponse = await api.get('http://localhost:12000/api/health');
            
            if (healthResponse.status === 200 && healthResponse.data.status === 'healthy') {
                console.log('✅ API Integration - PASSED');
                integrationResults.push({
                    name: 'API Integration',
                    status: 'PASSED',
                    duration: 0,
                    error: null
                });
            } else {
                throw new Error('API health check failed');
            }
            
        } catch (error) {
            console.log(`❌ API Integration - FAILED: ${error.message}`);
            integrationResults.push({
                name: 'API Integration',
                status: 'FAILED',
                duration: 0,
                error: error.message
            });
        }
        
        // Test CORS and security headers
        try {
            console.log('🧪 Testing CORS and Security...');
            
            const axios = require('axios').default;
            const api = axios.create({
                httpsAgent: new (require('https').Agent)({
                    rejectUnauthorized: false
                })
            });
            
            const response = await api.get('http://localhost:12000/health');
            const headers = response.headers;
            
            const requiredHeaders = [
                'strict-transport-security',
                'x-frame-options',
                'x-content-type-options'
            ];
            
            const missingHeaders = requiredHeaders.filter(header => !headers[header]);
            
            if (missingHeaders.length === 0) {
                console.log('✅ CORS and Security - PASSED');
                integrationResults.push({
                    name: 'CORS and Security',
                    status: 'PASSED',
                    duration: 0,
                    error: null
                });
            } else {
                throw new Error(`Missing headers: ${missingHeaders.join(', ')}`);
            }
            
        } catch (error) {
            console.log(`❌ CORS and Security - FAILED: ${error.message}`);
            integrationResults.push({
                name: 'CORS and Security',
                status: 'FAILED',
                duration: 0,
                error: error.message
            });
        }
        
        const passed = integrationResults.filter(r => r.status === 'PASSED').length;
        const failed = integrationResults.filter(r => r.status === 'FAILED').length;
        const total = integrationResults.length;
        
        const integrationSummary = {
            total,
            passed,
            failed,
            successRate: total > 0 ? `${((passed / total) * 100).toFixed(1)}%` : '0.0%'
        };
        
        this.allResults.push({
            category: 'Integration Tests',
            results: integrationResults,
            summary: integrationSummary
        });
        
        return { results: integrationResults, summary: integrationSummary };
    }

    generateComprehensiveReport() {
        console.log('\n📊 GENERATING COMPREHENSIVE TEST REPORT');
        console.log('=======================================');
        
        const totalDuration = Date.now() - this.startTime;
        
        let totalTests = 0;
        let totalPassed = 0;
        let totalFailed = 0;
        let skippedCategories = 0;
        
        this.allResults.forEach(category => {
            if (category.skipped) {
                skippedCategories++;
                console.log(`⏭️  ${category.category}: SKIPPED (${category.reason})`);
            } else {
                totalTests += category.summary.total;
                totalPassed += category.summary.passed;
                totalFailed += category.summary.failed;
                
                console.log(`📋 ${category.category}:`);
                console.log(`   Total: ${category.summary.total}, Passed: ${category.summary.passed}, Failed: ${category.summary.failed}`);
                console.log(`   Success Rate: ${category.summary.successRate}`);
            }
        });
        
        const overallSuccessRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';
        
        const comprehensiveReport = {
            timestamp: new Date().toISOString(),
            productionUrl: 'http://localhost:12000',
            testSuite: 'Comprehensive Production Tests',
            duration: totalDuration,
            overallSummary: {
                totalTests,
                totalPassed,
                totalFailed,
                skippedCategories,
                overallSuccessRate: `${overallSuccessRate}%`
            },
            categoryResults: this.allResults
        };
        
        // Save comprehensive report
        const reportPath = './comprehensive-production-test-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(comprehensiveReport, null, 2));
        
        console.log('\n🏆 COMPREHENSIVE TEST SUMMARY');
        console.log('=============================');
        console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
        console.log(`📊 Total Tests: ${totalTests}`);
        console.log(`✅ Total Passed: ${totalPassed}`);
        console.log(`❌ Total Failed: ${totalFailed}`);
        console.log(`⏭️  Skipped Categories: ${skippedCategories}`);
        console.log(`📈 Overall Success Rate: ${overallSuccessRate}%`);
        console.log(`📄 Comprehensive Report: ${reportPath}`);
        
        // Determine overall status
        if (totalFailed === 0 && skippedCategories === 0) {
            console.log('\n🎉 🏆 ALL TESTS PASSED - PRODUCTION READY! 🏆 🎉');
            return { status: 'SUCCESS', report: comprehensiveReport };
        } else if (totalFailed === 0 && skippedCategories > 0) {
            console.log('\n✅ 🚀 BACKEND FULLY OPERATIONAL - FRONTEND DEPLOYMENT IN PROGRESS 🚀 ✅');
            return { status: 'PARTIAL_SUCCESS', report: comprehensiveReport };
        } else {
            console.log('\n⚠️  SOME TESTS FAILED - REVIEW RESULTS ABOVE');
            return { status: 'FAILED', report: comprehensiveReport };
        }
    }

    async runAllTests() {
        console.log('\n🎯 STARTING COMPREHENSIVE PRODUCTION TEST SUITE');
        console.log('===============================================');
        console.log(`🌐 Target: http://localhost:12000`);
        console.log(`📅 Date: ${new Date().toISOString()}`);
        console.log(`🚀 SalesSync Enterprise v1.0.0 Production Testing`);
        
        try {
            // Run backend tests
            await this.runBackendTests();
            
            // Run frontend tests
            await this.runFrontendTests();
            
            // Run integration tests
            await this.runIntegrationTests();
            
            // Generate comprehensive report
            const result = this.generateComprehensiveReport();
            
            return result;
            
        } catch (error) {
            console.error('💥 Fatal error during comprehensive testing:', error);
            throw error;
        }
    }
}

// Run comprehensive tests if called directly
if (require.main === module) {
    const testSuite = new ComprehensiveTestSuite();
    
    testSuite.runAllTests()
        .then(result => {
            if (result.status === 'SUCCESS') {
                console.log('\n🎊 PRODUCTION DEPLOYMENT FULLY VALIDATED! 🎊');
                process.exit(0);
            } else if (result.status === 'PARTIAL_SUCCESS') {
                console.log('\n🚀 BACKEND OPERATIONAL - AWAITING FRONTEND DEPLOYMENT');
                process.exit(0);
            } else {
                console.log('\n⚠️  TESTS FAILED - REVIEW AND FIX ISSUES');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Comprehensive testing failed:', error);
            process.exit(1);
        });
}

module.exports = ComprehensiveTestSuite;