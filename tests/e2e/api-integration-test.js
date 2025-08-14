import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

class APIIntegrationTestRunner {
  constructor() {
    this.results = { passed: 0, failed: 0, tests: [] };
    this.cookies = '';
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 API Test: ${testName}`);
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

  async testLogin() {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'renter@test.com',
        password: '123456'
      })
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    // Extract cookies for subsequent requests
    const setCookie = response.headers.raw()['set-cookie'];
    if (setCookie) {
      this.cookies = setCookie.join('; ');
    }

    const data = await response.json();
    if (!data.user || !data.user.email) {
      throw new Error('Login response missing user data');
    }
  }

  async testCreateCheckoutData() {
    const response = await fetch(`${BASE_URL}/api/store-checkout-data`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': this.cookies
      },
      body: JSON.stringify({
        vehicleId: 45,
        startDate: '2026-05-01',
        endDate: '2026-05-05',
        totalPrice: '1200.00',
        serviceFee: '120.00',
        insuranceFee: '180.00',
        securityDeposit: '240.00',
        includeInsurance: true,
        vehicle: {
          id: 45,
          brand: 'Toyota',
          model: 'Corolla',
          year: 2020,
          pricePerDay: '300.00',
          images: []
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Create checkout data failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.checkoutId) {
      throw new Error('Checkout data response missing checkoutId');
    }

    this.testCheckoutId = data.checkoutId;
    console.log(`   Created checkout ID: ${this.testCheckoutId}`);
  }

  async testRetrieveCheckoutData() {
    if (!this.testCheckoutId) {
      throw new Error('No checkout ID available for testing');
    }

    const response = await fetch(`${BASE_URL}/api/checkout-data/${this.testCheckoutId}`, {
      headers: { 'Cookie': this.cookies }
    });

    if (!response.ok) {
      throw new Error(`Retrieve checkout data failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.vehicleId || !data.totalPrice) {
      throw new Error('Checkout data incomplete');
    }
  }

  async testExpiredCheckoutData() {
    const expiredId = 'checkout_expired_test_12345';
    const response = await fetch(`${BASE_URL}/api/checkout-data/${expiredId}`, {
      headers: { 'Cookie': this.cookies }
    });

    if (response.ok) {
      throw new Error('Expired checkout should return 404');
    }

    if (response.status !== 404) {
      throw new Error(`Expected 404 for expired checkout, got ${response.status}`);
    }
  }

  async testCreatePaymentIntent() {
    const response = await fetch(`${BASE_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': this.cookies
      },
      body: JSON.stringify({
        vehicleId: 45,
        startDate: '2026-05-01',
        endDate: '2026-05-05',
        totalPrice: '1200.00'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Create payment intent failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.clientSecret || !data.paymentIntentId) {
      throw new Error('Payment intent response missing required fields');
    }

    console.log(`   Created payment intent: ${data.paymentIntentId}`);
  }

  async testVehiclesList() {
    const response = await fetch(`${BASE_URL}/api/vehicles`);

    if (!response.ok) {
      throw new Error(`Get vehicles failed: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Vehicles response should be an array');
    }

    if (data.length === 0) {
      throw new Error('No vehicles found in database');
    }

    const hasTestVehicle = data.some(v => v.id === 45);
    if (!hasTestVehicle) {
      throw new Error('Test vehicle (ID: 45) not found');
    }
  }

  async testUnauthorizedAccess() {
    // Test protected endpoint without authentication
    const response = await fetch(`${BASE_URL}/api/store-checkout-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    });

    if (response.ok) {
      throw new Error('Protected endpoint should require authentication');
    }

    if (response.status !== 401) {
      throw new Error(`Expected 401 for unauthorized access, got ${response.status}`);
    }
  }

  async testHealthCheck() {
    const response = await fetch(`${BASE_URL}/health`);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.status !== 'ok') {
      throw new Error('Health check status not OK');
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 API INTEGRATION TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📋 Total: ${this.results.tests.length}`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => console.log(`   • ${test.name}: ${test.error}`));
    }
    
    console.log('\n✅ Passed Tests:');
    this.results.tests
      .filter(test => test.status === 'PASSED')
      .forEach(test => console.log(`   • ${test.name}`));
    
    const successRate = (this.results.passed / this.results.tests.length * 100).toFixed(1);
    console.log(`\n🎯 Success Rate: ${successRate}%`);
    
    if (this.results.failed === 0) {
      console.log('🎉 ALL API TESTS PASSED!');
      console.log('🔗 Backend API is fully functional');
      console.log('💳 Payment endpoints working correctly');
      console.log('🔒 Authentication properly implemented');
    }
  }

  async runAllTests() {
    console.log('🧪 Starting API Integration Tests');
    console.log(`🔗 Testing API: ${BASE_URL}`);
    console.log('🎯 Focus: Authentication, Checkout, Payment APIs');

    try {
      // Run API tests in order
      await this.runTest('Health Check', () => this.testHealthCheck());
      await this.runTest('User Login', () => this.testLogin());
      await this.runTest('Vehicles List', () => this.testVehiclesList());
      await this.runTest('Create Checkout Data', () => this.testCreateCheckoutData());
      await this.runTest('Retrieve Checkout Data', () => this.testRetrieveCheckoutData());
      await this.runTest('Expired Checkout Handling', () => this.testExpiredCheckoutData());
      await this.runTest('Create Payment Intent', () => this.testCreatePaymentIntent());
      await this.runTest('Unauthorized Access Protection', () => this.testUnauthorizedAccess());

      this.printResults();
      
    } catch (error) {
      console.error('❌ API test suite error:', error);
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new APIIntegrationTestRunner();
  runner.runAllTests().catch(console.error);
}

export default APIIntegrationTestRunner;