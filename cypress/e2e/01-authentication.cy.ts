describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear any existing session
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.visit('/')
  })

  describe('Login', () => {
    it('should display login form correctly', () => {
      cy.visit('/login')
      cy.get('[data-testid="input-email"]').should('be.visible')
      cy.get('[data-testid="input-password"]').should('be.visible')
      cy.get('[data-testid="button-submit"]').should('be.visible')
      cy.get('[data-testid="link-register"]').should('be.visible')
    })

    it('should show validation errors for empty fields', () => {
      cy.visit('/login')
      cy.get('[data-testid="button-submit"]').click()
      cy.contains('E-mail é obrigatório').should('be.visible')
      cy.contains('Senha é obrigatória').should('be.visible')
    })

    it('should show error for invalid credentials', () => {
      cy.visit('/login')
      cy.get('[data-testid="input-email"]').type('invalid@email.com')
      cy.get('[data-testid="input-password"]').type('wrongpassword')
      cy.get('[data-testid="button-submit"]').click()
      cy.contains('Credenciais inválidas').should('be.visible')
    })

    it('should login successfully with valid admin credentials', () => {
      cy.visit('/login')
      cy.get('[data-testid="input-email"]').type('admin@alugae.mobi')
      cy.get('[data-testid="input-password"]').type('admin123')
      cy.get('[data-testid="button-submit"]').click()
      
      // Should redirect to dashboard
      cy.url().should('include', '/')
      cy.get('[data-testid="header-user-menu"]').should('be.visible')
      cy.get('[data-testid="text-user-name"]').should('contain', 'Teste Completo Final')
    })

    it('should persist login session across page reloads', () => {
      cy.loginAsAdmin()
      cy.reload()
      cy.get('[data-testid="header-user-menu"]').should('be.visible')
    })
  })

  describe('Registration', () => {
    it('should display registration form correctly', () => {
      cy.visit('/register')
      cy.get('[data-testid="input-name"]').should('be.visible')
      cy.get('[data-testid="input-email"]').should('be.visible')
      cy.get('[data-testid="input-password"]').should('be.visible')
      cy.get('[data-testid="input-phone"]').should('be.visible')
      cy.get('[data-testid="input-location"]').should('be.visible')
      cy.get('[data-testid="button-submit"]').should('be.visible')
      cy.get('[data-testid="link-login"]').should('be.visible')
    })

    it('should show validation errors for empty fields', () => {
      cy.visit('/register')
      cy.get('[data-testid="button-submit"]').click()
      cy.contains('Nome é obrigatório').should('be.visible')
      cy.contains('E-mail é obrigatório').should('be.visible')
      cy.contains('Senha é obrigatória').should('be.visible')
    })

    it('should register a new user successfully', () => {
      const timestamp = Date.now()
      const userData = {
        name: `Test User ${timestamp}`,
        email: `test${timestamp}@example.com`,
        password: 'testpassword123',
        phone: '11999999999',
        location: 'São Paulo, SP'
      }

      cy.visit('/register')
      cy.get('[data-testid="input-name"]').type(userData.name)
      cy.get('[data-testid="input-email"]').type(userData.email)
      cy.get('[data-testid="input-password"]').type(userData.password)
      cy.get('[data-testid="input-phone"]').type(userData.phone)
      cy.get('[data-testid="input-location"]').type(userData.location)
      cy.get('[data-testid="button-submit"]').click()

      // Should redirect to home page after successful registration
      cy.url().should('include', '/')
      cy.get('[data-testid="header-user-menu"]').should('be.visible')
    })

    it('should show error for duplicate email registration', () => {
      cy.visit('/register')
      cy.get('[data-testid="input-name"]').type('Test User')
      cy.get('[data-testid="input-email"]').type('admin@alugae.mobi') // Existing email
      cy.get('[data-testid="input-password"]').type('testpassword123')
      cy.get('[data-testid="input-phone"]').type('11999999999')
      cy.get('[data-testid="input-location"]').type('São Paulo, SP')
      cy.get('[data-testid="button-submit"]').click()

      cy.contains('E-mail já está em uso').should('be.visible')
    })
  })

  describe('Logout', () => {
    it('should logout user successfully', () => {
      cy.loginAsAdmin()
      cy.get('[data-testid="header-user-menu"]').click()
      cy.get('[data-testid="button-logout"]').click()
      
      // Should redirect to home page and show login button
      cy.url().should('include', '/')
      cy.get('[data-testid="button-login"]').should('be.visible')
      cy.get('[data-testid="header-user-menu"]').should('not.exist')
    })

    it('should clear all session data on logout', () => {
      cy.loginAsAdmin()
      cy.get('[data-testid="header-user-menu"]').click()
      cy.get('[data-testid="button-logout"]').click()
      
      // Verify cookies are cleared
      cy.getCookies().should('be.empty')
      
      // Verify local storage is cleared
      cy.window().then((win) => {
        expect(win.localStorage.getItem('auth-storage')).to.be.null
      })
    })
  })

  describe('Referral System', () => {
    it('should handle referral link registration', () => {
      const timestamp = Date.now()
      const userData = {
        name: `Referred User ${timestamp}`,
        email: `referred${timestamp}@example.com`,
        password: 'testpassword123',
        phone: '11999999999',
        location: 'São Paulo, SP'
      }

      // Visit registration with referral code
      cy.visit('/register?ref=TESTCODE')
      
      // Should show referral banner
      cy.get('[data-testid="referral-banner"]').should('be.visible')
      cy.get('[data-testid="text-referral-code"]').should('contain', 'TESTCODE')

      // Fill registration form
      cy.get('[data-testid="input-name"]').type(userData.name)
      cy.get('[data-testid="input-email"]').type(userData.email)
      cy.get('[data-testid="input-password"]').type(userData.password)
      cy.get('[data-testid="input-phone"]').type(userData.phone)
      cy.get('[data-testid="input-location"]').type(userData.location)
      cy.get('[data-testid="button-submit"]').click()

      // Should show success message
      cy.contains('Conta criada com sucesso').should('be.visible')
    })
  })
})