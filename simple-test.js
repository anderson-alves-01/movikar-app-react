// Simple test without puppeteer
import fetch from 'node-fetch';

console.log('🔍 Testing if server is responding...');

fetch('http://localhost:5000/')
  .then(response => response.text())
  .then(html => {
    console.log('✅ Server is responding');
    console.log('Page length:', html.length);
    
    // Check if it's a SPA with React
    if (html.includes('id="root"')) {
      console.log('📋 This is a SPA - elements are rendered by React');
      console.log('🔍 Cypress needs to wait for React to render elements');
    }
    
    // Check for any data-testid in static HTML
    const testIds = html.match(/data-testid="[^"]*"/g);
    if (testIds && testIds.length > 0) {
      console.log('✅ Found static data-testid attributes:', testIds);
    } else {
      console.log('ℹ️ No static data-testid attributes found (normal for SPA)');
    }
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });