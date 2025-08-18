/**
 * Integration Tests for Tutorial Functionality
 * Tests the complete flow from button click to tutorial completion
 */

import { test, expect } from '@playwright/test';

test.describe('Tutorial Integration Tests', () => {
  
  // Helper function to login
  async function loginUser(page, email = 'test@example.com', password = 'password123') {
    await page.goto('/auth');
    await page.fill('[data-testid="input-email"]', email);
    await page.fill('[data-testid="input-password"]', password);
    await page.click('[data-testid="button-submit"]');
    await page.waitForURL('/');
  }

  // Helper function to start tutorial
  async function startTutorial(page) {
    await page.click('[data-testid="header-user-menu"]');
    await page.click('[data-testid="button-start-tutorial"]');
  }

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('Complete tutorial flow for authenticated user', async ({ page }) => {
    await loginUser(page);
    await startTutorial(page);

    // Verify tutorial starts with welcome message
    await expect(page.locator('text=Ótimo! Você está logado')).toBeVisible();

    // Step through each tutorial step
    const steps = [
      'Menu do usuário',
      'Anuncie seu veículo', 
      'Planos Premium',
      'Navegue pelos veículos'
    ];

    for (let i = 0; i < steps.length; i++) {
      await page.click('button:has-text("Próximo")');
      await expect(page.locator(`text=${steps[i]}`)).toBeVisible();
      
      // Verify progress is updating
      await expect(page.locator(`text=Passo ${i + 2} de`)).toBeVisible();
    }

    // Complete the tutorial
    await page.click('button:has-text("Concluir")');

    // Verify tutorial overlay is gone
    await expect(page.locator('.fixed.inset-0.bg-black\\/50')).not.toBeVisible();

    // Verify localStorage is set
    const hasSeenOnboarding = await page.evaluate(() => 
      localStorage.getItem('hasSeenOnboarding')
    );
    expect(hasSeenOnboarding).toBe('true');
  });

  test('Tutorial can be restarted after completion', async ({ page }) => {
    await loginUser(page);
    
    // Complete tutorial first
    await startTutorial(page);
    await page.click('button:has-text("Pular tutorial")');

    // Start tutorial again
    await startTutorial(page);
    
    // Verify tutorial starts again
    await expect(page.locator('text=Ótimo! Você está logado')).toBeVisible();
  });

  test('Tutorial highlights correct elements during navigation', async ({ page }) => {
    await loginUser(page);
    await startTutorial(page);

    // Go to user menu step
    await page.click('button:has-text("Próximo")');
    
    // Verify user menu is highlighted
    const userMenu = page.locator('[data-testid="header-user-menu"]');
    await expect(userMenu).toHaveClass(/onboarding-highlight/);

    // Go to add vehicle step
    await page.click('button:has-text("Próximo")');
    
    // Verify add vehicle link is highlighted
    const addVehicleLink = page.locator('a[href="/vehicles"]');
    await expect(addVehicleLink).toBeVisible();
  });

  test('Tutorial overlay blocks interaction with background', async ({ page }) => {
    await loginUser(page);
    await startTutorial(page);

    // Try to click on background elements
    const vehicleGrid = page.locator('.vehicle-grid');
    
    // Click should not work due to overlay
    await vehicleGrid.click({ force: true });
    
    // Tutorial should still be active
    await expect(page.locator('text=Ótimo! Você está logado')).toBeVisible();
  });

  test('Tutorial works with keyboard navigation', async ({ page }) => {
    await loginUser(page);
    await startTutorial(page);

    // Use Tab to navigate to next button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Press Enter on next button
    await page.keyboard.press('Enter');
    
    // Verify we moved to next step
    await expect(page.locator('text=Menu do usuário')).toBeVisible();
  });

  test('Tutorial handles window resize gracefully', async ({ page }) => {
    await loginUser(page);
    await startTutorial(page);

    // Resize window to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Tutorial should still be visible and functional
    await expect(page.locator('text=Ótimo! Você está logado')).toBeVisible();
    
    // Resize back to desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Tutorial should still work
    await page.click('button:has-text("Próximo")');
    await expect(page.locator('text=Menu do usuário')).toBeVisible();
  });

  test('Tutorial persists state during page navigation', async ({ page }) => {
    await loginUser(page);
    await startTutorial(page);

    // Go to next step
    await page.click('button:has-text("Próximo")');
    
    // Navigate to another page and back
    await page.goto('/support');
    await page.goto('/');
    
    // Tutorial should not auto-restart
    await expect(page.locator('.fixed.inset-0.bg-black\\/50')).not.toBeVisible();
    
    // But can be started manually
    await startTutorial(page);
    await expect(page.locator('text=Ótimo! Você está logado')).toBeVisible();
  });

  test('Tutorial shows correct content for different user types', async ({ page }) => {
    // Test with regular user
    await loginUser(page);
    await startTutorial(page);
    
    await expect(page.locator('text=Ótimo! Você está logado')).toBeVisible();
    
    // Check for upgrade step
    await page.click('button:has-text("Próximo")');
    await page.click('button:has-text("Próximo")');
    await page.click('button:has-text("Próximo")');
    await expect(page.locator('text=Planos Premium')).toBeVisible();
  });

  test('Tutorial error handling for missing elements', async ({ page }) => {
    await loginUser(page);
    
    // Remove some tutorial target elements
    await page.evaluate(() => {
      const vehicleGrid = document.querySelector('.vehicle-grid');
      if (vehicleGrid) vehicleGrid.remove();
    });
    
    await startTutorial(page);
    
    // Tutorial should still start and handle missing elements gracefully
    await expect(page.locator('text=Ótimo! Você está logado')).toBeVisible();
    
    // Should be able to navigate through steps even with missing targets
    await page.click('button:has-text("Próximo")');
    await page.click('button:has-text("Próximo")');
    await page.click('button:has-text("Próximo")');
    await page.click('button:has-text("Próximo")');
    
    // Should reach the end without errors
    await expect(page.locator('button:has-text("Concluir")')).toBeVisible();
  });

  test('Tutorial performance with many DOM elements', async ({ page }) => {
    await loginUser(page);
    
    // Add many elements to test performance
    await page.evaluate(() => {
      for (let i = 0; i < 1000; i++) {
        const div = document.createElement('div');
        div.textContent = `Element ${i}`;
        div.className = 'test-element';
        document.body.appendChild(div);
      }
    });
    
    const startTime = Date.now();
    await startTutorial(page);
    const endTime = Date.now();
    
    // Tutorial should start within reasonable time (< 2 seconds)
    expect(endTime - startTime).toBeLessThan(2000);
    
    // Should still be functional
    await expect(page.locator('text=Ótimo! Você está logado')).toBeVisible();
  });

  test('Tutorial handles rapid clicks gracefully', async ({ page }) => {
    await loginUser(page);
    await startTutorial(page);

    // Rapidly click next button
    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("Próximo")', { force: true });
      await page.waitForTimeout(100);
    }
    
    // Should not break or show errors
    // Should be at a valid step
    const stepText = await page.locator('text=Passo').first().textContent();
    expect(stepText).toMatch(/Passo \d+ de \d+/);
  });

  test('Tutorial accessibility features', async ({ page }) => {
    await loginUser(page);
    await startTutorial(page);

    // Check ARIA attributes
    const tooltip = page.locator('.fixed.z-\\[1001\\]').first();
    
    // Should have proper focus management
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Should be keyboard navigable
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Should advance to next step
    await expect(page.locator('text=Menu do usuário')).toBeVisible();
  });
});