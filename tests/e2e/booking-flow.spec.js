
import { test, expect } from '@playwright/test';

test.describe('Fluxo de Reserva', () => {
  test.beforeEach(async ({ page }) => {
    // Login como usuário verificado
    await page.goto('/auth');
    await page.fill('[data-testid="input-email"]', 'teste.payment@carshare.com');
    await page.fill('[data-testid="input-password"]', 'senha123');
    await page.click('[data-testid="button-login"]');
    await page.waitForURL('/');
  });

  test('deve completar fluxo de reserva completo', async ({ page }) => {
    // 1. Navegar para veículos
    await page.goto('/vehicles');
    
    // 2. Selecionar veículo
    await page.click('[data-testid="vehicle-card"]', { first: true });
    
    // 3. Agendar reserva
    await page.click('[data-testid="button-book-vehicle"]');
    
    // 4. Preencher datas
    await page.fill('[data-testid="input-start-date"]', '2025-02-10');
    await page.fill('[data-testid="input-end-date"]', '2025-02-15');
    
    // 5. Continuar para checkout
    await page.click('[data-testid="button-continue-booking"]');
    
    // 6. Verificar página de checkout
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.locator('text=Finalizar Reserva')).toBeVisible();
    
    // 7. Preencher dados de pagamento (simulado)
    await page.click('[data-testid="radio-card"]');
    
    // 8. Finalizar
    await page.click('[data-testid="button-finalize-booking"]');
    
    // 9. Verificar sucesso
    await expect(page).toHaveURL(/\/payment-success/);
    await expect(page.locator('text=Reserva confirmada')).toBeVisible();
  });

  test('deve validar campos obrigatórios na reserva', async ({ page }) => {
    await page.goto('/vehicles');
    await page.click('[data-testid="vehicle-card"]', { first: true });
    await page.click('[data-testid="button-book-vehicle"]');
    
    // Tentar submeter sem datas
    await page.click('[data-testid="button-continue-booking"]');
    
    // Verificar validação
    await expect(page.locator('text=Data de início é obrigatória')).toBeVisible();
    await expect(page.locator('text=Data de fim é obrigatória')).toBeVisible();
  });
});
