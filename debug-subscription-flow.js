// Test script to debug the complete subscription flow
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testFlow() {
  console.log('🧪 Testing Complete Subscription Flow with 100% Coupon');
  console.log('==========================================\n');
  
  try {
    // Step 1: Login
    console.log('Step 1: Logging in...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': ''
      },
      body: JSON.stringify({
        email: 'teste@teste.com',
        password: 'teste123'
      }),
      credentials: 'include'
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log('User subscription status:', loginData.user.subscriptionStatus);
    console.log('Current plan:', loginData.user.subscriptionPlan);
    
    // Extract cookies
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Cookies received:', cookies ? 'Yes' : 'No');

    // Step 2: Test coupon validation
    console.log('\nStep 2: Validating SAVE100 coupon...');
    const couponResponse = await fetch('http://localhost:5000/api/validate-coupon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      },
      body: JSON.stringify({
        code: 'SAVE100',
        orderValue: 5990 // R$ 59.90 in cents
      })
    });

    const couponData = await couponResponse.json();
    console.log('Coupon validation result:', couponData);

    // Step 3: Create subscription with 100% discount
    console.log('\nStep 3: Creating subscription with 100% discount...');
    const subscriptionResponse = await fetch('http://localhost:5000/api/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      },
      body: JSON.stringify({
        planName: 'plus',
        paymentMethod: 'monthly',
        vehicleCount: 2,
        couponCode: 'SAVE100',
        discountAmount: couponData.discountAmount || 6989
      })
    });

    const subscriptionData = await subscriptionResponse.json();
    console.log('\n🎯 SUBSCRIPTION RESULT:');
    console.log('==========================================');
    console.log(JSON.stringify(subscriptionData, null, 2));
    
    if (subscriptionData.isFreeSubscription) {
      console.log('\n✅ SUCCESS: Free subscription activated!');
      console.log('✅ No checkout required - 100% discount applied');
    } else if (subscriptionData.clientSecret) {
      console.log('\n⚠️  Would redirect to Stripe checkout');
    } else {
      console.log('\n❌ Unexpected response');
    }

    // Step 4: Check user status after subscription
    console.log('\nStep 4: Checking updated user status...');
    const userResponse = await fetch('http://localhost:5000/api/auth/user', {
      headers: {
        'Cookie': cookies || ''
      }
    });

    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('Updated user subscription:', userData.user.subscriptionPlan);
      console.log('Subscription status:', userData.user.subscriptionStatus);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Import fetch for Node.js
const fetch = require('node-fetch');

// Run the test
testFlow().then(() => {
  console.log('\n🏁 Test completed');
  rl.close();
}).catch(err => {
  console.error('Fatal error:', err);
  rl.close();
});