// Alternative testing approach for data-testid attributes
// This works better in resource-constrained environments like Replit

import puppeteer from 'puppeteer';

const TEST_SCENARIOS = [
  {
    name: 'Login Page',
    url: '/login',
    expectedElements: [
      'input-email',
      'input-password',
      'button-submit',
      'link-register'
    ]
  },
  {
    name: 'Register Page', 
    url: '/register',
    expectedElements: [
      'input-name',
      'input-email',
      'input-password',
      'input-phone',
      'input-location',
      'input-confirm-password',
      'button-submit',
      'link-login'
    ]
  },
  {
    name: 'Home Page (Logged Out)',
    url: '/',
    expectedElements: [
      'button-login'
    ]
  }
];

async function testDataTestIds() {
  console.log('🔍 Testing data-testid attributes...\n');
  
  let browser;
  try {
    // Install chrome if needed
    console.log('📦 Setting up browser...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080'
      ],
      executablePath: '/usr/bin/chromium-browser' // Use system chromium if available
    }).catch(async () => {
      // Fallback: try to download and use puppeteer's chromium
      const { execSync } = await import('child_process');
      try {
        execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });
        return puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
          ]
        });
      } catch (e) {
        console.log('⚠️ Could not install browser, falling back to manual testing');
        return null;
      }
    });

    if (!browser) {
      console.log('❌ Browser unavailable, cannot run automated tests');
      process.exit(1);
    }

    const page = await browser.newPage();
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    for (const scenario of TEST_SCENARIOS) {
      console.log(`📋 Testing: ${scenario.name}`);
      console.log(`🌐 URL: http://localhost:5000${scenario.url}`);
      
      try {
        await page.goto(`http://localhost:5000${scenario.url}`, { 
          waitUntil: 'networkidle0',
          timeout: 15000 
        });

        // Wait for React to render
        await page.waitForTimeout(2000);

        for (const elementId of scenario.expectedElements) {
          totalTests++;
          
          try {
            const element = await page.waitForSelector(`[data-testid="${elementId}"]`, { 
              timeout: 10000 
            });
            
            if (element) {
              console.log(`  ✅ ${elementId}: FOUND`);
              passedTests++;
            } else {
              console.log(`  ❌ ${elementId}: NOT FOUND`);
              failedTests++;
            }
          } catch (error) {
            console.log(`  ❌ ${elementId}: NOT FOUND (timeout)`);
            failedTests++;
          }
        }
        
      } catch (error) {
        console.log(`  ❌ Failed to load ${scenario.url}: ${error.message}`);
        failedTests += scenario.expectedElements.length;
        totalTests += scenario.expectedElements.length;
      }
      
      console.log(''); // Empty line for readability
    }

    console.log('📊 Test Results:');
    console.log(`Total tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);

    if (failedTests === 0) {
      console.log('\n🎉 All data-testid attributes are working correctly!');
      console.log('✅ Cypress tests should now pass');
    } else {
      console.log('\n⚠️ Some data-testid attributes are missing');
      console.log('❌ Cypress tests may fail');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the tests if server is running
testDataTestIds().catch(console.error);