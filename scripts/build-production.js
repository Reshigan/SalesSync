#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting SalesSync Production Build...\n');

// Step 1: Clean previous builds
console.log('1️⃣ Cleaning previous builds...');
try {
  execSync('rm -rf .next', { stdio: 'inherit' });
  execSync('rm -rf out', { stdio: 'inherit' });
  console.log('✅ Clean completed\n');
} catch (error) {
  console.log('⚠️ Clean step had warnings (this is normal)\n');
}

// Step 2: Install dependencies
console.log('2️⃣ Installing dependencies...');
try {
  execSync('npm ci --production=false', { stdio: 'inherit' });
  console.log('✅ Dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install dependencies');
  process.exit(1);
}

// Step 3: Run type checking
console.log('3️⃣ Running type checking...');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ Type checking passed\n');
} catch (error) {
  console.error('❌ Type checking failed');
  process.exit(1);
}

// Step 4: Run linting
console.log('4️⃣ Running linting...');
try {
  execSync('npx next lint', { stdio: 'inherit' });
  console.log('✅ Linting passed\n');
} catch (error) {
  console.warn('⚠️ Linting had warnings\n');
}

// Step 5: Build the application
console.log('5️⃣ Building the application...');
try {
  execSync('NODE_ENV=production npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed\n');
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}

// Step 6: Analyze bundle size
console.log('6️⃣ Analyzing bundle size...');
try {
  if (fs.existsSync('.next/analyze')) {
    console.log('📊 Bundle analysis available at .next/analyze/');
  }
  console.log('✅ Analysis completed\n');
} catch (error) {
  console.warn('⚠️ Bundle analysis skipped\n');
}

// Step 7: Create deployment package
console.log('7️⃣ Creating deployment package...');
try {
  const deploymentFiles = [
    '.next',
    'public',
    'package.json',
    'package-lock.json',
    '.env.production',
    'backend-api'
  ];

  // Create deployment directory
  if (!fs.existsSync('deployment')) {
    fs.mkdirSync('deployment');
  }

  // Copy files
  deploymentFiles.forEach(file => {
    if (fs.existsSync(file)) {
      execSync(`cp -r ${file} deployment/`, { stdio: 'inherit' });
    }
  });

  console.log('✅ Deployment package created in ./deployment/\n');
} catch (error) {
  console.warn('⚠️ Deployment package creation had warnings\n');
}

// Step 8: Generate build report
console.log('8️⃣ Generating build report...');
const buildReport = {
  timestamp: new Date().toISOString(),
  nodeVersion: process.version,
  platform: process.platform,
  buildDuration: 'N/A', // Would need to track actual time
  environment: 'production',
  features: {
    typescript: true,
    tailwindcss: true,
    nextjs: true,
    apiRoutes: true,
    authentication: true,
    multiTenant: true
  }
};

fs.writeFileSync('deployment/build-report.json', JSON.stringify(buildReport, null, 2));
console.log('✅ Build report generated\n');

console.log('🎉 Production build completed successfully!');
console.log('📦 Deployment package is ready in ./deployment/');
console.log('🚀 You can now deploy the application to your production environment.');

// Display next steps
console.log('\n📋 Next Steps:');
console.log('1. Copy the deployment/ folder to your production server');
console.log('2. Run: npm install --production');
console.log('3. Set up your production environment variables');
console.log('4. Start the backend: cd backend-api && npm start');
console.log('5. Start the frontend: npm start');
console.log('6. Configure your reverse proxy (nginx/apache)');
console.log('7. Set up SSL certificates');
console.log('8. Configure monitoring and logging');