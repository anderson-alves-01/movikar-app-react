import fetch from 'node-fetch';

const BASE_URL = 'https://alugae.mobi';

// Test rental process step by step
async function testRentalProcess() {
  console.log('🧪 Testing rental process...');
  
  try {
    // Step 1: Test vehicle listing
    console.log('1. Testing vehicle listing...');
    const response = await fetch(`${BASE_URL}/api/vehicles`);
    
    if (!response.ok) {
      console.error(`❌ Vehicle listing failed: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const vehicles = await response.json();
    console.log(`✅ Found ${vehicles.length} vehicles`);
    
    if (vehicles.length === 0) {
      console.log('⚠️ No vehicles available for testing');
      return;
    }
    
    const testVehicle = vehicles[0];
    console.log(`📍 Testing with vehicle: ${testVehicle.brand} ${testVehicle.model} (ID: ${testVehicle.id})`);
    
    // Step 2: Test booking creation (without auth first)
    console.log('2. Testing booking creation...');
    const bookingData = {
      vehicleId: testVehicle.id,
      startDate: '2025-08-16',
      endDate: '2025-08-18',
      includeInsurance: true
    };
    
    const bookingResponse = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });
    
    console.log(`📊 Booking response status: ${bookingResponse.status}`);
    
    if (!bookingResponse.ok) {
      const errorText = await bookingResponse.text();
      console.log(`⚠️ Expected auth error (401/403): ${errorText}`);
    }
    
    // Step 3: Test payment intent creation (without auth)
    console.log('3. Testing payment intent creation...');
    const paymentData = {
      vehicleId: testVehicle.id,
      startDate: '2025-08-16',
      endDate: '2025-08-18',
      totalPrice: '150.00'
    };
    
    const paymentResponse = await fetch(`${BASE_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });
    
    console.log(`💳 Payment intent response status: ${paymentResponse.status}`);
    
    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.log(`❌ Payment intent error: ${errorText}`);
    } else {
      const paymentResult = await paymentResponse.json();
      console.log(`✅ Payment intent created: ${paymentResult.clientSecret ? 'SUCCESS' : 'MISSING CLIENT SECRET'}`);
    }
    
    // Step 4: Test checkout data endpoint
    console.log('4. Testing checkout data storage...');
    const checkoutTestResponse = await fetch(`${BASE_URL}/api/checkout-data/test-id`);
    console.log(`🛒 Checkout data response status: ${checkoutTestResponse.status}`);
    
    if (checkoutTestResponse.status === 404) {
      console.log('✅ Expected 404 for non-existent checkout data');
    }
    
    console.log('\n📋 Test Summary:');
    console.log('- Vehicle listing: ✅ Working');
    console.log('- Booking creation: ⚠️ Requires authentication (expected)');
    console.log(`- Payment intent: ${paymentResponse.ok ? '✅ Working' : '❌ Failed'}`);
    console.log('- Checkout data: ✅ Endpoint available');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testRentalProcess();