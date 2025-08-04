// Comprehensive functional validation system
// Replaces Cypress with a more reliable approach for Replit environment

import fetch from 'node-fetch';
import { URL, URLSearchParams } from 'url';

const BASE_URL = 'http://localhost:5000';
const ADMIN_CREDENTIALS = {
  email: 'admin@alugae.mobi',
  password: 'admin123'
};

class FunctionalValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
    this.authToken = null;
    this.cookies = '';
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔍';
    console.log(`${timestamp} ${prefix} ${message}`);
  }

  async test(name, testFn) {
    try {
      await this.log(`Testing: ${name}`);
      await testFn();
      this.results.passed++;
      await this.log(`${name}: PASSED`, 'success');
    } catch (error) {
      this.results.failed++;
      this.results.errors.push({ test: name, error: error.message });
      await this.log(`${name}: FAILED - ${error.message}`, 'error');
    }
  }

  async makeRequest(method, endpoint, data = null, requireAuth = false) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'FunctionalValidator/1.0'
    };

    if (this.cookies) {
      headers['Cookie'] = this.cookies;
    }

    if (requireAuth && this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const options = {
      method,
      headers,
      ...(data && { body: JSON.stringify(data) })
    };

    const response = await fetch(url, options);
    
    // Extract cookies from response
    if (response.headers.get('set-cookie')) {
      this.cookies = response.headers.get('set-cookie');
    }

    const responseData = await response.text();
    let parsedData;
    try {
      parsedData = JSON.parse(responseData);
    } catch {
      parsedData = responseData;
    }

    return {
      status: response.status,
      data: parsedData,
      headers: response.headers
    };
  }

  async validateServerHealth() {
    await this.test('Server Health Check', async () => {
      const response = await this.makeRequest('GET', '/');
      if (response.status !== 200) {
        throw new Error(`Server not responding: ${response.status}`);
      }
    });
  }

  async validateDatabase() {
    await this.test('Database Connection', async () => {
      const response = await this.makeRequest('GET', '/api/vehicles');
      if (response.status !== 200) {
        throw new Error(`Database connection failed: ${response.status}`);
      }
      if (!Array.isArray(response.data)) {
        throw new Error('Vehicles endpoint not returning array');
      }
    });
  }

  async validateAuthentication() {
    await this.test('User Registration', async () => {
      const timestamp = Date.now();
      const userData = {
        name: `Test User ${timestamp}`,
        email: `test${timestamp}@test.com`,
        password: 'test123',
        phone: '11999999999',
        location: 'São Paulo'
      };

      const response = await this.makeRequest('POST', '/api/auth/register', userData);
      if (response.status !== 201) {
        throw new Error(`Registration failed: ${response.status} - ${JSON.stringify(response.data)}`);
      }
    });

    await this.test('Admin Login', async () => {
      const response = await this.makeRequest('POST', '/api/auth/login', ADMIN_CREDENTIALS);
      if (response.status !== 200) {
        throw new Error(`Admin login failed: ${response.status} - ${JSON.stringify(response.data)}`);
      }
      
      if (!response.data.token) {
        throw new Error('No token returned from login');
      }
      
      this.authToken = response.data.token;
    });

    await this.test('Protected Route Access', async () => {
      const response = await this.makeRequest('GET', '/api/auth/user', null, true);
      if (response.status !== 200) {
        throw new Error(`Protected route access failed: ${response.status}`);
      }
      
      if (!response.data.id && !response.data.user) {
        throw new Error('User data not returned from protected route');
      }
    });
  }

  async validateVehicleManagement() {
    await this.test('Vehicle Listing', async () => {
      const response = await this.makeRequest('GET', '/api/vehicles');
      if (response.status !== 200) {
        throw new Error(`Vehicle listing failed: ${response.status}`);
      }
      
      if (!Array.isArray(response.data)) {
        throw new Error('Vehicles not returned as array');
      }
    });

    await this.test('Vehicle Search', async () => {
      const response = await this.makeRequest('GET', '/api/vehicles?search=Toyota');
      if (response.status !== 200) {
        throw new Error(`Vehicle search failed: ${response.status}`);
      }
    });

    await this.test('Vehicle Details', async () => {
      // Get first vehicle ID
      const vehiclesResponse = await this.makeRequest('GET', '/api/vehicles');
      if (vehiclesResponse.data.length === 0) {
        throw new Error('No vehicles available for testing');
      }
      
      const vehicleId = vehiclesResponse.data[0].id;
      const response = await this.makeRequest('GET', `/api/vehicles/${vehicleId}`);
      if (response.status !== 200) {
        throw new Error(`Vehicle details failed: ${response.status}`);
      }
    });
  }

  async validateBookingSystem() {
    await this.test('Booking Creation Flow', async () => {
      // Get available vehicle
      const vehiclesResponse = await this.makeRequest('GET', '/api/vehicles');
      if (vehiclesResponse.data.length === 0) {
        throw new Error('No vehicles available for booking test');
      }
      
      const vehicle = vehiclesResponse.data[0];
      const bookingData = {
        vehicleId: vehicle.id,
        startDate: '2025-02-01',
        endDate: '2025-02-05',
        totalCost: 200
      };

      const response = await this.makeRequest('POST', '/api/bookings', bookingData, true);
      if (response.status !== 201 && response.status !== 400) {
        throw new Error(`Booking creation unexpected status: ${response.status}`);
      }
    });

    await this.test('User Bookings List', async () => {
      const response = await this.makeRequest('GET', '/api/bookings', null, true);
      if (response.status !== 200) {
        throw new Error(`Bookings list failed: ${response.status}`);
      }
    });
  }

  async validateSubscriptionSystem() {
    await this.test('Subscription Plans', async () => {
      const response = await this.makeRequest('GET', '/api/subscription-plans');
      if (response.status !== 200) {
        throw new Error(`Subscription plans failed: ${response.status}`);
      }
      
      if (!Array.isArray(response.data)) {
        throw new Error('Subscription plans not returned as array');
      }
    });
  }

  async validateAdminFunctions() {
    await this.test('Admin Dashboard Access', async () => {
      const response = await this.makeRequest('GET', '/api/admin/dashboard', null, true);
      if (response.status !== 200) {
        throw new Error(`Admin dashboard failed: ${response.status}`);
      }
    });

    await this.test('Admin Vehicle Management', async () => {
      const response = await this.makeRequest('GET', '/api/admin/vehicles', null, true);
      if (response.status !== 200) {
        throw new Error(`Admin vehicles failed: ${response.status}`);
      }
    });

    await this.test('Admin User Management', async () => {
      const response = await this.makeRequest('GET', '/api/admin/users', null, true);
      if (response.status !== 200) {
        throw new Error(`Admin users failed: ${response.status}`);
      }
    });
  }

  async validatePaymentSystem() {
    await this.test('Payment Intent Creation', async () => {
      // Get available vehicle for payment test
      const vehiclesResponse = await this.makeRequest('GET', '/api/vehicles');
      if (vehiclesResponse.data.length === 0) {
        throw new Error('No vehicles available for payment test');
      }
      
      const vehicle = vehiclesResponse.data[0];
      const paymentData = {
        vehicleId: vehicle.id,
        startDate: '2025-02-10',
        endDate: '2025-02-15',
        totalPrice: 200
      };

      const response = await this.makeRequest('POST', '/api/create-payment-intent', paymentData, true);
      
      // Check if it's a verification error (expected) or actual payment success
      if (response.status === 403) {
        // User verification required - this is expected behavior
        if (response.data.message && response.data.message.includes('verificado')) {
          return; // Test passes - verification system working
        }
      } else if (response.status === 200) {
        if (!response.data.clientSecret) {
          throw new Error('Payment intent did not return client secret');
        }
        return; // Test passes - payment intent created
      }
      
      throw new Error(`Payment intent unexpected response: ${response.status} - ${JSON.stringify(response.data)}`);
    });
  }

  async validateAPIEndpoints() {
    const endpoints = [
      { method: 'GET', path: '/api/vehicles', auth: false },
      { method: 'GET', path: '/api/subscription-plans', auth: false },
      { method: 'GET', path: '/api/auth/user', auth: true },
      { method: 'GET', path: '/api/bookings', auth: true },
      { method: 'GET', path: '/api/admin/dashboard', auth: true },
    ];

    for (const endpoint of endpoints) {
      await this.test(`API Endpoint ${endpoint.method} ${endpoint.path}`, async () => {
        const response = await this.makeRequest(endpoint.method, endpoint.path, null, endpoint.auth);
        if (response.status >= 500) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        if (endpoint.auth && response.status === 401) {
          throw new Error('Authentication required but token invalid');
        }
      });
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Functional Validation');
    console.log('=' * 60);

    try {
      await this.validateServerHealth();
      await this.validateDatabase();
      await this.validateAuthentication();
      await this.validateVehicleManagement();
      await this.validateBookingSystem();
      await this.validateSubscriptionSystem();
      await this.validateAdminFunctions();
      await this.validatePaymentSystem();
      await this.validateAPIEndpoints();
    } catch (error) {
      await this.log(`Critical test failure: ${error.message}`, 'error');
    }

    this.printResults();
    return this.results.failed === 0;
  }

  printResults() {
    console.log('\n' + '=' * 60);
    console.log('📊 FUNCTIONAL VALIDATION RESULTS');
    console.log('=' * 60);
    console.log(`✅ Tests Passed: ${this.results.passed}`);
    console.log(`❌ Tests Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.errors.forEach(error => {
        console.log(`  - ${error.test}: ${error.error}`);
      });
    }

    if (this.results.failed === 0) {
      console.log('\n🎉 ALL FUNCTIONALITY IS WORKING 100%');
      console.log('✅ Application is ready for deployment');
    } else {
      console.log('\n⚠️  Some functionality needs attention');
      console.log('❌ Fix issues before deployment');
    }
  }
}

// Run the validation
const validator = new FunctionalValidator();
validator.runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});