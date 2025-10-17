#!/usr/bin/env node

/**
 * Final Production Verification Suite
 * Comprehensive testing of SalesSync production deployment
 */

const https = require('https');
const fs = require('fs');

const BASE_URL = 'https://ss.gonxt.tech';

console.log('🎯 SalesSync Final Production Verification');
console.log('==========================================');
console.log(`🌐 Testing: ${BASE_URL}`);
console.log(`⏰ Started: ${new Date().toISOString()}\n`);

/**
 * Make HTTP request with proper headers
 */
function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'User-Agent': 'SalesSync-Production-Test/1.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };

    const options = {
      headers: { ...defaultHeaders, ...headers },
      timeout: 10000
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Test application functionality
 */
async function runVerification() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function logResult(test, status, details = '') {
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${test} ${details}`);
    results.tests.push({ test, status, details });
    if (status === 'PASS') results.passed++;
    else results.failed++;
  }

  try {
    console.log('🔍 Core Application Tests\n');

    // Test 1: Main application loads
    const mainResponse = await makeRequest(BASE_URL);
    if (mainResponse.statusCode === 200 && mainResponse.body.includes('SalesSync')) {
      logResult('Main application loads', 'PASS', `${mainResponse.statusCode} - ${mainResponse.body.length} bytes`);
    } else {
      logResult('Main application loads', 'FAIL', `Status: ${mainResponse.statusCode}`);
    }

    // Test 2: Gzip compression works
    if (mainResponse.headers['content-encoding'] === 'gzip') {
      logResult('Gzip compression enabled', 'PASS');
    } else {
      logResult('Gzip compression enabled', 'FAIL', 'No gzip encoding');
    }

    // Test 3: Security headers present
    const securityHeaders = ['x-frame-options', 'x-content-type-options', 'content-security-policy'];
    let securityPassed = 0;
    securityHeaders.forEach(header => {
      if (mainResponse.headers[header]) {
        securityPassed++;
      }
    });
    if (securityPassed === securityHeaders.length) {
      logResult('Security headers configured', 'PASS', `${securityPassed}/${securityHeaders.length} headers`);
    } else {
      logResult('Security headers configured', 'FAIL', `${securityPassed}/${securityHeaders.length} headers`);
    }

    // Test 4: JavaScript bundle loads
    const jsResponse = await makeRequest(BASE_URL + '/assets/index-j72J05TH.js');
    if (jsResponse.statusCode === 200 && jsResponse.body.length > 100000) {
      logResult('JavaScript bundle loads', 'PASS', `${jsResponse.body.length} bytes`);
    } else {
      logResult('JavaScript bundle loads', 'FAIL', `Status: ${jsResponse.statusCode}`);
    }

    // Test 5: CSS bundle loads
    const cssResponse = await makeRequest(BASE_URL + '/assets/index-CV4mcc-4.css');
    if (cssResponse.statusCode === 200 && cssResponse.body.includes('tailwind')) {
      logResult('CSS bundle loads', 'PASS', `${cssResponse.body.length} bytes`);
    } else {
      logResult('CSS bundle loads', 'FAIL', `Status: ${cssResponse.statusCode}`);
    }

    // Test 6: Service Worker loads
    const swResponse = await makeRequest(BASE_URL + '/sw.js');
    if (swResponse.statusCode === 200 && swResponse.body.includes('workbox')) {
      logResult('Service Worker loads', 'PASS');
    } else {
      logResult('Service Worker loads', 'FAIL', `Status: ${swResponse.statusCode}`);
    }

    // Test 7: PWA Manifest loads
    const manifestResponse = await makeRequest(BASE_URL + '/manifest.webmanifest');
    if (manifestResponse.statusCode === 200) {
      const manifest = JSON.parse(manifestResponse.body);
      if (manifest.name && manifest.icons && manifest.start_url) {
        logResult('PWA Manifest valid', 'PASS', `Name: ${manifest.name}`);
      } else {
        logResult('PWA Manifest valid', 'FAIL', 'Missing required fields');
      }
    } else {
      logResult('PWA Manifest loads', 'FAIL', `Status: ${manifestResponse.statusCode}`);
    }

    // Test 8: Favicon loads
    const faviconResponse = await makeRequest(BASE_URL + '/favicon.ico');
    if (faviconResponse.statusCode === 200) {
      logResult('Favicon loads', 'PASS');
    } else {
      logResult('Favicon loads', 'FAIL', `Status: ${faviconResponse.statusCode}`);
    }

    // Test 9: Asset caching headers
    if (jsResponse.headers['cache-control'] && jsResponse.headers['cache-control'].includes('max-age')) {
      logResult('Asset caching configured', 'PASS', jsResponse.headers['cache-control']);
    } else {
      logResult('Asset caching configured', 'FAIL', 'No cache headers');
    }

    // Test 10: SPA routing (test a route that should fallback to index.html)
    const routeResponse = await makeRequest(BASE_URL + '/dashboard');
    if (routeResponse.statusCode === 200 && routeResponse.body.includes('<!doctype html>')) {
      logResult('SPA routing works', 'PASS', 'Dashboard route serves index.html');
    } else {
      logResult('SPA routing works', 'FAIL', `Status: ${routeResponse.statusCode}`);
    }

    console.log('\n🧪 Advanced Feature Tests\n');

    // Test 11: Check for React components in bundle
    const hasReact = jsResponse.body.includes('React') || jsResponse.body.includes('createElement');
    if (hasReact) {
      logResult('React framework loaded', 'PASS');
    } else {
      logResult('React framework loaded', 'FAIL', 'React not found in bundle');
    }

    // Test 12: Check for routing in bundle
    const hasRouting = jsResponse.body.includes('router') || jsResponse.body.includes('Route');
    if (hasRouting) {
      logResult('Client-side routing loaded', 'PASS');
    } else {
      logResult('Client-side routing loaded', 'FAIL', 'Router not found in bundle');
    }

    // Test 13: Check for state management
    const hasStateManagement = jsResponse.body.includes('zustand') || jsResponse.body.includes('store');
    if (hasStateManagement) {
      logResult('State management loaded', 'PASS');
    } else {
      logResult('State management loaded', 'FAIL', 'State management not found');
    }

    // Test 14: Check for UI components
    const hasUIComponents = jsResponse.body.includes('Button') || jsResponse.body.includes('Input');
    if (hasUIComponents) {
      logResult('UI components loaded', 'PASS');
    } else {
      logResult('UI components loaded', 'FAIL', 'UI components not found');
    }

    // Test 15: Performance check
    const startTime = Date.now();
    await makeRequest(BASE_URL);
    const loadTime = Date.now() - startTime;
    if (loadTime < 2000) {
      logResult('Performance acceptable', 'PASS', `${loadTime}ms load time`);
    } else {
      logResult('Performance acceptable', 'FAIL', `${loadTime}ms (too slow)`);
    }

    console.log('\n📊 Final Results\n');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(50));

    // Generate detailed report
    const report = {
      timestamp: new Date().toISOString(),
      url: BASE_URL,
      summary: {
        passed: results.passed,
        failed: results.failed,
        successRate: ((results.passed / (results.passed + results.failed)) * 100).toFixed(1) + '%'
      },
      tests: results.tests,
      environment: {
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    fs.writeFileSync('final-verification-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: final-verification-report.json');

    if (results.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! SalesSync is ready for production use.');
      console.log(`🌐 Application URL: ${BASE_URL}`);
      console.log('🚀 Features verified:');
      console.log('   • React + Vite application loading');
      console.log('   • PWA functionality with service worker');
      console.log('   • Security headers and HTTPS');
      console.log('   • Asset optimization and caching');
      console.log('   • SPA routing configuration');
      console.log('   • Performance optimization');
    } else {
      console.log(`\n⚠️  ${results.failed} tests failed. Review the issues above.`);
    }

    return results.failed === 0;

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

// Run verification
runVerification().then(success => {
  process.exit(success ? 0 : 1);
});