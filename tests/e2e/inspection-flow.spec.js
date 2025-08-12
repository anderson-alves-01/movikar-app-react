
import { test, expect } from '@playwright/test';

test.describe('Fluxo de Vistoria', () => {
  let bookingId;

  test.beforeEach(async ({ page }) => {
    // Login como locatário
    await page.goto('/auth');
    await page.fill('[data-testid="input-email"]', 'renter@test.com');
    await page.fill('[data-testid="input-password"]', '123456');
    await page.click('[data-testid="button-login"]');
    await page.waitForURL('/');
  });

  test('deve completar vistoria do veículo', async ({ page }) => {
    // Navegar para página de vistoria (assumindo booking ID 5)
    await page.goto('/vehicle-inspection?bookingId=5');
    
    // Preencher informações básicas
    await page.fill('[data-testid="input-mileage"]', '50000');
    await page.click('[data-testid="select-fuel-level"]');
    await page.click('text=Tanque Cheio');
    
    // Selecionar condição do veículo
    await page.click('[data-testid="radio-condition-excellent"]');
    
    // Adicionar fotos (simular upload)
    const fileInput = page.locator('[data-testid="input-photo-upload"]');
    await fileInput.setInputFiles({
      name: 'vehicle-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });
    
    // Verificar foto adicionada
    await expect(page.locator('[data-testid="image-photo-0"]')).toBeVisible();
    
    // Aprovar vistoria
    await page.click('[data-testid="radio-approve"]');
    
    // Adicionar observações
    await page.fill('[data-testid="textarea-observations"]', 'Veículo em excelente estado, sem avarias.');
    
    // Finalizar vistoria
    await page.click('[data-testid="button-submit-inspection"]');
    
    // Verificar sucesso
    await expect(page.locator('text=Vistoria criada com sucesso')).toBeVisible();
  });

  test('deve validar campos obrigatórios na vistoria', async ({ page }) => {
    await page.goto('/vehicle-inspection?bookingId=5');
    
    // Tentar submeter sem preencher campos obrigatórios
    await page.click('[data-testid="button-submit-inspection"]');
    
    // Verificar validações
    await expect(page.locator('text=Quilometragem obrigatória')).toBeVisible();
    await expect(page.locator('text=Fotos obrigatórias')).toBeVisible();
  });

  test('deve permitir reprovar vistoria com motivo', async ({ page }) => {
    await page.goto('/vehicle-inspection?bookingId=5');
    
    // Preencher campos básicos
    await page.fill('[data-testid="input-mileage"]', '50000');
    await page.click('[data-testid="select-fuel-level"]');
    await page.click('text=Tanque Cheio');
    
    // Adicionar foto
    const fileInput = page.locator('[data-testid="input-photo-upload"]');
    await fileInput.setInputFiles({
      name: 'vehicle-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });
    
    // Reprovar vistoria
    await page.click('[data-testid="radio-reject"]');
    
    // Preencher motivo da reprovação
    await page.fill('[data-testid="textarea-rejection-reason"]', 'Veículo apresenta riscos na pintura');
    
    // Submeter
    await page.click('[data-testid="button-submit-inspection"]');
    
    // Verificar sucesso
    await expect(page.locator('text=Vistoria criada com sucesso')).toBeVisible();
  });
});
