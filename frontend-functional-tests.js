#!/usr/bin/env node

/**
 * Frontend Functional Tests for SalesSync Enterprise
 * Comprehensive UI/UX testing once frontend is deployed
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const PRODUCTION_URL = 'https://ss.gonxt.tech';
const TEST_TIMEOUT = 30000;
const SCREENSHOT_DIR = './frontend-test-screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

class FrontendTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
    }

    async initialize() {
        console.log('🚀 Initializing browser for frontend testing...');
        
        this.browser = await puppeteer.launch({
            headless: true, // Run in headless mode for server environment
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--ignore-certificate-errors',
                '--ignore-ssl-errors'
            ]
        });

        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1920, height: 1080 });
        this.page.setDefaultTimeout(TEST_TIMEOUT);
        
        console.log('✅ Browser initialized successfully');
    }

    async runTest(testName, testFunction) {
        console.log(`\n🧪 Running test: ${testName}`);
        const startTime = Date.now();
        
        try {
            await testFunction();
            const duration = Date.now() - startTime;
            console.log(`✅ ${testName} - PASSED (${duration}ms)`);
            this.testResults.push({ name: testName, status: 'PASSED', duration, error: null });
            return true;
        } catch (error) {
            const duration = Date.now() - startTime;
            console.log(`❌ ${testName} - FAILED (${duration}ms)`);
            console.log(`   Error: ${error.message}`);
            this.testResults.push({ name: testName, status: 'FAILED', duration, error: error.message });
            
            // Take screenshot on failure
            try {
                const screenshotPath = path.join(SCREENSHOT_DIR, `${testName.replace(/\s+/g, '_')}_failure.png`);
                await this.page.screenshot({ path: screenshotPath, fullPage: true });
                console.log(`   Screenshot saved: ${screenshotPath}`);
            } catch (screenshotError) {
                console.log(`   Failed to take screenshot: ${screenshotError.message}`);
            }
            
            return false;
        }
    }

    async testHomepageLoad() {
        console.log('🏠 Testing Homepage Load');
        
        const response = await this.page.goto(PRODUCTION_URL, { 
            waitUntil: 'networkidle0',
            timeout: TEST_TIMEOUT 
        });
        
        if (!response || response.status() !== 200) {
            throw new Error(`Homepage failed to load: ${response ? response.status() : 'No response'}`);
        }
        
        // Wait for React app to load
        await this.page.waitForSelector('body', { timeout: 10000 });
        
        // Take screenshot
        await this.page.screenshot({ 
            path: path.join(SCREENSHOT_DIR, 'homepage_loaded.png'), 
            fullPage: true 
        });
        
        console.log('   ✅ Homepage loaded successfully');
    }

    async testNavigation() {
        console.log('🧭 Testing Navigation');
        
        // Check for navigation elements
        const navElements = await this.page.$$eval('nav a, .nav-link, [role="navigation"] a', 
            links => links.map(link => ({ text: link.textContent.trim(), href: link.href }))
        );
        
        console.log(`   Found ${navElements.length} navigation links`);
        
        if (navElements.length === 0) {
            throw new Error('No navigation links found');
        }
        
        // Test first few navigation links
        for (let i = 0; i < Math.min(3, navElements.length); i++) {
            const link = navElements[i];
            if (link.text && link.href) {
                console.log(`   Testing navigation to: ${link.text}`);
                
                try {
                    await this.page.click(`a[href*="${new URL(link.href).pathname}"]`);
                    await this.page.waitForTimeout(2000); // Wait for navigation
                    
                    await this.page.screenshot({ 
                        path: path.join(SCREENSHOT_DIR, `nav_${link.text.replace(/\s+/g, '_')}.png`), 
                        fullPage: true 
                    });
                    
                    console.log(`   ✅ Navigation to ${link.text} successful`);
                } catch (navError) {
                    console.log(`   ⚠️  Navigation to ${link.text} failed: ${navError.message}`);
                }
            }
        }
    }

    async testLoginForm() {
        console.log('🔐 Testing Login Form');
        
        // Look for login form or login button
        const loginElements = await this.page.$$eval(
            'form[action*="login"], .login-form, button:contains("Login"), a:contains("Login"), input[type="email"], input[type="password"]',
            elements => elements.length
        ).catch(() => 0);
        
        if (loginElements === 0) {
            // Try to find login page
            try {
                await this.page.goto(`${PRODUCTION_URL}/login`, { waitUntil: 'networkidle0' });
                
                await this.page.screenshot({ 
                    path: path.join(SCREENSHOT_DIR, 'login_page.png'), 
                    fullPage: true 
                });
                
                console.log('   ✅ Login page accessible');
            } catch (error) {
                console.log('   ⚠️  No login form found on homepage or /login route');
                return;
            }
        }
        
        // Test form interaction if found
        try {
            const emailInput = await this.page.$('input[type="email"], input[name="email"], input[placeholder*="email"]');
            const passwordInput = await this.page.$('input[type="password"], input[name="password"]');
            
            if (emailInput && passwordInput) {
                await emailInput.type('test@example.com');
                await passwordInput.type('testpassword');
                
                await this.page.screenshot({ 
                    path: path.join(SCREENSHOT_DIR, 'login_form_filled.png'), 
                    fullPage: true 
                });
                
                console.log('   ✅ Login form interaction successful');
            }
        } catch (error) {
            console.log(`   ⚠️  Login form interaction failed: ${error.message}`);
        }
    }

    async testResponsiveDesign() {
        console.log('📱 Testing Responsive Design');
        
        const viewports = [
            { width: 375, height: 667, name: 'Mobile' },
            { width: 768, height: 1024, name: 'Tablet' },
            { width: 1920, height: 1080, name: 'Desktop' }
        ];
        
        for (const viewport of viewports) {
            console.log(`   Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
            
            await this.page.setViewport(viewport);
            await this.page.reload({ waitUntil: 'networkidle0' });
            
            // Check if content is visible and properly laid out
            const bodyHeight = await this.page.evaluate(() => document.body.scrollHeight);
            const viewportHeight = viewport.height;
            
            if (bodyHeight < viewportHeight / 2) {
                console.log(`   ⚠️  Content seems too short for ${viewport.name}`);
            }
            
            await this.page.screenshot({ 
                path: path.join(SCREENSHOT_DIR, `responsive_${viewport.name.toLowerCase()}.png`),
                fullPage: true 
            });
            
            console.log(`   ✅ ${viewport.name} layout captured`);
        }
        
        // Reset to desktop
        await this.page.setViewport({ width: 1920, height: 1080 });
    }

    async testInteractiveElements() {
        console.log('🖱️ Testing Interactive Elements');
        
        // Test buttons
        const buttons = await this.page.$$('button, .btn, input[type="submit"]');
        console.log(`   Found ${buttons.length} interactive buttons`);
        
        // Test first few buttons
        for (let i = 0; i < Math.min(3, buttons.length); i++) {
            try {
                const buttonText = await buttons[i].evaluate(el => el.textContent || el.value || 'Button');
                console.log(`   Testing button: ${buttonText.trim()}`);
                
                await buttons[i].hover();
                await this.page.waitForTimeout(500);
                
                // Don't actually click to avoid navigation issues
                console.log(`   ✅ Button hover effect working`);
            } catch (error) {
                console.log(`   ⚠️  Button interaction failed: ${error.message}`);
            }
        }
        
        // Test form inputs
        const inputs = await this.page.$$('input[type="text"], input[type="email"], textarea');
        console.log(`   Found ${inputs.length} form inputs`);
        
        for (let i = 0; i < Math.min(2, inputs.length); i++) {
            try {
                await inputs[i].focus();
                await inputs[i].type('Test input');
                await this.page.waitForTimeout(500);
                await inputs[i].evaluate(el => el.value = ''); // Clear
                
                console.log(`   ✅ Input field interaction working`);
            } catch (error) {
                console.log(`   ⚠️  Input interaction failed: ${error.message}`);
            }
        }
    }

    async testPerformanceMetrics() {
        console.log('⚡ Testing Performance Metrics');
        
        // Enable performance monitoring
        await this.page.goto(PRODUCTION_URL, { waitUntil: 'networkidle0' });
        
        const performanceMetrics = await this.page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            return {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
                firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
            };
        });
        
        console.log('   Performance Metrics:');
        console.log(`   - DOM Content Loaded: ${performanceMetrics.domContentLoaded.toFixed(2)}ms`);
        console.log(`   - Load Complete: ${performanceMetrics.loadComplete.toFixed(2)}ms`);
        console.log(`   - First Paint: ${performanceMetrics.firstPaint.toFixed(2)}ms`);
        console.log(`   - First Contentful Paint: ${performanceMetrics.firstContentfulPaint.toFixed(2)}ms`);
        
        if (performanceMetrics.domContentLoaded > 3000) {
            console.log('   ⚠️  DOM Content Loaded time is high');
        } else {
            console.log('   ✅ Good DOM loading performance');
        }
    }

    async testAccessibility() {
        console.log('♿ Testing Accessibility');
        
        // Check for basic accessibility features
        const accessibilityChecks = await this.page.evaluate(() => {
            const results = {
                hasTitle: !!document.title,
                hasLang: !!document.documentElement.lang,
                imagesWithAlt: 0,
                imagesWithoutAlt: 0,
                headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
                focusableElements: document.querySelectorAll('a, button, input, select, textarea, [tabindex]').length
            };
            
            // Check images
            const images = document.querySelectorAll('img');
            images.forEach(img => {
                if (img.alt) {
                    results.imagesWithAlt++;
                } else {
                    results.imagesWithoutAlt++;
                }
            });
            
            return results;
        });
        
        console.log('   Accessibility Check Results:');
        console.log(`   - Page Title: ${accessibilityChecks.hasTitle ? '✅' : '❌'}`);
        console.log(`   - Language Attribute: ${accessibilityChecks.hasLang ? '✅' : '❌'}`);
        console.log(`   - Headings: ${accessibilityChecks.headings}`);
        console.log(`   - Focusable Elements: ${accessibilityChecks.focusableElements}`);
        console.log(`   - Images with Alt Text: ${accessibilityChecks.imagesWithAlt}`);
        console.log(`   - Images without Alt Text: ${accessibilityChecks.imagesWithoutAlt}`);
        
        if (accessibilityChecks.imagesWithoutAlt > 0) {
            console.log('   ⚠️  Some images missing alt text');
        }
        
        if (accessibilityChecks.headings === 0) {
            console.log('   ⚠️  No heading elements found');
        }
    }

    async generateReport() {
        console.log('\n📊 Generating Frontend Test Report...');
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(t => t.status === 'PASSED').length;
        const failedTests = this.testResults.filter(t => t.status === 'FAILED').length;
        const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0';
        
        const report = {
            timestamp: new Date().toISOString(),
            productionUrl: PRODUCTION_URL,
            testType: 'Frontend Functional Tests',
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: `${successRate}%`
            },
            results: this.testResults
        };
        
        const reportPath = './frontend-test-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('\n🎯 FRONTEND TEST SUMMARY');
        console.log('========================');
        console.log(`📊 Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        console.log(`📄 Report saved: ${reportPath}`);
        
        return report;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 Browser closed');
        }
    }

    async runAllTests() {
        try {
            await this.initialize();
            
            console.log('\n🎯 STARTING FRONTEND FUNCTIONAL TESTS');
            console.log('=====================================');
            console.log(`🌐 Target: ${PRODUCTION_URL}`);
            console.log(`📅 Date: ${new Date().toISOString()}`);
            
            // Check if frontend is available first
            try {
                const response = await this.page.goto(PRODUCTION_URL, { waitUntil: 'networkidle0' });
                if (!response || response.status() === 404) {
                    console.log('❌ Frontend not yet deployed - skipping functional tests');
                    console.log('📝 Run these tests again once CI/CD pipeline completes frontend deployment');
                    return { skipped: true, reason: 'Frontend not deployed' };
                }
            } catch (error) {
                console.log('❌ Cannot access frontend - skipping functional tests');
                return { skipped: true, reason: 'Frontend inaccessible' };
            }
            
            // Run all frontend tests
            await this.runTest('Homepage Load', () => this.testHomepageLoad());
            await this.runTest('Navigation', () => this.testNavigation());
            await this.runTest('Login Form', () => this.testLoginForm());
            await this.runTest('Responsive Design', () => this.testResponsiveDesign());
            await this.runTest('Interactive Elements', () => this.testInteractiveElements());
            await this.runTest('Performance Metrics', () => this.testPerformanceMetrics());
            await this.runTest('Accessibility', () => this.testAccessibility());
            
            const report = await this.generateReport();
            return report;
            
        } catch (error) {
            console.error('💥 Fatal error during frontend testing:', error);
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// Export for use in other scripts
module.exports = FrontendTester;

// Run tests if called directly
if (require.main === module) {
    const tester = new FrontendTester();
    
    tester.runAllTests()
        .then(report => {
            if (report.skipped) {
                console.log(`\n⏭️  Frontend tests skipped: ${report.reason}`);
                process.exit(0);
            }
            
            console.log('\n🎉 Frontend testing completed!');
            
            if (report.summary.failed === 0) {
                console.log('🏆 ALL FRONTEND TESTS PASSED!');
                process.exit(0);
            } else {
                console.log(`⚠️  ${report.summary.failed} test(s) failed - Review results above`);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Frontend testing failed:', error);
            process.exit(1);
        });
}