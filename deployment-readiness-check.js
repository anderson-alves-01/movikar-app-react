#!/usr/bin/env node

/**
 * Deployment Readiness Check for alugae.mobi
 * This script verifies that the application is ready for deployment
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

console.log('🚀 alugae.mobi Deployment Readiness Check\n');

const checks = [];

// Check 1: Build files exist
console.log('1. Checking build files...');
const buildFiles = [
  'dist/index.js',
  'dist/public/index.html',
  'dist/public/assets'
];

buildFiles.forEach(file => {
  if (existsSync(file)) {
    console.log(`   ✅ ${file} exists`);
    checks.push({ name: `Build file: ${file}`, status: 'pass' });
  } else {
    console.log(`   ❌ ${file} missing`);
    checks.push({ name: `Build file: ${file}`, status: 'fail' });
  }
});

// Check 2: Package.json scripts
console.log('\n2. Checking package.json scripts...');
try {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const requiredScripts = ['dev', 'build', 'start'];
  
  requiredScripts.forEach(script => {
    if (pkg.scripts && pkg.scripts[script]) {
      console.log(`   ✅ Script "${script}" defined`);
      checks.push({ name: `Script: ${script}`, status: 'pass' });
    } else {
      console.log(`   ❌ Script "${script}" missing`);
      checks.push({ name: `Script: ${script}`, status: 'fail' });
    }
  });
} catch (error) {
  console.log(`   ❌ Error reading package.json: ${error.message}`);
  checks.push({ name: 'Package.json validation', status: 'fail' });
}

// Check 3: Environment variables
console.log('\n3. Checking environment variables...');
const requiredEnvVars = ['DATABASE_URL'];
requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`   ✅ ${envVar} is set`);
    checks.push({ name: `Environment: ${envVar}`, status: 'pass' });
  } else {
    console.log(`   ❌ ${envVar} is missing`);
    checks.push({ name: `Environment: ${envVar}`, status: 'fail' });
  }
});

// Check 4: Dependencies
console.log('\n4. Checking dependencies...');
try {
  execSync('npm list --production --depth=0', { stdio: 'pipe' });
  console.log('   ✅ All production dependencies installed');
  checks.push({ name: 'Production dependencies', status: 'pass' });
} catch (error) {
  console.log('   ❌ Dependency issues found');
  checks.push({ name: 'Production dependencies', status: 'fail' });
}

// Check 5: Database connection
console.log('\n5. Checking database connection...');
try {
  // This is a simple check - in production, we'd want more robust testing
  if (process.env.DATABASE_URL) {
    console.log('   ✅ Database URL configured');
    checks.push({ name: 'Database configuration', status: 'pass' });
  } else {
    console.log('   ❌ Database URL not configured');
    checks.push({ name: 'Database configuration', status: 'fail' });
  }
} catch (error) {
  console.log(`   ❌ Database check failed: ${error.message}`);
  checks.push({ name: 'Database configuration', status: 'fail' });
}

// Summary
console.log('\n📊 DEPLOYMENT READINESS SUMMARY');
console.log('='.repeat(50));

const passed = checks.filter(c => c.status === 'pass').length;
const total = checks.length;
const passRate = Math.round((passed / total) * 100);

console.log(`Total checks: ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${total - passed}`);
console.log(`Pass rate: ${passRate}%\n`);

if (passRate >= 90) {
  console.log('🟢 READY FOR DEPLOYMENT');
  console.log('Your application appears ready for deployment to production.');
} else if (passRate >= 70) {
  console.log('🟡 DEPLOYMENT WITH CAUTION');
  console.log('Your application may deploy but some issues should be addressed.');
} else {
  console.log('🔴 NOT READY FOR DEPLOYMENT');
  console.log('Critical issues must be resolved before deployment.');
}

// Failed checks details
const failed = checks.filter(c => c.status === 'fail');
if (failed.length > 0) {
  console.log('\n❌ Failed Checks:');
  failed.forEach(check => {
    console.log(`   • ${check.name}`);
  });
}

console.log('\n✅ Passed Checks:');
checks.filter(c => c.status === 'pass').forEach(check => {
  console.log(`   • ${check.name}`);
});

console.log('\n🔧 Next Steps for Deployment:');
console.log('1. Ensure all checks pass');
console.log('2. Test health endpoints (/health, /api/health, /api/ready)');
console.log('3. Verify static file serving works in production');
console.log('4. Deploy to production environment');
console.log('5. Monitor deployment logs and health checks');

process.exit(passRate >= 90 ? 0 : 1);