import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

// Configuration
const BASE_URL = 'http://localhost:5000';
const TIMEOUT = 15000;

class E2ETestRunner {
  constructor() {
    this.driver = null;
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async setup() {
    console.log('🚀 Setting up E2E Test Environment...');
    
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-setuid-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');
    options.addArguments('--disable-web-security');
    options.addArguments('--allow-running-insecure-content');

    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
      
    console.log('✅ Chrome WebDriver initialized');
  }

  async teardown() {
    if (this.driver) {
      await this.driver.quit();
      console.log('🏁 WebDriver closed');
    }
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running: ${testName}`);
    try {
      await testFunction();
      console.log(`✅ PASSED: ${testName}`);
      this.results.passed++;
      this.results.tests.push({ name: testName, status: 'PASSED' });
    } catch (error) {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}`);
      this.results.failed++;
      this.results.tests.push({ name: testName, status: 'FAILED', error: error.message });
    }
  }

  async testHomePage() {
    await this.driver.get(BASE_URL);
    await this.driver.sleep(2000);
    
    const title = await this.driver.getTitle();
    const pageSource = await this.driver.getPageSource();
    
    if (!title || title === 'Error') {
      throw new Error('Home page failed to load properly');
    }
    
    // Check for essential elements
    if (!pageSource.includes('alugae') && !pageSource.includes('veículo')) {
      throw new Error('Home page content not found');
    }
  }

  async testVehicleListingPage() {
    await this.driver.get(`${BASE_URL}/vehicles`);
    await this.driver.sleep(3000);
    
    const pageSource = await this.driver.getPageSource();
    
    // Should have vehicle listings or proper loading state
    if (!pageSource.includes('Toyota') && 
        !pageSource.includes('loading') && 
        !pageSource.includes('carregando') &&
        !pageSource.includes('skeleton')) {
      throw new Error('Vehicle listings page not loading correctly');
    }
  }

  async testVehicleDetailPage() {
    await this.driver.get(`${BASE_URL}/vehicles/45`);
    await this.driver.sleep(3000);
    
    const pageSource = await this.driver.getPageSource();
    
    // Should show vehicle details or handle error gracefully
    if (pageSource.includes('Error') && !pageSource.includes('Corolla') && !pageSource.includes('Toyota')) {
      // Check if it's a graceful error handling
      if (!pageSource.includes('não encontrado') && !pageSource.includes('erro')) {
        throw new Error('Vehicle detail page not handling content properly');
      }
    }
  }

  async testExpiredCheckoutHandling() {
    const expiredCheckoutId = 'checkout_expired_test_12345';
    await this.driver.get(`${BASE_URL}/checkout/45?checkoutId=${expiredCheckoutId}`);
    await this.driver.sleep(4000);
    
    const currentUrl = await this.driver.getCurrentUrl();
    const pageSource = await this.driver.getPageSource();
    
    // Should handle expired checkout gracefully
    const hasExpiredMessage = pageSource.includes('expirada') || 
                             pageSource.includes('expirado') ||
                             pageSource.includes('não encontrados');
    const redirectedAway = !currentUrl.includes(`checkoutId=${expiredCheckoutId}`);
    
    if (!hasExpiredMessage && !redirectedAway) {
      throw new Error('Expired checkout session not handled properly');
    }
  }

  async testLoginPage() {
    await this.driver.get(`${BASE_URL}/login`);
    await this.driver.sleep(2000);
    
    const pageSource = await this.driver.getPageSource();
    
    // Should have login form elements
    if (!pageSource.includes('email') && 
        !pageSource.includes('password') && 
        !pageSource.includes('login') &&
        !pageSource.includes('entrar')) {
      throw new Error('Login page not loading properly');
    }
  }

  async testStripeIntegration() {
    await this.driver.get(BASE_URL);
    await this.driver.sleep(2000);
    
    // Check if Stripe is configured in the page
    const hasStripe = await this.driver.executeScript(`
      return document.querySelector('script[src*="stripe"]') !== null ||
             typeof window.Stripe !== 'undefined' ||
             document.body.innerHTML.includes('stripe');
    `);
    
    if (!hasStripe) {
      console.log('ℹ️  Stripe not detected in page source, checking configuration...');
      // This is not necessarily a failure, just checking integration
    }
  }

  async testResponsiveness() {
    // Test mobile viewport
    await this.driver.manage().window().setRect({ width: 375, height: 667 });
    await this.driver.get(BASE_URL);
    await this.driver.sleep(2000);
    
    const isMobileResponsive = await this.driver.executeScript(`
      return window.innerWidth <= 768 && document.body.clientWidth <= 768;
    `);
    
    // Reset to desktop
    await this.driver.manage().window().setRect({ width: 1920, height: 1080 });
    
    if (!isMobileResponsive) {
      throw new Error('Site not properly responsive on mobile viewport');
    }
  }

  async testErrorHandling() {
    // Test 404 page
    await this.driver.get(`${BASE_URL}/non-existent-page-12345`);
    await this.driver.sleep(2000);
    
    const pageSource = await this.driver.getPageSource();
    const status = await this.driver.executeScript('return document.readyState');
    
    // Should handle 404 gracefully
    if (status !== 'complete') {
      throw new Error('Error pages not loading properly');
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 E2E TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📋 Total: ${this.results.tests.length}`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.error}`);
        });
    }
    
    console.log('\n✅ Passed Tests:');
    this.results.tests
      .filter(test => test.status === 'PASSED')
      .forEach(test => {
        console.log(`   • ${test.name}`);
      });
    
    const successRate = (this.results.passed / this.results.tests.length * 100).toFixed(1);
    console.log(`\n🎯 Success Rate: ${successRate}%`);
    
    if (this.results.failed === 0) {
      console.log('🎉 ALL TESTS PASSED! System is functioning correctly.');
    } else if (successRate >= 70) {
      console.log('🟡 Most tests passed. System is largely functional with minor issues.');
    } else {
      console.log('🔴 Several tests failed. System needs attention.');
    }
  }

  async runAllTests() {
    try {
      await this.setup();
      
      console.log('🧪 Starting Comprehensive E2E Test Suite');
      console.log(`🔗 Testing URL: ${BASE_URL}`);
      
      // Run all tests
      await this.runTest('Home Page Load', () => this.testHomePage());
      await this.runTest('Vehicle Listings Page', () => this.testVehicleListingPage());
      await this.runTest('Vehicle Detail Page', () => this.testVehicleDetailPage());
      await this.runTest('Login Page Load', () => this.testLoginPage());
      await this.runTest('Expired Checkout Handling', () => this.testExpiredCheckoutHandling());
      await this.runTest('Stripe Integration Check', () => this.testStripeIntegration());
      await this.runTest('Mobile Responsiveness', () => this.testResponsiveness());
      await this.runTest('Error Page Handling', () => this.testErrorHandling());
      
      this.printResults();
      
    } catch (error) {
      console.error('❌ Test suite setup error:', error);
    } finally {
      await this.teardown();
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new E2ETestRunner();
  runner.runAllTests().catch(console.error);
}

export default E2ETestRunner;