#!/usr/bin/env node

/**
 * Comprehensive Payment Intent Creation Test Suite
 * 
 * This test suite validates that all the edge cases and error scenarios
 * that were causing 500 errors are now properly handled with appropriate
 * error messages and status codes.
 */

const BASE_URL = "http://localhost:5000";

async function testPaymentIntentCreation() {
  console.log('🧪 Comprehensive Payment Intent Test Suite Starting...\n');

  // Get authentication token
  console.log('1. 🔐 Authenticating admin user...');
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@alugae.mobi',
      password: 'admin123'
    }),
  });

  if (!loginResponse.ok) {
    console.log('❌ Authentication failed');
    return;
  }

  const loginData = await loginResponse.json();
  const cookies = loginResponse.headers.get('set-cookie');
  console.log('✅ Authentication successful');

  // Test 1: Missing required fields (should return 400)
  console.log('\n2. 🧪 Test Case 1: Missing required fields');
  await testPaymentIntent({
    vehicleId: null,
    startDate: '2025-09-01',
    endDate: '2025-09-05',
    totalPrice: '100.00'
  }, cookies, 'Missing vehicleId', 400);

  // Test 2: Invalid vehicle ID (should return 400)
  console.log('\n3. 🧪 Test Case 2: Invalid vehicle ID');
  await testPaymentIntent({
    vehicleId: -1,
    startDate: '2025-09-01',
    endDate: '2025-09-05',
    totalPrice: '100.00'
  }, cookies, 'Invalid vehicle ID', 400);

  // Test 3: Invalid date format (should return 400)
  console.log('\n4. 🧪 Test Case 3: Invalid date format');
  await testPaymentIntent({
    vehicleId: 45,
    startDate: 'invalid-date',
    endDate: '2025-09-05',
    totalPrice: '100.00'
  }, cookies, 'Invalid date format', 400);

  // Test 4: Invalid date range (end before start) (should return 400)
  console.log('\n5. 🧪 Test Case 4: Invalid date range');
  await testPaymentIntent({
    vehicleId: 45,
    startDate: '2025-09-05',
    endDate: '2025-09-01',
    totalPrice: '100.00'
  }, cookies, 'End date before start date', 400);

  // Test 5: Invalid price (should return 400)
  console.log('\n6. 🧪 Test Case 5: Invalid price');
  await testPaymentIntent({
    vehicleId: 45,
    startDate: '2025-09-01',
    endDate: '2025-09-05',
    totalPrice: 'invalid-price'
  }, cookies, 'Invalid price format', 400);

  // Test 6: Non-existent vehicle (should return 404)
  console.log('\n7. 🧪 Test Case 6: Non-existent vehicle');
  await testPaymentIntent({
    vehicleId: 999999,
    startDate: '2025-09-01',
    endDate: '2025-09-05',
    totalPrice: '100.00'
  }, cookies, 'Vehicle not found', 404);

  // Test 7: Vehicle unavailable dates (should return 400)
  console.log('\n8. 🧪 Test Case 7: Vehicle unavailable dates');
  await testPaymentIntent({
    vehicleId: 45,
    startDate: '2025-08-15',  // Dates likely to have conflicts
    endDate: '2025-08-20',
    totalPrice: '100.00'
  }, cookies, 'Vehicle unavailable', 400);

  // Test 8: Valid request (should return 200)
  console.log('\n9. 🧪 Test Case 8: Valid payment intent creation');
  await testPaymentIntent({
    vehicleId: 45,
    startDate: '2025-10-01',  // Dates far in future
    endDate: '2025-10-05',
    totalPrice: '500.00'
  }, cookies, 'Valid request', 200);

  // Test 9: Extremely high price (should return 400)
  console.log('\n10. 🧪 Test Case 9: Extremely high price');
  await testPaymentIntent({
    vehicleId: 45,
    startDate: '2025-10-01',
    endDate: '2025-10-05',
    totalPrice: '9999999.00'
  }, cookies, 'Price too high', 400);

  // Test 10: Zero price (should return 400)
  console.log('\n11. 🧪 Test Case 10: Zero price');
  await testPaymentIntent({
    vehicleId: 45,
    startDate: '2025-10-01',
    endDate: '2025-10-05',
    totalPrice: '0.00'
  }, cookies, 'Zero price', 400);

  console.log('\n🎉 Comprehensive test suite completed!');
}

async function testPaymentIntent(data, cookies, testName, expectedStatus) {
  try {
    const response = await fetch(`${BASE_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || '',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    console.log(`   📊 ${testName}:`);
    console.log(`   Expected: ${expectedStatus}, Got: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(result).substring(0, 100)}...`);
    
    if (response.status === expectedStatus) {
      console.log(`   ✅ PASS: Correct status code and error handling`);
    } else {
      console.log(`   ❌ FAIL: Expected ${expectedStatus}, got ${response.status}`);
    }

    // Validate response structure
    if (response.status === 200) {
      if (result.clientSecret && result.paymentIntentId) {
        console.log(`   ✅ PASS: Valid payment intent response structure`);
      } else {
        console.log(`   ❌ FAIL: Missing clientSecret or paymentIntentId`);
      }
    } else {
      if (result.message) {
        console.log(`   ✅ PASS: Error response includes message`);
      } else {
        console.log(`   ❌ FAIL: Error response missing message`);
      }
    }

  } catch (error) {
    console.log(`   ❌ FAIL: Network or parsing error: ${error.message}`);
  }
}

// Run the test suite
testPaymentIntentCreation().catch(console.error);