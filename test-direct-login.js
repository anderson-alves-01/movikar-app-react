// Test direct login in browser console
async function testDirectLogin() {
  console.log('Testing direct login...');
  
  try {
    // 1. Login
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: 'admin@alugae.mobi',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (loginData.token) {
      // Store token manually
      sessionStorage.setItem('auth_token', loginData.token);
      console.log('Token stored in sessionStorage');
      
      // Test API with token
      const vehiclesResponse = await fetch('/api/users/my/vehicles', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const vehiclesData = await vehiclesResponse.json();
      console.log('Vehicles response:', vehiclesData);
      
      return { success: true, token: loginData.token, vehicles: vehiclesData };
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    return { success: false, error: error.message };
  }
}

// Run test
testDirectLogin().then(result => {
  console.log('Final result:', result);
});