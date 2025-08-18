# Frontend Tests for Tutorial Functionality

## Quick Start

Para executar os testes do tutorial rapidamente:

```bash
# Instalar dependências se necessário
npm install @playwright/test vitest @testing-library/react @testing-library/jest-dom jsdom

# Executar todos os testes de tutorial
node tests/frontend/run-tutorial-tests.js

# Executar com interface visual do Playwright
npx playwright test tests/frontend/tutorial*.test.js --ui
```

## Test Files Overview

- **`tutorial.test.js`** - End-to-end tests for complete user flows
- **`tutorial-unit.test.js`** - Unit tests for individual components  
- **`tutorial-integration.test.js`** - Integration tests for complex flows
- **`tutorial-config.js`** - Shared configuration and test helpers
- **`run-tutorial-tests.js`** - Custom test runner script
- **`setup.js`** - Vitest setup and mocks

## Key Test Scenarios

### ✅ Button Visibility & Interaction
- Tutorial button appears in user dropdown when logged in
- Button click triggers onboarding flow
- Button not visible for non-authenticated users

### ✅ Tutorial Flow
- Correct steps shown for authenticated/unauthenticated users
- Progress tracking through steps
- Navigation (next/previous/skip/complete)
- Proper highlighting of target elements

### ✅ State Management
- localStorage persistence
- Tutorial restart capability
- State cleanup between sessions

### ✅ User Experience
- Mobile responsiveness
- Keyboard navigation
- Accessibility features
- Error handling for missing elements

### ✅ Performance & Reliability
- Works with many DOM elements
- Handles rapid user interactions
- Graceful degradation

## Running Individual Test Types

```bash
# Unit tests only
node tests/frontend/run-tutorial-tests.js unit

# Integration tests only  
node tests/frontend/run-tutorial-tests.js integration

# E2E tests only
node tests/frontend/run-tutorial-tests.js e2e
```

## Test Data Requirements

Tests expect a user account with:
- Email: `test@example.com`
- Password: `password123`

Make sure this test user exists in your development database.

## Debugging Failed Tests

```bash
# Run with visual debugging
npx playwright test --debug tests/frontend/tutorial.test.js

# Generate trace files
npx playwright test --trace on tests/frontend/tutorial.test.js

# View test report
npx playwright show-report
```

## Configuration

Tests are configured to run against `http://localhost:5000`. Make sure your development server is running:

```bash
npm run dev
```

See `TUTORIAL_TESTING_GUIDE.md` for comprehensive documentation.