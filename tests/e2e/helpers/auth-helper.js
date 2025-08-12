
export class AuthHelper {
  constructor(page) {
    this.page = page;
  }

  async loginAsAdmin() {
    await this.page.goto('/auth');
    await this.page.fill('[data-testid="input-email"]', 'admin@alugae.mobi');
    await this.page.fill('[data-testid="input-password"]', 'admin123');
    await this.page.click('[data-testid="button-login"]');
    await this.page.waitForURL('/');
  }

  async loginAsOwner() {
    await this.page.goto('/auth');
    await this.page.fill('[data-testid="input-email"]', 'owner@test.com');
    await this.page.fill('[data-testid="input-password"]', '123456');
    await this.page.click('[data-testid="button-login"]');
    await this.page.waitForURL('/');
  }

  async loginAsRenter() {
    await this.page.goto('/auth');
    await this.page.fill('[data-testid="input-email"]', 'renter@test.com');
    await this.page.fill('[data-testid="input-password"]', '123456');
    await this.page.click('[data-testid="button-login"]');
    await this.page.waitForURL('/');
  }

  async loginAsVerifiedUser() {
    await this.page.goto('/auth');
    await this.page.fill('[data-testid="input-email"]', 'teste.payment@carshare.com');
    await this.page.fill('[data-testid="input-password"]', 'senha123');
    await this.page.click('[data-testid="button-login"]');
    await this.page.waitForURL('/');
  }

  async logout() {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="logout-button"]');
    await this.page.waitForURL('/');
  }

  async createTestUser(userData = {}) {
    const timestamp = Date.now();
    const defaultData = {
      name: `Teste E2E ${timestamp}`,
      email: `teste.e2e.${timestamp}@test.com`,
      password: 'senha123',
      phone: '11999999999',
      location: 'São Paulo',
      ...userData
    };

    await this.page.goto('/auth');
    await this.page.click('text=Criar conta');
    
    await this.page.fill('[data-testid="input-name"]', defaultData.name);
    await this.page.fill('[data-testid="input-email"]', defaultData.email);
    await this.page.fill('[data-testid="input-password"]', defaultData.password);
    await this.page.fill('[data-testid="input-phone"]', defaultData.phone);
    await this.page.fill('[data-testid="input-location"]', defaultData.location);
    
    await this.page.click('[data-testid="button-register"]');
    
    return defaultData;
  }
}
