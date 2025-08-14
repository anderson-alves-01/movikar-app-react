// Test rental process with authenticated user
import fetch from 'node-fetch';

const BASE_URL = 'https://alugae.mobi';

async function testRentalProcess() {
  console.log('🚗 Testing authenticated rental process...\n');

  try {
    // Step 1: Try to login
    console.log('1. Testing login process...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@alugae.mobi',
        password: 'admin123'
      })
    });

    console.log(`Login status: ${loginResponse.status}`);
    
    if (loginResponse.status === 200) {
      const cookies = loginResponse.headers.get('set-cookie') || '';
      console.log('✅ Login successful');
      
      // Step 2: Test creating payment intent with cookies
      console.log('\n2. Testing payment intent with authentication...');
      const paymentResponse = await fetch(`${BASE_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify({
          vehicleId: 45,
          startDate: '2025-09-01',
          endDate: '2025-09-03',
          totalPrice: '150.00'
        })
      });

      console.log(`Payment intent status: ${paymentResponse.status}`);
      const paymentData = await paymentResponse.text();
      console.log(`Response: ${paymentData}`);

      if (paymentResponse.status === 200) {
        console.log('✅ Payment intent created successfully');
      } else {
        console.log(`❌ Payment intent failed: ${paymentData}`);
      }

      // Step 3: Test booking creation
      console.log('\n3. Testing booking creation...');
      const bookingResponse = await fetch(`${BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify({
          vehicleId: 45,
          startDate: '2025-09-01',
          endDate: '2025-09-03',
          totalCost: 150.00,
          status: 'pending',
          paymentStatus: 'pending'
        })
      });

      console.log(`Booking status: ${bookingResponse.status}`);
      const bookingData = await bookingResponse.text();
      console.log(`Booking response: ${bookingData}`);

    } else {
      const loginData = await loginResponse.text();
      console.log(`❌ Login failed: ${loginData}`);
      
      // Test with guest registration
      console.log('\n🔄 Trying guest registration...');
      const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test_' + Date.now() + '@test.com',
          password: 'test123',
          phone: '11999999999'
        })
      });

      console.log(`Registration status: ${registerResponse.status}`);
      const registerData = await registerResponse.text();
      console.log(`Registration response: ${registerData}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRentalProcess();