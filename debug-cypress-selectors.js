// Simple test to check if our data-testid attributes are working
import puppeteer from 'puppeteer';

async function testSelectors() {
  console.log('🔍 Testing data-testid selectors...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Test login page
    console.log('\n📋 Testing /login page...');
    await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle0' });
    
    const loginSelectors = [
      'input-email',
      'input-password', 
      'button-submit',
      'link-register'
    ];
    
    for (const selector of loginSelectors) {
      const element = await page.$(`[data-testid="${selector}"]`);
      console.log(`${selector}: ${element ? '✅ FOUND' : '❌ NOT FOUND'}`);
    }
    
    // Test register page
    console.log('\n📋 Testing /register page...');
    await page.goto('http://localhost:5000/register', { waitUntil: 'networkidle0' });
    
    const registerSelectors = [
      'input-name',
      'input-email',
      'input-password',
      'input-phone',
      'input-location',
      'input-confirm-password',
      'button-submit',
      'link-login'
    ];
    
    for (const selector of registerSelectors) {
      const element = await page.$(`[data-testid="${selector}"]`);
      console.log(`${selector}: ${element ? '✅ FOUND' : '❌ NOT FOUND'}`);
    }
    
    // Test home page with login button
    console.log('\n📋 Testing / (home) page...');
    await page.goto('http://localhost:5000/', { waitUntil: 'networkidle0' });
    
    const homeSelectors = [
      'button-login'
    ];
    
    for (const selector of homeSelectors) {
      const element = await page.$(`[data-testid="${selector}"]`);
      console.log(`${selector}: ${element ? '✅ FOUND' : '❌ NOT FOUND'}`);
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await browser.close();
  }
}

testSelectors().catch(console.error);