
import { test, expect } from '@playwright/test';

test.describe('Painel Administrativo', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('/auth');
    await page.fill('[data-testid="input-email"]', 'admin@alugae.mobi');
    await page.fill('[data-testid="input-password"]', 'admin123');
    await page.click('[data-testid="button-login"]');
    await page.waitForURL('/');
  });

  test('deve acessar dashboard administrativo', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Verificar elementos do dashboard
    await expect(page.locator('text=Dashboard Administrativo')).toBeVisible();
    await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-vehicles"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-bookings"]')).toBeVisible();
  });

  test('deve gerenciar usuários', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Verificar lista de usuários
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-row"]')).toHaveCount({ min: 1 });
    
    // Verificar ações disponíveis
    await expect(page.locator('[data-testid="button-edit-user"]').first()).toBeVisible();
  });

  test('deve aprovar veículos pendentes', async ({ page }) => {
    await page.goto('/admin/vehicle-approval');
    
    // Verificar se existem veículos pendentes
    const pendingVehicles = page.locator('[data-testid="pending-vehicle"]');
    
    if (await pendingVehicles.count() > 0) {
      // Aprovar primeiro veículo
      await page.click('[data-testid="button-approve-vehicle"]', { first: true });
      
      // Verificar confirmação
      await expect(page.locator('text=Veículo aprovado com sucesso')).toBeVisible();
    }
  });
});
