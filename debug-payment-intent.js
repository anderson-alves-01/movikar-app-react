import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testPaymentIntentFlow() {
  console.log('🧪 Testing payment intent creation flow...');
  
  try {
    // Step 1: Login with admin user
    console.log('\n1. Logging in with admin user...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@alugae.mobi',
        password: 'admin123'
      }),
    });

    console.log('Login response status:', loginResponse.status);
    
    if (loginResponse.status !== 200) {
      const errorText = await loginResponse.text();
      console.log('Login error response:', errorText);
      throw new Error('Login failed');
    }

    const loginText = await loginResponse.text();
    console.log('Login response text (first 200 chars):', loginText.substring(0, 200));
    
    let loginData;
    try {
      loginData = JSON.parse(loginText);
      console.log('Login response:', loginData);
    } catch (e) {
      console.log('Response is not JSON, might be HTML redirect');
      // Check if this is a redirect to frontend
      if (loginText.includes('<!DOCTYPE')) {
        console.log('Got HTML response, login might have redirected to frontend');
        return;
      }
    }

    // Extract cookies from login response
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Cookies received:', cookies);

    // Step 2: Test auth status
    console.log('\n2. Testing authentication status...');
    const authResponse = await fetch(`${BASE_URL}/api/auth/user`, {
      method: 'GET',
      headers: {
        'Cookie': cookies || '',
      },
    });

    const authData = await authResponse.json();
    console.log('Auth response status:', authResponse.status);
    console.log('Auth response:', authData);

    if (authResponse.status !== 200) {
      throw new Error('Authentication failed');
    }

    // Step 3: Get vehicle data
    console.log('\n3. Getting vehicle data...');
    const vehiclesResponse = await fetch(`${BASE_URL}/api/vehicles`);
    const vehicles = await vehiclesResponse.json();
    console.log('Available vehicles:', vehicles.length);
    
    // Find a vehicle not owned by admin (user ID 2)
    const testVehicle = vehicles.find(v => v.ownerId !== 2);
    if (!testVehicle) {
      throw new Error('No test vehicle found that is not owned by admin');
    }
    
    console.log('Using test vehicle:', {
      id: testVehicle.id,
      brand: testVehicle.brand,
      model: testVehicle.model,
      ownerId: testVehicle.ownerId,
      pricePerDay: testVehicle.pricePerDay
    });

    // Step 4: Check vehicle availability first
    console.log('\n4. Checking vehicle availability...');
    const availabilityResponse = await fetch(`${BASE_URL}/api/vehicles/${testVehicle.id}/availability?startDate=2025-08-30&endDate=2025-09-02`);
    const availabilityData = await availabilityResponse.json();
    console.log('Availability response:', availabilityData);

    // Step 5: Attempt payment intent creation with dates far in the future
    console.log('\n5. Creating payment intent...');
    const paymentData = {
      vehicleId: testVehicle.id,
      startDate: '2025-08-30',  // Use dates further in the future
      endDate: '2025-09-02',
      totalPrice: '500.00'
    };

    console.log('Payment data:', paymentData);

    const paymentResponse = await fetch(`${BASE_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || '',
      },
      body: JSON.stringify(paymentData),
    });

    const paymentResult = await paymentResponse.json();
    console.log('Payment intent response status:', paymentResponse.status);
    console.log('Payment intent response:', paymentResult);

    if (paymentResponse.status === 200) {
      console.log('✅ Payment intent created successfully!');
      console.log('Client secret:', paymentResult.clientSecret ? 'Present' : 'Missing');
      console.log('Payment intent ID:', paymentResult.paymentIntentId);
    } else {
      console.log('❌ Payment intent creation failed');
      console.log('Error details:', paymentResult);
      
      // If it's still a 400 error, let's try different dates
      if (paymentResponse.status === 400 && paymentResult.message?.includes('não disponível')) {
        console.log('\n6. Trying with different dates (further in future)...');
        const futurePaymentData = {
          vehicleId: testVehicle.id,
          startDate: '2025-12-01',  // Even further in the future
          endDate: '2025-12-05',
          totalPrice: '500.00'
        };

        const futurePaymentResponse = await fetch(`${BASE_URL}/api/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies || '',
          },
          body: JSON.stringify(futurePaymentData),
        });

        const futurePaymentResult = await futurePaymentResponse.json();
        console.log('Future payment response status:', futurePaymentResponse.status);
        console.log('Future payment response:', futurePaymentResult);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testPaymentIntentFlow();