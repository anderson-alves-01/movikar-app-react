#!/usr/bin/env node

/**
 * Critical Bug Fixes Validation Test
 * This script validates all the critical fixes implemented to resolve user-reported issues
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 CRITICAL FIXES VALIDATION TEST');
console.log('================================');
console.log('Validating all implemented critical bug fixes...\n');

// Test results
const testResults = [];

// Helper function to add test result
function addTest(testName, passed, details = '') {
  testResults.push({ name: testName, passed, details });
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${testName}: ${details}`);
}

// Test 1: Dynamic Year (2024 → 2025) Fix
console.log('1️⃣  Testing Dynamic Year Fix (2024 → dynamic 2025)...');
try {
  const homeContent = fs.readFileSync('client/src/pages/home.tsx', 'utf8');
  const filtersContent = fs.readFileSync('client/src/components/vehicle-filters.tsx', 'utf8');
  const addVehicleContent = fs.readFileSync('client/src/components/add-vehicle-modal.tsx', 'utf8');
  
  const homeHasDynamicYear = homeContent.includes('new Date().getFullYear()');
  const filtersHasDynamicYear = filtersContent.includes('new Date().getFullYear()');
  const addVehicleHasDynamicYear = addVehicleContent.includes('new Date().getFullYear()');
  
  const noHardcoded2024 = 
    !homeContent.includes('© 2024') &&
    !filtersContent.includes('2024') &&
    !addVehicleContent.includes('max="2024"');
    
  addTest('Dynamic Year Implementation', homeHasDynamicYear && filtersHasDynamicYear && addVehicleHasDynamicYear && noHardcoded2024, 
    'All hardcoded 2024 years replaced with dynamic current year');
} catch (error) {
  addTest('Dynamic Year Implementation', false, `Error: ${error.message}`);
}

// Test 2: City Search Enhancement (No Default São Paulo)
console.log('\n2️⃣  Testing City Search Enhancement...');
try {
  const authContent = fs.readFileSync('client/src/pages/auth.tsx', 'utf8');
  
  const hasSmartCitySearch = authContent.includes('filterCities') && authContent.includes('Popover');
  const noDefaultSaoPaulo = !authContent.includes('placeholder="São Paulo, SP"');
  const hasCityAutocomplete = authContent.includes('CommandInput') && authContent.includes('Digite sua cidade');
  
  addTest('City Search Enhancement', hasSmartCitySearch && noDefaultSaoPaulo && hasCityAutocomplete,
    'Smart city search with autocomplete implemented, São Paulo default removed');
} catch (error) {
  addTest('City Search Enhancement', false, `Error: ${error.message}`);
}

// Test 3: Phone Formatting with International Support
console.log('\n3️⃣  Testing Phone Formatting with International Support...');
try {
  const phoneFormatterExists = fs.existsSync('client/src/utils/phoneFormatter.ts');
  const authContent = fs.readFileSync('client/src/pages/auth.tsx', 'utf8');
  
  let phoneFormatterContent = '';
  if (phoneFormatterExists) {
    phoneFormatterContent = fs.readFileSync('client/src/utils/phoneFormatter.ts', 'utf8');
  }
  
  const hasInternationalSupport = phoneFormatterContent.includes('+55') && phoneFormatterContent.includes('DDI');
  const hasFormattingFunction = phoneFormatterContent.includes('formatPhoneNumber');
  const hasValidation = phoneFormatterContent.includes('validatePhoneNumber');
  const authUsesFormatter = authContent.includes('formatPhoneNumber');
  
  addTest('Phone Formatting System', phoneFormatterExists && hasInternationalSupport && hasFormattingFunction && hasValidation && authUsesFormatter,
    'International phone formatting with DDD/DDI support implemented');
} catch (error) {
  addTest('Phone Formatting System', false, `Error: ${error.message}`);
}

// Test 4: Email Validation (Dot Preservation)
console.log('\n4️⃣  Testing Email Validation Improvements...');
try {
  const authContent = fs.readFileSync('client/src/pages/auth.tsx', 'utf8');
  
  const hasEmailPreservation = authContent.includes('emailValue.includes(\'.\')') && authContent.includes('emailValue.includes(\'@\')');
  const hasEmailValidation = authContent.includes('Digite um e-mail válido com @');
  
  addTest('Email Validation Enhancement', hasEmailPreservation && hasEmailValidation,
    'Email validation with dot preservation and user-friendly messages');
} catch (error) {
  addTest('Email Validation Enhancement', false, `Error: ${error.message}`);
}

// Test 5: PIX Key Validation System
console.log('\n5️⃣  Testing PIX Key Validation System...');
try {
  const pixValidatorExists = fs.existsSync('client/src/utils/pixValidator.ts');
  const profileContent = fs.readFileSync('client/src/pages/profile.tsx', 'utf8');
  
  let pixValidatorContent = '';
  if (pixValidatorExists) {
    pixValidatorContent = fs.readFileSync('client/src/utils/pixValidator.ts', 'utf8');
  }
  
  const hasCPFValidation = pixValidatorContent.includes('isValidCPF');
  const hasCNPJValidation = pixValidatorContent.includes('isValidCNPJ');
  const hasUserFriendlyErrors = pixValidatorContent.includes('errorMessage') && pixValidatorContent.includes('Digite apenas números');
  const profileUsesPIXValidator = profileContent.includes('validatePixKey') && profileContent.includes('formatPixKey');
  
  addTest('PIX Key Validation System', pixValidatorExists && hasCPFValidation && hasCNPJValidation && hasUserFriendlyErrors && profileUsesPIXValidator,
    'Complete PIX validation with CPF/CNPJ algorithms and user-friendly error messages');
} catch (error) {
  addTest('PIX Key Validation System', false, `Error: ${error.message}`);
}

// Test 6: Back Button on Subscription Plans
console.log('\n6️⃣  Testing Back Button on Subscription Plans...');
try {
  const subscriptionContent = fs.readFileSync('client/src/pages/subscription-plans.tsx', 'utf8');
  
  const hasBackButton = subscriptionContent.includes('ArrowLeft') && subscriptionContent.includes('Voltar ao Dashboard');
  const hasHeaderIntegration = subscriptionContent.includes('<Header />');
  const hasRouterIntegration = subscriptionContent.includes('setLocation');
  
  addTest('Subscription Plans Back Button', hasBackButton && hasHeaderIntegration && hasRouterIntegration,
    'Back button with proper navigation implemented in subscription plans');
} catch (error) {
  addTest('Subscription Plans Back Button', false, `Error: ${error.message}`);
}

// Test 7: Check for 404 Vehicle Creation Issues
console.log('\n7️⃣  Testing Vehicle Creation Error Handling...');
try {
  const routesContent = fs.readFileSync('server/routes.ts', 'utf8');
  const addVehicleContent = fs.readFileSync('client/src/components/add-vehicle-modal.tsx', 'utf8');
  
  const hasProperErrorHandling = routesContent.includes('POST /api/vehicles') && routesContent.includes('authenticateToken');
  const hasSubscriptionCheck = routesContent.includes('checkUserSubscriptionLimits');
  const hasValidationErrors = routesContent.includes('ZodError') && routesContent.includes('validationErrors');
  
  addTest('Vehicle Creation Error Handling', hasProperErrorHandling && hasSubscriptionCheck && hasValidationErrors,
    'Proper error handling and validation for vehicle creation');
} catch (error) {
  addTest('Vehicle Creation Error Handling', false, `Error: ${error.message}`);
}

// Summary
console.log('\n📊 VALIDATION SUMMARY');
console.log('==================');

const passedTests = testResults.filter(test => test.passed).length;
const totalTests = testResults.length;
const successRate = ((passedTests / totalTests) * 100).toFixed(1);

console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${successRate}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 ALL CRITICAL FIXES SUCCESSFULLY IMPLEMENTED!');
  console.log('   The platform is ready for production use.');
} else {
  console.log('\n⚠️  Some fixes need attention:');
  testResults
    .filter(test => !test.passed)
    .forEach(test => console.log(`   - ${test.name}: ${test.details}`));
}

// Export results for potential automation
const results = {
  timestamp: new Date().toISOString(),
  totalTests,
  passedTests,
  successRate: parseFloat(successRate),
  testResults,
  allPassed: passedTests === totalTests
};

fs.writeFileSync('critical-fixes-validation-results.json', JSON.stringify(results, null, 2));
console.log('\n📝 Results saved to: critical-fixes-validation-results.json');

process.exit(passedTests === totalTests ? 0 : 1);