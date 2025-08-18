/**
 * Configuration and setup for tutorial tests
 */

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/frontend',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Mock geolocation for consistent tests
        geolocation: { latitude: -23.5505, longitude: -46.6333 }, // São Paulo
        permissions: ['geolocation']
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});

// Test data setup
export const testUsers = {
  regular: {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  },
  admin: {
    email: 'admin@alugae.mobi',
    password: 'admin123',
    name: 'Admin User'
  },
  premium: {
    email: 'premium@example.com',
    password: 'premium123',
    name: 'Premium User'
  }
};

// Helper functions for tests
export const testHelpers = {
  async createTestUser(page, userData = testUsers.regular) {
    await page.goto('/auth');
    await page.click('text=Criar conta');
    
    await page.fill('[data-testid="input-name"]', userData.name);
    await page.fill('[data-testid="input-email"]', userData.email);
    await page.fill('[data-testid="input-password"]', userData.password);
    await page.fill('[data-testid="input-confirm-password"]', userData.password);
    await page.fill('[data-testid="input-phone"]', '11999999999');
    
    await page.check('[data-testid="checkbox-terms"]');
    await page.check('[data-testid="checkbox-privacy"]');
    
    await page.click('[data-testid="button-submit"]');
    await page.waitForURL('/');
  },

  async loginUser(page, userData = testUsers.regular) {
    await page.goto('/auth');
    await page.fill('[data-testid="input-email"]', userData.email);
    await page.fill('[data-testid="input-password"]', userData.password);
    await page.click('[data-testid="button-submit"]');
    await page.waitForURL('/');
  },

  async clearTutorialState(page) {
    await page.evaluate(() => {
      localStorage.removeItem('hasSeenOnboarding');
    });
  },

  async startTutorial(page) {
    await page.click('[data-testid="header-user-menu"]');
    await page.click('[data-testid="button-start-tutorial"]');
  },

  async completeTutorial(page) {
    // Click through all steps
    let maxSteps = 10; // Safety limit
    while (maxSteps > 0) {
      const completeButton = page.locator('button:has-text("Concluir")');
      const nextButton = page.locator('button:has-text("Próximo")');
      
      if (await completeButton.isVisible()) {
        await completeButton.click();
        break;
      } else if (await nextButton.isVisible()) {
        await nextButton.click();
      } else {
        break;
      }
      
      maxSteps--;
      await page.waitForTimeout(500);
    }
  },

  async skipTutorial(page) {
    await page.click('button:has-text("Pular tutorial")');
  },

  async waitForTutorialToLoad(page) {
    await page.waitForSelector('.fixed.inset-0.bg-black\\/50', { 
      state: 'visible',
      timeout: 5000 
    });
  },

  async verifyTutorialStep(page, stepText) {
    await expect(page.locator(`text=${stepText}`)).toBeVisible();
  },

  async verifyTutorialProgress(page, currentStep, totalSteps) {
    await expect(page.locator(`text=Passo ${currentStep} de ${totalSteps}`)).toBeVisible();
  },

  async verifyElementHighlight(page, selector) {
    const element = page.locator(selector);
    await expect(element).toHaveClass(/onboarding-highlight/);
  },

  async verifyTutorialCompleted(page) {
    // Check overlay is gone
    await expect(page.locator('.fixed.inset-0.bg-black\\/50')).not.toBeVisible();
    
    // Check localStorage
    const hasSeenOnboarding = await page.evaluate(() => 
      localStorage.getItem('hasSeenOnboarding')
    );
    expect(hasSeenOnboarding).toBe('true');
  }
};

// Tutorial step definitions for testing
export const tutorialSteps = {
  authenticatedHome: [
    'Ótimo! Você está logado',
    'Menu do usuário',
    'Anuncie seu veículo',
    'Planos Premium',
    'Navegue pelos veículos'
  ],
  
  unauthenticatedHome: [
    'Bem-vindo ao alugae.mobi!',
    'Busque veículos',
    'Faça login',
    'Conheça os recursos'
  ],
  
  profile: [
    'Seu perfil',
    'Editar perfil',
    'Suas reservas',
    'Como proprietário',
    'Seus veículos'
  ]
};

// Mock data for testing
export const mockVehicles = [
  {
    id: 1,
    brand: 'Toyota',
    model: 'Corolla',
    year: 2022,
    pricePerDay: 120,
    available: true
  },
  {
    id: 2,
    brand: 'Honda',
    model: 'Civic',
    year: 2021,
    pricePerDay: 110,
    available: true
  }
];

// Error scenarios for testing
export const errorScenarios = {
  networkError: async (page) => {
    await page.route('**/api/**', route => route.abort('connectionfailed'));
  },
  
  slowNetwork: async (page) => {
    await page.route('**/api/**', route => {
      setTimeout(() => route.continue(), 3000);
    });
  },
  
  serverError: async (page) => {
    await page.route('**/api/**', route => route.fulfill({
      status: 500,
      body: 'Internal Server Error'
    }));
  }
};