// Master test runner - executes all validation tests
// Provides comprehensive coverage without Cypress

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TestRunner {
  constructor() {
    this.results = [];
  }

  async runTest(name, scriptPath) {
    return new Promise((resolve) => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🧪 RUNNING: ${name}`);
      console.log(`${'='.repeat(60)}`);

      const testProcess = spawn('node', [scriptPath], {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      testProcess.on('close', (code) => {
        const success = code === 0;
        this.results.push({ name, success, exitCode: code });
        
        console.log(`\n📊 ${name}: ${success ? '✅ PASSED' : '❌ FAILED'} (exit code: ${code})`);
        resolve(success);
      });

      testProcess.on('error', (error) => {
        console.error(`❌ Error running ${name}:`, error);
        this.results.push({ name, success: false, error: error.message });
        resolve(false);
      });
    });
  }

  async waitForServer() {
    console.log('⏳ Waiting for server to be ready...');
    
    const maxAttempts = 30;
    const interval = 2000;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch('http://localhost:5000/api/vehicles');
        
        if (response.status === 200) {
          console.log('✅ Server is ready');
          return true;
        }
      } catch (error) {
        console.log(`⏳ Attempt ${attempt}/${maxAttempts}: Server not ready yet...`);
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error('Server failed to start within timeout period');
  }

  printFinalResults() {
    console.log('\n' + '='.repeat(80));
    console.log('🏁 FINAL TEST RESULTS');
    console.log('='.repeat(80));

    const passed = this.results.filter(r => r.success).length;
    const total = this.results.length;
    const successRate = Math.round((passed / total) * 100);

    console.log(`📊 Overall Results: ${passed}/${total} tests passed (${successRate}%)`);
    console.log('');

    this.results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const details = result.exitCode !== undefined ? `(code: ${result.exitCode})` : '';
      console.log(`  ${status} ${result.name} ${details}`);
    });

    console.log('\n' + '='.repeat(80));

    if (passed === total) {
      console.log('🎉 ALL TESTS PASSED - APPLICATION IS 100% FUNCTIONAL');
      console.log('✅ Ready for deployment');
    } else {
      console.log('⚠️  SOME TESTS FAILED - REVIEW ISSUES BEFORE DEPLOYMENT');
      console.log('❌ Fix failing functionality');
    }

    console.log('='.repeat(80));
    return passed === total;
  }

  async runAllTests() {
    try {
      console.log('🚀 COMPREHENSIVE APPLICATION TESTING');
      console.log('Replacing Cypress with reliable functional validation');
      
      // Wait for server to be ready
      await this.waitForServer();

      // Run all test suites
      const tests = [
        {
          name: 'Functional Validation',
          script: join(__dirname, 'functional-validator.js')
        },
        {
          name: 'Integration Tests',
          script: join(__dirname, 'integration-tests.js')
        }
      ];

      for (const test of tests) {
        await this.runTest(test.name, test.script);
        
        // Wait between tests to avoid conflicts
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      return this.printFinalResults();

    } catch (error) {
      console.error('❌ Test runner failed:', error);
      return false;
    }
  }
}

// Run all tests
const runner = new TestRunner();
runner.runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});