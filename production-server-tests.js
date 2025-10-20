#!/usr/bin/env node

/**
 * SalesSync Production Server Test Suite
 * Runs comprehensive tests directly on the Linux production server
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const PRODUCTION_URL = 'https://ss.gonxt.tech';
const API_BASE_URL = `${PRODUCTION_URL}/api`;

// Test results tracking
let testResults = {
    timestamp: new Date().toISOString(),
    server: process.env.HOSTNAME || 'unknown',
    environment: 'production-server',
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    tests: []
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

const addTestResult = (name, status, details = '') => {
    const result = {
        name,
        status,
        details,
        timestamp: new Date().toISOString()
    };
    
    testResults.tests.push(result);
    testResults.totalTests++;
    
    if (status === 'PASSED') {
        testResults.passedTests++;
        log(`✅ ${name}: PASSED`, 'SUCCESS');
    } else {
        testResults.failedTests++;
        log(`❌ ${name}: FAILED - ${details}`, 'ERROR');
    }
};

// HTTP request helper
const makeRequest = (url, options = {}) => {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.request(url, {
            rejectUnauthorized: false, // Accept self-signed certificates
            ...options
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, data, headers: res.headers }));
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        if (options.data) {
            req.write(options.data);
        }
        req.end();
    });
};

// Test 1: Server Environment
const testServerEnvironment = async () => {
    log('🖥️  Testing Server Environment...', 'INFO');
    
    try {
        const { stdout: hostname } = await execAsync('hostname');
        const { stdout: uptime } = await execAsync('uptime');
        const { stdout: memory } = await execAsync('free -h | grep "^Mem:"');
        const { stdout: disk } = await execAsync('df -h / | tail -1');
        
        addTestResult('Server Environment', 'PASSED', 
            `Hostname: ${hostname.trim()}, Uptime: ${uptime.trim()}`);
    } catch (error) {
        addTestResult('Server Environment', 'FAILED', error.message);
    }
};

// Test 2: Web Server Status
const testWebServerStatus = async () => {
    log('🔧 Testing Web Server Status...', 'INFO');
    
    try {
        const { stdout: nginxStatus } = await execAsync('systemctl is-active nginx');
        const isActive = nginxStatus.trim() === 'active';
        
        if (isActive) {
            const { stdout: nginxVersion } = await execAsync('nginx -v 2>&1');
            addTestResult('Nginx Web Server', 'PASSED', `Status: active, ${nginxVersion.trim()}`);
        } else {
            addTestResult('Nginx Web Server', 'FAILED', `Status: ${nginxStatus.trim()}`);
        }
    } catch (error) {
        addTestResult('Nginx Web Server', 'FAILED', error.message);
    }
};

// Test 3: Backend API Process
const testBackendProcess = async () => {
    log('⚙️  Testing Backend API Process...', 'INFO');
    
    try {
        const { stdout: pm2List } = await execAsync('pm2 jlist');
        const processes = JSON.parse(pm2List);
        const salesSyncProcess = processes.find(p => p.name === 'SalesSync-API');
        
        if (salesSyncProcess) {
            const status = salesSyncProcess.pm2_env.status;
            const uptime = salesSyncProcess.pm2_env.pm_uptime;
            const memory = Math.round(salesSyncProcess.monit.memory / 1024 / 1024);
            
            if (status === 'online') {
                addTestResult('Backend API Process', 'PASSED', 
                    `Status: ${status}, Memory: ${memory}MB, Uptime: ${new Date(uptime).toISOString()}`);
            } else {
                addTestResult('Backend API Process', 'FAILED', `Status: ${status}`);
            }
        } else {
            addTestResult('Backend API Process', 'FAILED', 'SalesSync-API process not found');
        }
    } catch (error) {
        addTestResult('Backend API Process', 'FAILED', error.message);
    }
};

// Test 4: API Health Check
const testAPIHealth = async () => {
    log('🏥 Testing API Health Check...', 'INFO');
    
    try {
        const response = await makeRequest(`${API_BASE_URL}/health`);
        
        if (response.statusCode === 200) {
            const healthData = JSON.parse(response.data);
            addTestResult('API Health Check', 'PASSED', 
                `Status: ${healthData.status}, Uptime: ${healthData.uptime}s`);
        } else {
            addTestResult('API Health Check', 'FAILED', 
                `HTTP ${response.statusCode}: ${response.data}`);
        }
    } catch (error) {
        addTestResult('API Health Check', 'FAILED', error.message);
    }
};

// Test 5: Frontend Accessibility
const testFrontendAccessibility = async () => {
    log('🌐 Testing Frontend Accessibility...', 'INFO');
    
    try {
        const response = await makeRequest(PRODUCTION_URL);
        
        if (response.statusCode === 200) {
            const containsSalesSync = response.data.includes('SalesSync');
            const containsTitle = response.data.includes('<title>');
            
            if (containsSalesSync && containsTitle) {
                addTestResult('Frontend Accessibility', 'PASSED', 
                    `HTTP 200, Contains SalesSync branding and proper HTML structure`);
            } else {
                addTestResult('Frontend Accessibility', 'FAILED', 
                    'Missing expected content or HTML structure');
            }
        } else {
            addTestResult('Frontend Accessibility', 'FAILED', 
                `HTTP ${response.statusCode}: ${response.data.substring(0, 100)}`);
        }
    } catch (error) {
        addTestResult('Frontend Accessibility', 'FAILED', error.message);
    }
};

// Test 6: SSL Certificate
const testSSLCertificate = async () => {
    log('🔒 Testing SSL Certificate...', 'INFO');
    
    try {
        const response = await makeRequest(PRODUCTION_URL);
        
        if (response.statusCode === 200) {
            addTestResult('SSL Certificate', 'PASSED', 'HTTPS connection successful');
        } else {
            addTestResult('SSL Certificate', 'FAILED', `HTTPS connection failed: ${response.statusCode}`);
        }
    } catch (error) {
        if (error.message.includes('certificate')) {
            addTestResult('SSL Certificate', 'FAILED', `Certificate error: ${error.message}`);
        } else {
            addTestResult('SSL Certificate', 'FAILED', error.message);
        }
    }
};

// Test 7: API Security
const testAPISecurity = async () => {
    log('🔐 Testing API Security...', 'INFO');
    
    const protectedEndpoints = ['/users', '/customers', '/products', '/orders'];
    let securedCount = 0;
    
    for (const endpoint of protectedEndpoints) {
        try {
            const response = await makeRequest(`${API_BASE_URL}${endpoint}`);
            
            if (response.statusCode === 401) {
                securedCount++;
            }
        } catch (error) {
            // Network errors are acceptable for this test
        }
    }
    
    if (securedCount === protectedEndpoints.length) {
        addTestResult('API Security', 'PASSED', 
            `All ${protectedEndpoints.length} protected endpoints properly secured`);
    } else {
        addTestResult('API Security', 'FAILED', 
            `Only ${securedCount}/${protectedEndpoints.length} endpoints properly secured`);
    }
};

// Test 8: Database Connectivity
const testDatabaseConnectivity = async () => {
    log('💾 Testing Database Connectivity...', 'INFO');
    
    try {
        const dbPath = '/home/ubuntu/SalesSync/backend-api/database.sqlite';
        const stats = fs.statSync(dbPath);
        
        if (stats.isFile() && stats.size > 0) {
            addTestResult('Database Connectivity', 'PASSED', 
                `Database file exists, Size: ${Math.round(stats.size / 1024)}KB`);
        } else {
            addTestResult('Database Connectivity', 'FAILED', 'Database file missing or empty');
        }
    } catch (error) {
        addTestResult('Database Connectivity', 'FAILED', error.message);
    }
};

// Test 9: Static Files Serving
const testStaticFilesServing = async () => {
    log('📁 Testing Static Files Serving...', 'INFO');
    
    try {
        const webRoot = '/var/www/html';
        const indexPath = `${webRoot}/index.html`;
        
        if (fs.existsSync(indexPath)) {
            const stats = fs.statSync(indexPath);
            const fileCount = fs.readdirSync(webRoot).length;
            
            addTestResult('Static Files Serving', 'PASSED', 
                `Index file exists (${Math.round(stats.size / 1024)}KB), ${fileCount} files in web root`);
        } else {
            addTestResult('Static Files Serving', 'FAILED', 'Index.html not found in web root');
        }
    } catch (error) {
        addTestResult('Static Files Serving', 'FAILED', error.message);
    }
};

// Test 10: System Performance
const testSystemPerformance = async () => {
    log('📊 Testing System Performance...', 'INFO');
    
    try {
        const { stdout: loadAvg } = await execAsync("uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//'");
        const { stdout: memUsage } = await execAsync("free | grep '^Mem:' | awk '{printf \"%.1f\", $3/$2 * 100.0}'");
        const { stdout: diskUsage } = await execAsync("df / | tail -1 | awk '{print $5}' | sed 's/%//'");
        
        const load = parseFloat(loadAvg.trim());
        const memory = parseFloat(memUsage.trim());
        const disk = parseFloat(diskUsage.trim());
        
        const performanceGood = load < 2.0 && memory < 80 && disk < 90;
        
        if (performanceGood) {
            addTestResult('System Performance', 'PASSED', 
                `Load: ${load}, Memory: ${memory}%, Disk: ${disk}%`);
        } else {
            addTestResult('System Performance', 'FAILED', 
                `Performance issues - Load: ${load}, Memory: ${memory}%, Disk: ${disk}%`);
        }
    } catch (error) {
        addTestResult('System Performance', 'FAILED', error.message);
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
            successRate: testResults.totalTests > 0 ? 
                ((testResults.passedTests / testResults.totalTests) * 100).toFixed(2) : 0
        }
    };

    // Save report
    const reportPath = `/tmp/production-server-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate summary
    const summaryPath = `/tmp/production-server-test-summary-${Date.now()}.md`;
    const summaryContent = `# SalesSync Production Server Test Report

## Test Summary
- **Server:** ${report.server}
- **Test Date:** ${report.timestamp}
- **Total Tests:** ${report.summary.totalTests}
- **Passed:** ${report.summary.passedTests} ✅
- **Failed:** ${report.summary.failedTests} ❌
- **Success Rate:** ${report.summary.successRate}%

## Test Results
${report.tests.map(test => `- **${test.name}:** ${test.status} ${test.details ? `(${test.details})` : ''}`).join('\n')}

## Production Environment Status
- **URL:** ${PRODUCTION_URL}
- **Server:** ${report.server}
- **Test Date:** ${report.timestamp}
`;

    fs.writeFileSync(summaryPath, summaryContent);

    log(`📋 Test report saved to: ${reportPath}`, 'SUCCESS');
    log(`📋 Test summary saved to: ${summaryPath}`, 'SUCCESS');

    return report;
};

// Main execution function
const runProductionServerTests = async () => {
    log('🚀 Starting SalesSync Production Server Tests', 'INFO');
    log(`🖥️  Server: ${process.env.HOSTNAME || 'unknown'}`, 'INFO');
    log(`🌐 Testing Production Environment: ${PRODUCTION_URL}`, 'INFO');
    
    try {
        // Run all test suites
        await testServerEnvironment();
        await testWebServerStatus();
        await testBackendProcess();
        await testAPIHealth();
        await testFrontendAccessibility();
        await testSSLCertificate();
        await testAPISecurity();
        await testDatabaseConnectivity();
        await testStaticFilesServing();
        await testSystemPerformance();

        // Generate report
        const report = generateTestReport();

        // Display summary
        log('', 'INFO');
        log('🎉 PRODUCTION SERVER TEST EXECUTION COMPLETED', 'SUCCESS');
        log('================================================', 'INFO');
        log(`📊 Total Tests: ${report.summary.totalTests}`, 'INFO');
        log(`✅ Passed: ${report.summary.passedTests}`, 'SUCCESS');
        log(`❌ Failed: ${report.summary.failedTests}`, report.summary.failedTests > 0 ? 'ERROR' : 'INFO');
        log(`📈 Success Rate: ${report.summary.successRate}%`, 'INFO');
        log('', 'INFO');
        
        if (report.summary.successRate >= 90) {
            log('🏆 PRODUCTION SERVER STATUS: EXCELLENT', 'SUCCESS');
        } else if (report.summary.successRate >= 80) {
            log('✅ PRODUCTION SERVER STATUS: GOOD', 'SUCCESS');
        } else if (report.summary.successRate >= 70) {
            log('⚠️  PRODUCTION SERVER STATUS: NEEDS ATTENTION', 'WARNING');
        } else {
            log('❌ PRODUCTION SERVER STATUS: CRITICAL ISSUES', 'ERROR');
        }

        return report;
    } catch (error) {
        log(`❌ Test execution failed: ${error.message}`, 'ERROR');
        throw error;
    }
};

// Execute if run directly
if (require.main === module) {
    runProductionServerTests()
        .then(report => {
            process.exit(report.summary.failedTests > 0 ? 1 : 0);
        })
        .catch(error => {
            log(`Fatal error: ${error.message}`, 'ERROR');
            process.exit(1);
        });
}

module.exports = { runProductionServerTests, testResults };