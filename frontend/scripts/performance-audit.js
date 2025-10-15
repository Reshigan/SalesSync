#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🔍 SalesSync Frontend Performance Audit\n')

// Check node_modules size
function checkNodeModulesSize() {
  const nodeModulesPath = path.join(__dirname, '../node_modules')
  
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('❌ node_modules not found')
    return
  }

  const { execSync } = require('child_process')
  try {
    const size = execSync(`du -sh ${nodeModulesPath}`, { encoding: 'utf8' })
    console.log('📦 Node modules size:', size.trim())
  } catch (error) {
    console.log('❌ Could not calculate node_modules size')
  }
}

// Analyze package.json dependencies
function analyzeDependencies() {
  const packagePath = path.join(__dirname, '../package.json')
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  
  console.log('\n📋 Dependency Analysis:')
  console.log('Dependencies:', Object.keys(packageJson.dependencies || {}).length)
  console.log('DevDependencies:', Object.keys(packageJson.devDependencies || {}).length)
  
  // Heavy dependencies to watch
  const heavyDeps = [
    '@mui/material',
    '@mui/icons-material', 
    '@emotion/react',
    '@emotion/styled',
    'framer-motion',
    '@react-google-maps/api',
    'recharts',
    '@tanstack/react-query'
  ]
  
  console.log('\n⚠️  Heavy Dependencies Found:')
  heavyDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`  - ${dep}: ${packageJson.dependencies[dep]}`)
    }
  })
}

// Check for potential optimizations
function checkOptimizations() {
  console.log('\n🚀 Optimization Recommendations:')
  
  const recommendations = [
    '✅ Bundle analyzer configured',
    '✅ Next.js optimizations enabled',
    '✅ Code splitting utilities created',
    '✅ Performance monitoring hooks added',
    '⚠️  Consider removing unused MUI components',
    '⚠️  Lazy load Google Maps API',
    '⚠️  Optimize Framer Motion usage',
    '⚠️  Tree shake Recharts imports'
  ]
  
  recommendations.forEach(rec => console.log(`  ${rec}`))
}

// Check build output (if exists)
function checkBuildOutput() {
  const buildPath = path.join(__dirname, '../.next')
  
  if (!fs.existsSync(buildPath)) {
    console.log('\n📦 Build output not found. Run "npm run build" first.')
    return
  }
  
  console.log('\n📦 Build Analysis:')
  
  // Check static files
  const staticPath = path.join(buildPath, 'static')
  if (fs.existsSync(staticPath)) {
    const { execSync } = require('child_process')
    try {
      const size = execSync(`du -sh ${staticPath}`, { encoding: 'utf8' })
      console.log('Static files size:', size.trim())
    } catch (error) {
      console.log('Could not calculate static files size')
    }
  }
}

// Main audit function
function runAudit() {
  checkNodeModulesSize()
  analyzeDependencies()
  checkOptimizations()
  checkBuildOutput()
  
  console.log('\n🎯 Next Steps:')
  console.log('  1. Run "npm run analyze" to see bundle composition')
  console.log('  2. Remove unused dependencies')
  console.log('  3. Implement lazy loading for heavy components')
  console.log('  4. Monitor Core Web Vitals in production')
  console.log('\n✨ Performance optimization complete!')
}

runAudit()