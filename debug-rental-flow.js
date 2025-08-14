// Debug rental flow - identify specific rental error
const https = require('https');

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          cookies: res.headers['set-cookie'] || []
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function debugRentalFlow() {
  console.log('🔍 Debugging rental flow...');
  const baseUrl = 'https://alugae.mobi';
  
  try {
    // 1. Test vehicle endpoint (should work without auth)
    console.log('\n1. Testing vehicle endpoint...');
    const vehiclesResponse = await makeRequest(`${baseUrl}/api/vehicles`);
    console.log(`Status: ${vehiclesResponse.status}`);
    
    if (vehiclesResponse.status === 200) {
      const vehicles = JSON.parse(vehiclesResponse.data);
      console.log(`✅ Found ${vehicles.length} vehicles`);
      
      if (vehicles.length > 0) {
        const testVehicle = vehicles[0];
        console.log(`📍 Test vehicle: ${testVehicle.brand} ${testVehicle.model} (ID: ${testVehicle.id})`);
        
        // 2. Try creating payment intent without auth (should fail with 401)
        console.log('\n2. Testing payment intent without auth...');
        const paymentData = JSON.stringify({
          vehicleId: testVehicle.id,
          startDate: '2025-08-16',
          endDate: '2025-08-18',
          totalPrice: '150.00'
        });
        
        const paymentResponse = await makeRequest(`${baseUrl}/api/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(paymentData)
          },
          body: paymentData
        });
        
        console.log(`Payment intent status: ${paymentResponse.status}`);
        if (paymentResponse.status === 401) {
          console.log('✅ Expected 401 - authentication required');
          console.log(`Response: ${paymentResponse.data}`);
        } else {
          console.log(`❌ Unexpected status: ${paymentResponse.status}`);
          console.log(`Response: ${paymentResponse.data}`);
        }
      }
    } else {
      console.log(`❌ Vehicle endpoint failed: ${vehiclesResponse.status}`);
      console.log(`Response: ${vehiclesResponse.data}`);
    }
    
    // 3. Check if there are any obvious server errors
    console.log('\n3. Testing health endpoint...');
    const healthResponse = await makeRequest(`${baseUrl}/api/health`);
    console.log(`Health status: ${healthResponse.status}`);
    if (healthResponse.status === 200) {
      console.log('✅ Server is healthy');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugRentalFlow();