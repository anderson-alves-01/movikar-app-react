
import { test, expect } from '@playwright/test';

test.describe('Sistema de Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('deve permitir registro de novo usuário', async ({ page }) => {
    // Navegar para página de registro
    await page.click('text=Entrar');
    await page.click('text=Criar conta');

    // Preencher formulário de registro
    const timestamp = Date.now();
    await page.fill('[data-testid="input-name"]', `Teste E2E ${timestamp}`);
    await page.fill('[data-testid="input-email"]', `teste.e2e.${timestamp}@test.com`);
    await page.fill('[data-testid="input-password"]', 'senha123');
    await page.fill('[data-testid="input-phone"]', '11999999999');
    await page.fill('[data-testid="input-location"]', 'São Paulo');

    // Submeter formulário
    await page.click('[data-testid="button-register"]');

    // Verificar sucesso
    await expect(page.locator('text=Conta criada com sucesso')).toBeVisible();
  });

  test('deve permitir login com credenciais válidas', async ({ page }) => {
    // Navegar para login
    await page.click('text=Entrar');

    // Fazer login
    await page.fill('[data-testid="input-email"]', 'admin@alugae.mobi');
    await page.fill('[data-testid="input-password"]', 'admin123');
    await page.click('[data-testid="button-login"]');

    // Verificar redirecionamento
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('deve exibir erro com credenciais inválidas', async ({ page }) => {
    await page.click('text=Entrar');
    
    await page.fill('[data-testid="input-email"]', 'invalido@test.com');
    await page.fill('[data-testid="input-password"]', 'senhaerrada');
    await page.click('[data-testid="button-login"]');

    await expect(page.locator('text=Credenciais inválidas')).toBeVisible();
  });
});
