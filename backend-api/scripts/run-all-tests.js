#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      unit: { passed: false, duration: 0, coverage: 0 },
      integration: { passed: false, duration: 0 },
      performance: { passed: false, duration: 0 },
      e2e: { passed: false, duration: 0 }
    };
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      console.log(`\n🚀 Running: ${command} ${args.join(' ')}`);
      const startTime = Date.now();
      
      const child = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        ...options
      });

      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        if (code === 0) {
          console.log(`✅ Command completed successfully in ${duration}ms`);
          resolve({ success: true, duration, code });
        } else {
          console.log(`❌ Command failed with code ${code} after ${duration}ms`);
          resolve({ success: false, duration, code });
        }
      });

      child.on('error', (error) => {
        console.error(`❌ Command error:`, error);
        reject(error);
      });
    });
  }

  async runUnitTests() {
    console.log('\n📋 Running Unit Tests...');
    const result = await this.runCommand('npm', ['run', 'test:coverage']);
    this.results.unit.passed = result.success;
    this.results.unit.duration = result.duration;
    return result.success;
  }

  async runIntegrationTests() {
    console.log('\n🔗 Running Integration Tests...');
    const result = await this.runCommand('npm', ['run', 'test:integration']);
    this.results.integration.passed = result.success;
    this.results.integration.duration = result.duration;
    return result.success;
  }

  async runPerformanceTests() {
    console.log('\n⚡ Running Performance Tests...');
    const result = await this.runCommand('npm', ['run', 'test:performance']);
    this.results.performance.passed = result.success;
    this.results.performance.duration = result.duration;
    return result.success;
  }

  async runE2ETests() {
    console.log('\n🌐 Running E2E Tests...');
    
    // Install Playwright browsers if needed
    console.log('📦 Installing Playwright browsers...');
    await this.runCommand('npx', ['playwright', 'install']);
    
    const result = await this.runCommand('npm', ['run', 'test:e2e']);
    this.results.e2e.passed = result.success;
    this.results.e2e.duration = result.duration;
    return result.success;
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST EXECUTION SUMMARY');
    console.log('='.repeat(60));
    
    const totalDuration = Object.values(this.results).reduce((sum, result) => sum + result.duration, 0);
    const passedTests = Object.values(this.results).filter(result => result.passed).length;
    const totalTests = Object.keys(this.results).length;
    
    console.log(`\n⏱️  Total Execution Time: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`📈 Overall Success Rate: ${passedTests}/${totalTests} (${((passedTests/totalTests) * 100).toFixed(1)}%)`);
    
    console.log('\n📋 Detailed Results:');
    Object.entries(this.results).forEach(([testType, result]) => {
      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      const duration = (result.duration / 1000).toFixed(2);
      console.log(`  ${testType.toUpperCase().padEnd(12)} ${status} (${duration}s)`);
    });

    if (passedTests === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! System is ready for production deployment.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review and fix issues before deployment.');
    }
    
    console.log('='.repeat(60));
  }

  async runAll() {
    console.log('🚀 Starting Comprehensive Test Suite for SalesSync');
    console.log('This will run Unit, Integration, Performance, and E2E tests');
    
    const startTime = Date.now();
    
    try {
      // Run tests in sequence for better resource management
      await this.runUnitTests();
      await this.runIntegrationTests();
      await this.runPerformanceTests();
      await this.runE2ETests();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`\n⏱️  Total test suite execution time: ${(totalTime / 1000).toFixed(2)}s`);
    
    this.printSummary();
    
    // Exit with appropriate code
    const allPassed = Object.values(this.results).every(result => result.passed);
    process.exit(allPassed ? 0 : 1);
  }

  async runCI() {
    console.log('🤖 Running CI Test Suite (Unit + Integration + E2E)');
    
    try {
      const unitPassed = await this.runUnitTests();
      const integrationPassed = await this.runIntegrationTests();
      const e2ePassed = await this.runE2ETests();
      
      this.printSummary();
      
      const allPassed = unitPassed && integrationPassed && e2ePassed;
      process.exit(allPassed ? 0 : 1);
      
    } catch (error) {
      console.error('❌ CI test execution failed:', error);
      process.exit(1);
    }
  }
}

// Command line interface
const args = process.argv.slice(2);
const runner = new TestRunner();

if (args.includes('--ci')) {
  runner.runCI();
} else if (args.includes('--unit')) {
  runner.runUnitTests().then(passed => process.exit(passed ? 0 : 1));
} else if (args.includes('--integration')) {
  runner.runIntegrationTests().then(passed => process.exit(passed ? 0 : 1));
} else if (args.includes('--performance')) {
  runner.runPerformanceTests().then(passed => process.exit(passed ? 0 : 1));
} else if (args.includes('--e2e')) {
  runner.runE2ETests().then(passed => process.exit(passed ? 0 : 1));
} else {
  runner.runAll();
}