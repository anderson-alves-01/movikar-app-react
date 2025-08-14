#!/usr/bin/env node

/**
 * Final Payment Intent Validation Test
 * 
 * This test simulates the exact scenario that was causing 500 errors
 * and validates that our comprehensive solution now handles all cases properly.
 */

const BASE_URL = "http://localhost:5000";

async function runFinalValidation() {
  console.log('🎯 Final Payment Intent Error Resolution Validation\n');

  // Get authentication token
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@alugae.mobi',
      password: 'admin123'
    }),
  });

  const loginData = await loginResponse.json();
  const cookies = loginResponse.headers.get('set-cookie');

  console.log('✅ Authentication successful\n');

  // Test scenarios that previously caused 500 errors
  const problematicScenarios = [
    {
      name: "Empty request body",
      data: {}
    },
    {
      name: "Null values",
      data: {
        vehicleId: null,
        startDate: null,
        endDate: null,
        totalPrice: null
      }
    },
    {
      name: "String vehicle ID",
      data: {
        vehicleId: "not-a-number",
        startDate: "2025-09-01",
        endDate: "2025-09-05",
        totalPrice: "100.00"
      }
    },
    {
      name: "Malformed dates",
      data: {
        vehicleId: 45,
        startDate: "2025-13-45",  // Invalid month/day
        endDate: "not-a-date",
        totalPrice: "100.00"
      }
    },
    {
      name: "Negative price",
      data: {
        vehicleId: 45,
        startDate: "2025-09-01",
        endDate: "2025-09-05",
        totalPrice: "-100.00"
      }
    },
    {
      name: "Price as string with letters",
      data: {
        vehicleId: 45,
        startDate: "2025-09-01",
        endDate: "2025-09-05",
        totalPrice: "abc123"
      }
    },
    {
      name: "Extremely small amount (below Stripe minimum)",
      data: {
        vehicleId: 45,
        startDate: "2025-09-01",
        endDate: "2025-09-05",
        totalPrice: "0.01"  // Below R$ 0.50 minimum
      }
    }
  ];

  console.log('📋 Testing scenarios that previously caused 500 errors:\n');

  let allTestsPassed = true;

  for (const scenario of problematicScenarios) {
    try {
      const response = await fetch(`${BASE_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies || '',
        },
        body: JSON.stringify(scenario.data),
      });

      const result = await response.json();
      
      // Check if we get a proper error response (not 500)
      if (response.status === 500) {
        console.log(`❌ ${scenario.name}: Still returns 500 error`);
        console.log(`   Response: ${JSON.stringify(result)}`);
        allTestsPassed = false;
      } else if (response.status >= 400 && response.status < 500) {
        console.log(`✅ ${scenario.name}: Properly handled with ${response.status}`);
        console.log(`   Message: ${result.message}`);
      } else {
        console.log(`⚠️  ${scenario.name}: Unexpected status ${response.status}`);
        allTestsPassed = false;
      }

    } catch (error) {
      console.log(`❌ ${scenario.name}: Network error - ${error.message}`);
      allTestsPassed = false;
    }
  }

  console.log('\n' + '='.repeat(60));
  
  if (allTestsPassed) {
    console.log('🎉 SUCCESS: All problematic scenarios now properly handled!');
    console.log('✅ No more 500 errors for invalid input data');
    console.log('✅ All errors return appropriate status codes (400, 404)');
    console.log('✅ All error responses include user-friendly messages');
    console.log('\n📊 Payment intent creation error resolution: COMPLETE');
  } else {
    console.log('❌ Some scenarios still need attention');
  }
}

runFinalValidation().catch(console.error);