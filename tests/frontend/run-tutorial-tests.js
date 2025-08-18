#!/usr/bin/env node

/**
 * Script to run tutorial tests with proper setup
 */

const { spawn } = require('child_process');
const path = require('path');

// Test configurations
const testConfigs = {
  unit: {
    command: 'npx',
    args: ['vitest', 'run', 'tests/frontend/tutorial-unit.test.js'],
    description: 'Running unit tests for tutorial components...'
  },
  integration: {
    command: 'npx',
    args: ['playwright', 'test', 'tests/frontend/tutorial-integration.test.js'],
    description: 'Running integration tests for tutorial flow...'
  },
  e2e: {
    command: 'npx', 
    args: ['playwright', 'test', 'tests/frontend/tutorial.test.js'],
    description: 'Running end-to-end tests for tutorial functionality...'
  }
};

async function runTests(testType = 'all') {
  const types = testType === 'all' ? Object.keys(testConfigs) : [testType];
  
  for (const type of types) {
    const config = testConfigs[type];
    if (!config) {
      console.error(`Unknown test type: ${type}`);
      continue;
    }

    console.log(`\n🧪 ${config.description}`);
    
    try {
      await new Promise((resolve, reject) => {
        const child = spawn(config.command, config.args, {
          stdio: 'inherit',
          shell: process.platform === 'win32'
        });

        child.on('close', (code) => {
          if (code === 0) {
            console.log(`✅ ${type} tests passed`);
            resolve();
          } else {
            console.log(`❌ ${type} tests failed with code ${code}`);
            reject(new Error(`Tests failed with code ${code}`));
          }
        });

        child.on('error', (error) => {
          console.error(`Failed to start ${type} tests:`, error);
          reject(error);
        });
      });
    } catch (error) {
      console.error(`❌ ${type} tests failed:`, error.message);
      process.exit(1);
    }
  }

  console.log('\n🎉 All tutorial tests completed successfully!');
}

// Parse command line arguments
const testType = process.argv[2] || 'all';

// Validate test type
const validTypes = ['all', ...Object.keys(testConfigs)];
if (!validTypes.includes(testType)) {
  console.error(`Invalid test type: ${testType}`);
  console.error(`Valid types: ${validTypes.join(', ')}`);
  process.exit(1);
}

// Run tests
runTests(testType).catch((error) => {
  console.error('Test execution failed:', error);
  process.exit(1);
});