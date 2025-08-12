
import { test, expect } from '@playwright/test';

test.describe('Gestão de Veículos', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('/auth');
    await page.fill('[data-testid="input-email"]', 'admin@alugae.mobi');
    await page.fill('[data-testid="input-password"]', 'admin123');
    await page.click('[data-testid="button-login"]');
    await page.waitForURL('/');
  });

  test('deve listar veículos disponíveis', async ({ page }) => {
    await page.goto('/vehicles');
    
    // Verificar se veículos são carregados
    await expect(page.locator('[data-testid="vehicle-card"]')).toHaveCount({ min: 1 });
    
    // Verificar conteúdo do primeiro veículo
    const firstVehicle = page.locator('[data-testid="vehicle-card"]').first();
    await expect(firstVehicle.locator('text=Toyota')).toBeVisible();
  });

  test('deve permitir busca de veículos', async ({ page }) => {
    await page.goto('/vehicles');
    
    // Fazer busca
    await page.fill('[data-testid="search-input"]', 'Toyota');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // Verificar resultados
    await expect(page.locator('[data-testid="vehicle-card"]:has-text("Toyota")')).toHaveCount({ min: 1 });
  });

  test('deve exibir detalhes do veículo', async ({ page }) => {
    await page.goto('/vehicles');
    
    // Clicar no primeiro veículo
    await page.click('[data-testid="vehicle-card"]', { first: true });
    
    // Verificar página de detalhes
    await expect(page).toHaveURL(/\/vehicles\/\d+/);
    await expect(page.locator('[data-testid="vehicle-brand"]')).toBeVisible();
    await expect(page.locator('[data-testid="vehicle-model"]')).toBeVisible();
    await expect(page.locator('[data-testid="vehicle-price"]')).toBeVisible();
  });
});
