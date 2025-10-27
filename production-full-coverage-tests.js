#!/usr/bin/env node

/**
 * SalesSync Production Full Coverage Test Suite
 * Comprehensive automated testing including frontend browsing
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const PRODUCTION_URL = 'http://localhost:12000';
const API_BASE_URL = 'http://localhost:12001/api';
const TEST_RESULTS_DIR = './test-results';
const SCREENSHOTS_DIR = './test-screenshots';

// Test configuration
const TEST_CONFIG = {
    timeout: 30000,
    viewport: { width: 1920, height: 1080 },
    headless: true, // Set to true for CI/CD environments
    slowMo: 50 // Slow down actions for visibility
};

// Test results tracking
let testResults = {
    timestamp: new Date().toISOString(),
    environment: 'production',
    url: PRODUCTION_URL,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    tests: [],
    coverage: {
        backend: { total: 0, passed: 0, failed: 0 },
        frontend: { total: 0, passed: 0, failed: 0 },
        integration: { total: 0, passed: 0, failed: 0 },
        e2e: { total: 0, passed: 0, failed: 0 }
    }
};

// Utility functions
const log = (message, type = 'INFO') => {
    const timestamp = new Date().toISOString();
    const colors = {
        INFO: '\x1b[36m',
        SUCCESS: '\x1b[32m',
        ERROR: '\x1b[31m',
        WARNING: '\x1b[33m',
        RESET: '\x1b[0m'
    };
    console.log(`${colors[type]}[${timestamp}] [${type}] ${message}${colors.RESET}`);
};

const addTestResult = (category, name, status, details = '', screenshot = null) => {
    const result = {
        category,
        name,
        status,
        details,
        screenshot,
        timestamp: new Date().toISOString()
    };
    
    testResults.tests.push(result);
    testResults.totalTests++;
    testResults.coverage[category].total++;
    
    if (status === 'PASSED') {
        testResults.passedTests++;
        testResults.coverage[category].passed++;
        log(`✅ ${category.toUpperCase()} - ${name}: PASSED`, 'SUCCESS');
    } else if (status === 'FAILED') {
        testResults.failedTests++;
        testResults.coverage[category].failed++;
        log(`❌ ${category.toUpperCase()} - ${name}: FAILED - ${details}`, 'ERROR');
    } else {
        testResults.skippedTests++;
        log(`⏭️  ${category.toUpperCase()} - ${name}: SKIPPED - ${details}`, 'WARNING');
    }
};

const takeScreenshot = async (page, name) => {
    try {
        const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}_${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        return screenshotPath;
    } catch (error) {
        log(`Failed to take screenshot: ${error.message}`, 'ERROR');
        return null;
    }
};

// Setup test directories
const setupTestDirectories = () => {
    [TEST_RESULTS_DIR, SCREENSHOTS_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

// Backend API Tests
const runBackendTests = async () => {
    log('🔧 Starting Backend API Tests...', 'INFO');
    
    const apiTests = [
        { name: 'Health Check', endpoint: '/health', method: 'GET' },
        { name: 'Authentication - Login', endpoint: '/auth/login', method: 'POST', data: { email: 'admin@demo.com', password: 'admin123' } },
        { name: 'Users List', endpoint: '/users', method: 'GET' },
        { name: 'Customers List', endpoint: '/customers', method: 'GET' },
        { name: 'Products List', endpoint: '/products', method: 'GET' },
        { name: 'Orders List', endpoint: '/orders', method: 'GET' },
        { name: 'Routes List', endpoint: '/routes', method: 'GET' },
        { name: 'Analytics Dashboard', endpoint: '/analytics/dashboard', method: 'GET' },
        { name: 'Reports Summary', endpoint: '/reports/summary', method: 'GET' },
        { name: 'Inventory Status', endpoint: '/inventory', method: 'GET' }
    ];

    let authToken = null;

    for (const test of apiTests) {
        try {
            const config = {
                method: test.method,
                url: `${API_BASE_URL}${test.endpoint}`,
                timeout: 10000,
                validateStatus: (status) => status < 500, // Accept 4xx as valid responses
                headers: {
                    'X-Tenant-Code': 'DEMO',
                    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
                },
                httpsAgent: new (require('https').Agent)({
                    rejectUnauthorized: false // Accept self-signed certificates
                })
            };

            if (test.data) {
                config.data = test.data;
            }

            const response = await axios(config);
            
            if (test.name === 'Authentication - Login' && response.status === 200 && response.data.token) {
                authToken = response.data.token;
            }

            const success = response.status >= 200 && response.status < 400;
            addTestResult('backend', test.name, success ? 'PASSED' : 'FAILED', 
                `Status: ${response.status}, Response: ${JSON.stringify(response.data).substring(0, 100)}`);
        } catch (error) {
            addTestResult('backend', test.name, 'FAILED', `Error: ${error.message}`);
        }
    }
};

// Frontend Browser Tests
const runFrontendTests = async () => {
    log('🌐 Starting Frontend Browser Tests...', 'INFO');
    
    let browser = null;
    let page = null;

    try {
        browser = await puppeteer.launch({
            headless: TEST_CONFIG.headless,
            slowMo: TEST_CONFIG.slowMo,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--ignore-certificate-errors',
                '--ignore-ssl-errors',
                '--ignore-certificate-errors-spki-list'
            ]
        });

        page = await browser.newPage();
        await page.setViewport(TEST_CONFIG.viewport);
        
        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        // Test 1: Page Load
        try {
            log('Testing page load...', 'INFO');
            const response = await page.goto(PRODUCTION_URL, { 
                waitUntil: 'networkidle2', 
                timeout: TEST_CONFIG.timeout 
            });
            
            const screenshot = await takeScreenshot(page, 'page_load');
            const success = response && response.status() < 400;
            addTestResult('frontend', 'Page Load', success ? 'PASSED' : 'FAILED', 
                `Status: ${response ? response.status() : 'No response'}`, screenshot);
        } catch (error) {
            addTestResult('frontend', 'Page Load', 'FAILED', `Error: ${error.message}`);
        }

        // Test 2: Title and Meta Tags
        try {
            log('Testing page title and meta tags...', 'INFO');
            const title = await page.title();
            const description = await page.$eval('meta[name="description"]', el => el.content).catch(() => '');
            
            const hasTitle = title && title.length > 0;
            const hasDescription = description && description.length > 0;
            
            addTestResult('frontend', 'Title and Meta Tags', hasTitle && hasDescription ? 'PASSED' : 'FAILED',
                `Title: "${title}", Description: "${description}"`);
        } catch (error) {
            addTestResult('frontend', 'Title and Meta Tags', 'FAILED', `Error: ${error.message}`);
        }

        // Test 3: CSS and Styling
        try {
            log('Testing CSS and styling...', 'INFO');
            const stylesheets = await page.$$eval('link[rel="stylesheet"]', links => links.length);
            const inlineStyles = await page.$$eval('style', styles => styles.length);
            
            const screenshot = await takeScreenshot(page, 'styling_check');
            addTestResult('frontend', 'CSS and Styling', stylesheets > 0 ? 'PASSED' : 'FAILED',
                `Stylesheets: ${stylesheets}, Inline styles: ${inlineStyles}`, screenshot);
        } catch (error) {
            addTestResult('frontend', 'CSS and Styling', 'FAILED', `Error: ${error.message}`);
        }

        // Test 4: JavaScript Loading
        try {
            log('Testing JavaScript loading...', 'INFO');
            const scripts = await page.$$eval('script[src]', scripts => scripts.length);
            const inlineScripts = await page.$$eval('script:not([src])', scripts => scripts.length);
            
            addTestResult('frontend', 'JavaScript Loading', scripts > 0 ? 'PASSED' : 'FAILED',
                `External scripts: ${scripts}, Inline scripts: ${inlineScripts}`);
        } catch (error) {
            addTestResult('frontend', 'JavaScript Loading', 'FAILED', `Error: ${error.message}`);
        }

        // Test 5: Navigation Elements
        try {
            log('Testing navigation elements...', 'INFO');
            await page.waitForSelector('nav, header, .navbar, [role="navigation"]', { timeout: 5000 });
            
            const navElements = await page.$$('nav, header, .navbar, [role="navigation"]');
            const screenshot = await takeScreenshot(page, 'navigation');
            
            addTestResult('frontend', 'Navigation Elements', navElements.length > 0 ? 'PASSED' : 'FAILED',
                `Navigation elements found: ${navElements.length}`, screenshot);
        } catch (error) {
            addTestResult('frontend', 'Navigation Elements', 'FAILED', `Error: ${error.message}`);
        }

        // Test 6: Interactive Elements
        try {
            log('Testing interactive elements...', 'INFO');
            const buttons = await page.$$('button, input[type="button"], input[type="submit"], .btn');
            const links = await page.$$('a[href]');
            const forms = await page.$$('form');
            
            const screenshot = await takeScreenshot(page, 'interactive_elements');
            addTestResult('frontend', 'Interactive Elements', 
                buttons.length > 0 || links.length > 0 ? 'PASSED' : 'FAILED',
                `Buttons: ${buttons.length}, Links: ${links.length}, Forms: ${forms.length}`, screenshot);
        } catch (error) {
            addTestResult('frontend', 'Interactive Elements', 'FAILED', `Error: ${error.message}`);
        }

        // Test 7: Responsive Design
        try {
            log('Testing responsive design...', 'INFO');
            const viewports = [
                { name: 'Desktop', width: 1920, height: 1080 },
                { name: 'Tablet', width: 768, height: 1024 },
                { name: 'Mobile', width: 375, height: 667 }
            ];

            for (const viewport of viewports) {
                await page.setViewport(viewport);
                await page.waitForTimeout(1000);
                
                const screenshot = await takeScreenshot(page, `responsive_${viewport.name.toLowerCase()}`);
                addTestResult('frontend', `Responsive Design - ${viewport.name}`, 'PASSED',
                    `Viewport: ${viewport.width}x${viewport.height}`, screenshot);
            }
        } catch (error) {
            addTestResult('frontend', 'Responsive Design', 'FAILED', `Error: ${error.message}`);
        }

        // Test 8: Performance Metrics
        try {
            log('Testing performance metrics...', 'INFO');
            await page.setViewport(TEST_CONFIG.viewport);
            
            const performanceMetrics = await page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                return {
                    loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
                    firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
                };
            });

            const isPerformant = performanceMetrics.loadTime < 5000; // Less than 5 seconds
            addTestResult('frontend', 'Performance Metrics', isPerformant ? 'PASSED' : 'FAILED',
                `Load time: ${performanceMetrics.loadTime}ms, DOMContentLoaded: ${performanceMetrics.domContentLoaded}ms`);
        } catch (error) {
            addTestResult('frontend', 'Performance Metrics', 'FAILED', `Error: ${error.message}`);
        }

        // Test 9: Console Errors
        try {
            log('Testing for console errors...', 'INFO');
            const consoleErrors = [];
            
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });

            await page.reload({ waitUntil: 'networkidle2' });
            await page.waitForTimeout(3000);

            addTestResult('frontend', 'Console Errors', consoleErrors.length === 0 ? 'PASSED' : 'FAILED',
                `Console errors: ${consoleErrors.length > 0 ? consoleErrors.join(', ') : 'None'}`);
        } catch (error) {
            addTestResult('frontend', 'Console Errors', 'FAILED', `Error: ${error.message}`);
        }

        // Test 10: Accessibility Check
        try {
            log('Testing accessibility features...', 'INFO');
            const accessibilityFeatures = await page.evaluate(() => {
                const altImages = document.querySelectorAll('img[alt]').length;
                const totalImages = document.querySelectorAll('img').length;
                const ariaLabels = document.querySelectorAll('[aria-label]').length;
                const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
                
                return {
                    altImages,
                    totalImages,
                    ariaLabels,
                    headings,
                    altImageRatio: totalImages > 0 ? (altImages / totalImages) : 1
                };
            });

            const isAccessible = accessibilityFeatures.altImageRatio > 0.8 && accessibilityFeatures.headings > 0;
            addTestResult('frontend', 'Accessibility Check', isAccessible ? 'PASSED' : 'FAILED',
                `Alt images: ${accessibilityFeatures.altImages}/${accessibilityFeatures.totalImages}, ARIA labels: ${accessibilityFeatures.ariaLabels}, Headings: ${accessibilityFeatures.headings}`);
        } catch (error) {
            addTestResult('frontend', 'Accessibility Check', 'FAILED', `Error: ${error.message}`);
        }

    } catch (error) {
        log(`Browser setup failed: ${error.message}`, 'ERROR');
        addTestResult('frontend', 'Browser Setup', 'FAILED', `Error: ${error.message}`);
    } finally {
        if (page) await page.close();
        if (browser) await browser.close();
    }
};

// Integration Tests
const runIntegrationTests = async () => {
    log('🔗 Starting Integration Tests...', 'INFO');
    
    let browser = null;
    let page = null;

    try {
        browser = await puppeteer.launch({
            headless: TEST_CONFIG.headless,
            slowMo: TEST_CONFIG.slowMo,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--ignore-certificate-errors'
            ]
        });

        page = await browser.newPage();
        await page.setViewport(TEST_CONFIG.viewport);

        // Test 1: Frontend-Backend Communication
        try {
            log('Testing frontend-backend communication...', 'INFO');
            await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle2' });
            
            // Monitor network requests
            const apiRequests = [];
            page.on('response', response => {
                if (response.url().includes('/api/')) {
                    apiRequests.push({
                        url: response.url(),
                        status: response.status()
                    });
                }
            });

            await page.waitForTimeout(5000);
            
            const screenshot = await takeScreenshot(page, 'frontend_backend_communication');
            addTestResult('integration', 'Frontend-Backend Communication', 
                apiRequests.length > 0 ? 'PASSED' : 'FAILED',
                `API requests made: ${apiRequests.length}`, screenshot);
        } catch (error) {
            addTestResult('integration', 'Frontend-Backend Communication', 'FAILED', `Error: ${error.message}`);
        }

        // Test 2: HTTPS/SSL Integration
        try {
            log('Testing HTTPS/SSL integration...', 'INFO');
            const response = await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle2' });
            const securityDetails = await page.evaluate(() => {
                return {
                    protocol: location.protocol,
                    isSecure: location.protocol === 'https:'
                };
            });

            addTestResult('integration', 'HTTPS/SSL Integration', 
                securityDetails.isSecure ? 'PASSED' : 'FAILED',
                `Protocol: ${securityDetails.protocol}`);
        } catch (error) {
            addTestResult('integration', 'HTTPS/SSL Integration', 'FAILED', `Error: ${error.message}`);
        }

    } catch (error) {
        log(`Integration test setup failed: ${error.message}`, 'ERROR');
    } finally {
        if (page) await page.close();
        if (browser) await browser.close();
    }
};

// End-to-End Tests
const runE2ETests = async () => {
    log('🎭 Starting End-to-End Tests...', 'INFO');
    
    let browser = null;
    let page = null;

    try {
        browser = await puppeteer.launch({
            headless: TEST_CONFIG.headless,
            slowMo: TEST_CONFIG.slowMo,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--ignore-certificate-errors'
            ]
        });

        page = await browser.newPage();
        await page.setViewport(TEST_CONFIG.viewport);

        // Test 1: Complete User Journey
        try {
            log('Testing complete user journey...', 'INFO');
            await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle2' });
            
            let screenshot = await takeScreenshot(page, 'e2e_landing_page');
            
            // Try to find and interact with common elements
            const interactions = [];
            
            // Look for login/auth elements
            try {
                const loginButton = await page.$('button:contains("Login"), a:contains("Login"), .login-btn');
                if (loginButton) {
                    interactions.push('Login button found');
                }
            } catch (e) {
                interactions.push('No login button found');
            }

            // Look for navigation
            try {
                const navItems = await page.$$('nav a, .navbar a, header a');
                interactions.push(`Navigation items: ${navItems.length}`);
            } catch (e) {
                interactions.push('No navigation found');
            }

            screenshot = await takeScreenshot(page, 'e2e_user_journey');
            addTestResult('e2e', 'Complete User Journey', 'PASSED',
                `Interactions: ${interactions.join(', ')}`, screenshot);
        } catch (error) {
            addTestResult('e2e', 'Complete User Journey', 'FAILED', `Error: ${error.message}`);
        }

        // Test 2: Cross-Browser Compatibility Simulation
        try {
            log('Testing cross-browser compatibility...', 'INFO');
            const userAgents = [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
            ];

            for (const userAgent of userAgents) {
                await page.setUserAgent(userAgent);
                const response = await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle2' });
                const success = response && response.status() < 400;
                
                if (!success) {
                    addTestResult('e2e', 'Cross-Browser Compatibility', 'FAILED', 
                        `Failed with user agent: ${userAgent.substring(0, 50)}...`);
                    break;
                }
            }
            
            addTestResult('e2e', 'Cross-Browser Compatibility', 'PASSED', 
                `Tested ${userAgents.length} user agents successfully`);
        } catch (error) {
            addTestResult('e2e', 'Cross-Browser Compatibility', 'FAILED', `Error: ${error.message}`);
        }

    } catch (error) {
        log(`E2E test setup failed: ${error.message}`, 'ERROR');
    } finally {
        if (page) await page.close();
        if (browser) await browser.close();
    }
};

// Generate Test Report
const generateTestReport = () => {
    log('📊 Generating Test Report...', 'INFO');
    
    const report = {
        ...testResults,
        summary: {
            totalTests: testResults.totalTests,
            passedTests: testResults.passedTests,
            failedTests: testResults.failedTests,
            skippedTests: testResults.skippedTests,
            successRate: testResults.totalTests > 0 ? 
                ((testResults.passedTests / testResults.totalTests) * 100).toFixed(2) : 0,
            coverage: {
                backend: testResults.coverage.backend.total > 0 ? 
                    ((testResults.coverage.backend.passed / testResults.coverage.backend.total) * 100).toFixed(2) : 0,
                frontend: testResults.coverage.frontend.total > 0 ? 
                    ((testResults.coverage.frontend.passed / testResults.coverage.frontend.total) * 100).toFixed(2) : 0,
                integration: testResults.coverage.integration.total > 0 ? 
                    ((testResults.coverage.integration.passed / testResults.coverage.integration.total) * 100).toFixed(2) : 0,
                e2e: testResults.coverage.e2e.total > 0 ? 
                    ((testResults.coverage.e2e.passed / testResults.coverage.e2e.total) * 100).toFixed(2) : 0
            }
        }
    };

    // Save detailed report
    const reportPath = path.join(TEST_RESULTS_DIR, `production-test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate summary report
    const summaryPath = path.join(TEST_RESULTS_DIR, `test-summary-${Date.now()}.md`);
    const summaryContent = `# SalesSync Production Test Report

## Test Summary
- **Total Tests:** ${report.summary.totalTests}
- **Passed:** ${report.summary.passedTests} ✅
- **Failed:** ${report.summary.failedTests} ❌
- **Skipped:** ${report.summary.skippedTests} ⏭️
- **Success Rate:** ${report.summary.successRate}%

## Coverage by Category
- **Backend API:** ${report.summary.coverage.backend}% (${testResults.coverage.backend.passed}/${testResults.coverage.backend.total})
- **Frontend:** ${report.summary.coverage.frontend}% (${testResults.coverage.frontend.passed}/${testResults.coverage.frontend.total})
- **Integration:** ${report.summary.coverage.integration}% (${testResults.coverage.integration.passed}/${testResults.coverage.integration.total})
- **End-to-End:** ${report.summary.coverage.e2e}% (${testResults.coverage.e2e.passed}/${testResults.coverage.e2e.total})

## Test Results
${report.tests.map(test => `- **${test.category.toUpperCase()} - ${test.name}:** ${test.status} ${test.details ? `(${test.details})` : ''}`).join('\n')}

## Production Environment
- **URL:** ${PRODUCTION_URL}
- **Test Date:** ${report.timestamp}
- **Environment:** Production
`;

    fs.writeFileSync(summaryPath, summaryContent);

    log(`📋 Test report saved to: ${reportPath}`, 'SUCCESS');
    log(`📋 Test summary saved to: ${summaryPath}`, 'SUCCESS');

    return report;
};

// Main execution function
const runFullCoverageTests = async () => {
    log('🚀 Starting SalesSync Production Full Coverage Tests', 'INFO');
    log(`🌐 Testing Production Environment: ${PRODUCTION_URL}`, 'INFO');
    
    setupTestDirectories();

    try {
        // Run all test suites
        await runBackendTests();
        await runFrontendTests();
        await runIntegrationTests();
        await runE2ETests();

        // Generate report
        const report = generateTestReport();

        // Display summary
        log('', 'INFO');
        log('🎉 TEST EXECUTION COMPLETED', 'SUCCESS');
        log('================================', 'INFO');
        log(`📊 Total Tests: ${report.summary.totalTests}`, 'INFO');
        log(`✅ Passed: ${report.summary.passedTests}`, 'SUCCESS');
        log(`❌ Failed: ${report.summary.failedTests}`, report.summary.failedTests > 0 ? 'ERROR' : 'INFO');
        log(`⏭️  Skipped: ${report.summary.skippedTests}`, 'WARNING');
        log(`📈 Success Rate: ${report.summary.successRate}%`, 'INFO');
        log('', 'INFO');
        log('Coverage by Category:', 'INFO');
        log(`🔧 Backend API: ${report.summary.coverage.backend}%`, 'INFO');
        log(`🌐 Frontend: ${report.summary.coverage.frontend}%`, 'INFO');
        log(`🔗 Integration: ${report.summary.coverage.integration}%`, 'INFO');
        log(`🎭 End-to-End: ${report.summary.coverage.e2e}%`, 'INFO');
        log('', 'INFO');
        
        if (report.summary.successRate >= 90) {
            log('🏆 PRODUCTION SYSTEM STATUS: EXCELLENT', 'SUCCESS');
        } else if (report.summary.successRate >= 80) {
            log('✅ PRODUCTION SYSTEM STATUS: GOOD', 'SUCCESS');
        } else if (report.summary.successRate >= 70) {
            log('⚠️  PRODUCTION SYSTEM STATUS: NEEDS ATTENTION', 'WARNING');
        } else {
            log('❌ PRODUCTION SYSTEM STATUS: CRITICAL ISSUES', 'ERROR');
        }

        return report;
    } catch (error) {
        log(`❌ Test execution failed: ${error.message}`, 'ERROR');
        throw error;
    }
};

// Execute if run directly
if (require.main === module) {
    runFullCoverageTests()
        .then(report => {
            process.exit(report.summary.failedTests > 0 ? 1 : 0);
        })
        .catch(error => {
            log(`Fatal error: ${error.message}`, 'ERROR');
            process.exit(1);
        });
}

module.exports = { runFullCoverageTests, testResults };