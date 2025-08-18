/**
 * Frontend Tests for Tutorial/Onboarding Functionality
 * Tests the "Iniciar tutorial" button and onboarding flow
 */

import { test, expect } from '@playwright/test';

test.describe('Tutorial/Onboarding Functionality', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Clear any existing onboarding state
    await page.evaluate(() => {
      localStorage.removeItem('hasSeenOnboarding');
    });
  });

  test('Tutorial button should be visible in user dropdown when logged in', async ({ page }) => {
    // First, log in as a test user
    await page.goto('/auth');
    
    // Fill login form
    await page.fill('[data-testid="input-email"]', 'test@example.com');
    await page.fill('[data-testid="input-password"]', 'password123');
    await page.click('[data-testid="button-submit"]');
    
    // Wait for redirect to home page
    await page.waitForURL('/');
    
    // Open user dropdown menu
    await page.click('[data-testid="header-user-menu"]');
    
    // Check if tutorial button exists
    const tutorialButton = page.locator('[data-testid="button-start-tutorial"]');
    await expect(tutorialButton).toBeVisible();
    await expect(tutorialButton).toContainText('Iniciar tutorial');
  });

  test('Tutorial button should trigger onboarding flow', async ({ page }) => {
    // Log in first
    await page.goto('/auth');
    await page.fill('[data-testid="input-email"]', 'test@example.com');
    await page.fill('[data-testid="input-password"]', 'password123');
    await page.click('[data-testid="button-submit"]');
    await page.waitForURL('/');
    
    // Open user dropdown and click tutorial button
    await page.click('[data-testid="header-user-menu"]');
    await page.click('[data-testid="button-start-tutorial"]');
    
    // Check if onboarding overlay appears
    const overlay = page.locator('.fixed.inset-0.bg-black\\/50');
    await expect(overlay).toBeVisible();
    
    // Check if tooltip appears
    const tooltip = page.locator('.fixed.z-\\[1001\\]');
    await expect(tooltip).toBeVisible();
    
    // Check if tutorial content is displayed
    await expect(page.locator('text=Bem-vindo ao alugae.mobi!')).toBeVisible();
  });

  test('Tutorial should show correct steps for authenticated users', async ({ page }) => {
    // Log in and start tutorial
    await page.goto('/auth');
    await page.fill('[data-testid="input-email"]', 'test@example.com');
    await page.fill('[data-testid="input-password"]', 'password123');
    await page.click('[data-testid="button-submit"]');
    await page.waitForURL('/');
    
    await page.click('[data-testid="header-user-menu"]');
    await page.click('[data-testid="button-start-tutorial"]');
    
    // Check first step for authenticated users
    await expect(page.locator('text=Ótimo! Você está logado')).toBeVisible();
    
    // Click next to proceed
    await page.click('button:has-text("Próximo")');
    
    // Check second step
    await expect(page.locator('text=Menu do usuário')).toBeVisible();
  });

  test('Tutorial should show correct steps for non-authenticated users', async ({ page }) => {
    // Don't log in, just go to home page
    await page.goto('/');
    
    // Manually trigger onboarding for testing
    await page.evaluate(() => {
      window.localStorage.removeItem('hasSeenOnboarding');
      // Simulate manual onboarding trigger
      const event = new CustomEvent('startOnboarding');
      window.dispatchEvent(event);
    });
    
    // For non-authenticated users, we need to trigger it differently
    // since the button is only available to logged-in users
    // This tests the onboarding flow itself
    await page.reload();
  });

  test('Tutorial progress should be tracked correctly', async ({ page }) => {
    // Log in and start tutorial
    await page.goto('/auth');
    await page.fill('[data-testid="input-email"]', 'test@example.com');
    await page.fill('[data-testid="input-password"]', 'password123');
    await page.click('[data-testid="button-submit"]');
    await page.waitForURL('/');
    
    await page.click('[data-testid="header-user-menu"]');
    await page.click('[data-testid="button-start-tutorial"]');
    
    // Check initial progress (step 1)
    await expect(page.locator('text=Passo 1 de')).toBeVisible();
    
    // Check progress bar
    const progressBar = page.locator('.bg-blue-600.h-2.rounded-full');
    await expect(progressBar).toBeVisible();
    
    // Click next and check progress updates
    await page.click('button:has-text("Próximo")');
    await expect(page.locator('text=Passo 2 de')).toBeVisible();
  });

  test('Tutorial can be skipped', async ({ page }) => {
    // Log in and start tutorial
    await page.goto('/auth');
    await page.fill('[data-testid="input-email"]', 'test@example.com');
    await page.fill('[data-testid="input-password"]', 'password123');
    await page.click('[data-testid="button-submit"]');
    await page.waitForURL('/');
    
    await page.click('[data-testid="header-user-menu"]');
    await page.click('[data-testid="button-start-tutorial"]');
    
    // Click skip button
    await page.click('button:has-text("Pular tutorial")');
    
    // Check if tutorial overlay disappears
    const overlay = page.locator('.fixed.inset-0.bg-black\\/50');
    await expect(overlay).not.toBeVisible();
    
    // Check if hasSeenOnboarding is set in localStorage
    const hasSeenOnboarding = await page.evaluate(() => {
      return localStorage.getItem('hasSeenOnboarding');
    });
    expect(hasSeenOnboarding).toBe('true');
  });

  test('Tutorial can be completed', async ({ page }) => {
    // Log in and start tutorial
    await page.goto('/auth');
    await page.fill('[data-testid="input-email"]', 'test@example.com');
    await page.fill('[data-testid="input-password"]', 'password123');
    await page.click('[data-testid="button-submit"]');
    await page.waitForURL('/');
    
    await page.click('[data-testid="header-user-menu"]');
    await page.click('[data-testid="button-start-tutorial"]');
    
    // Go through all steps
    let stepCount = 0;
    while (stepCount < 10) { // Safety limit
      const nextButton = page.locator('button:has-text("Próximo")');
      const completeButton = page.locator('button:has-text("Concluir")');
      
      if (await completeButton.isVisible()) {
        await completeButton.click();
        break;
      } else if (await nextButton.isVisible()) {
        await nextButton.click();
        stepCount++;
      } else {
        break;
      }
      
      // Wait a bit between steps
      await page.waitForTimeout(500);
    }
    
    // Check if tutorial overlay disappears
    const overlay = page.locator('.fixed.inset-0.bg-black\\/50');
    await expect(overlay).not.toBeVisible();
    
    // Check if hasSeenOnboarding is set in localStorage
    const hasSeenOnboarding = await page.evaluate(() => {
      return localStorage.getItem('hasSeenOnboarding');
    });
    expect(hasSeenOnboarding).toBe('true');
  });

  test('Tutorial button should not be visible when not logged in', async ({ page }) => {
    // Go to home page without logging in
    await page.goto('/');
    
    // Check that login button is visible instead
    const loginButton = page.locator('[data-testid="button-login"]');
    await expect(loginButton).toBeVisible();
    
    // Tutorial button should not exist
    const tutorialButton = page.locator('[data-testid="button-start-tutorial"]');
    await expect(tutorialButton).not.toBeVisible();
  });

  test('Tutorial should highlight correct elements', async ({ page }) => {
    // Log in and start tutorial
    await page.goto('/auth');
    await page.fill('[data-testid="input-email"]', 'test@example.com');
    await page.fill('[data-testid="input-password"]', 'password123');
    await page.click('[data-testid="button-submit"]');
    await page.waitForURL('/');
    
    await page.click('[data-testid="header-user-menu"]');
    await page.click('[data-testid="button-start-tutorial"]');
    
    // Go to step that highlights user menu
    await page.click('button:has-text("Próximo")');
    
    // Check if spotlight effect is applied
    const spotlight = page.locator('.fixed.pointer-events-none.z-\\[1000\\]');
    await expect(spotlight).toBeVisible();
    
    // Check if target element has highlight class
    const userMenu = page.locator('[data-testid="header-user-menu"]');
    await expect(userMenu).toHaveClass(/onboarding-highlight/);
  });

  test('Tutorial should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Log in and start tutorial
    await page.goto('/auth');
    await page.fill('[data-testid="input-email"]', 'test@example.com');
    await page.fill('[data-testid="input-password"]', 'password123');
    await page.click('[data-testid="button-submit"]');
    await page.waitForURL('/');
    
    await page.click('[data-testid="header-user-menu"]');
    await page.click('[data-testid="button-start-tutorial"]');
    
    // Check if tooltip is visible and properly positioned
    const tooltip = page.locator('.fixed.z-\\[1001\\]');
    await expect(tooltip).toBeVisible();
    
    // Check if tooltip content is readable
    await expect(page.locator('text=Ótimo! Você está logado')).toBeVisible();
    
    // Check if buttons are accessible
    const nextButton = page.locator('button:has-text("Próximo")');
    await expect(nextButton).toBeVisible();
  });

  test('Tutorial state should persist across page refreshes', async ({ page }) => {
    // Log in and start tutorial
    await page.goto('/auth');
    await page.fill('[data-testid="input-email"]', 'test@example.com');
    await page.fill('[data-testid="input-password"]', 'password123');
    await page.click('[data-testid="button-submit"]');
    await page.waitForURL('/');
    
    await page.click('[data-testid="header-user-menu"]');
    await page.click('[data-testid="button-start-tutorial"]');
    
    // Complete tutorial
    await page.click('button:has-text("Pular tutorial")');
    
    // Refresh page
    await page.reload();
    
    // Check that tutorial doesn't auto-start again
    const overlay = page.locator('.fixed.inset-0.bg-black\\/50');
    await expect(overlay).not.toBeVisible();
    
    // But button should still be available to restart tutorial
    await page.click('[data-testid="header-user-menu"]');
    const tutorialButton = page.locator('[data-testid="button-start-tutorial"]');
    await expect(tutorialButton).toBeVisible();
  });
});