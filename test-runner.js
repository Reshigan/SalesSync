#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 SalesSync Full Stack Test Runner\n');

class TestRunner {
  constructor() {
    this.processes = [];
  }

  async startServices() {
    console.log('📦 Starting services...');
    
    // Start backend
    console.log('🔧 Starting backend...');
    const backend = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'pipe'
    });
    
    this.processes.push(backend);

    // Start frontend
    console.log('🌐 Starting frontend...');
    const frontend = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'frontend'),
      stdio: 'pipe'
    });
    
    this.processes.push(frontend);

    // Wait for services to start
    console.log('⏳ Waiting for services to initialize...');
    await new Promise(resolve => setTimeout(resolve, 15000));
  }

  async runTests() {
    console.log('🧪 Running integration tests...');
    
    const IntegrationTester = require('./final-integration-test.js');
    const tester = new IntegrationTester();
    await tester.runAllTests();
  }

  cleanup() {
    console.log('\n🧹 Cleaning up processes...');
    this.processes.forEach(proc => {
      if (proc && !proc.killed) {
        proc.kill('SIGTERM');
      }
    });
  }

  async run() {
    try {
      await this.startServices();
      await this.runTests();
    } catch (error) {
      console.error('Test runner error:', error);
    } finally {
      this.cleanup();
    }
  }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, cleaning up...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, cleaning up...');
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.run();
}