describe('Vehicle Management', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Vehicle Listings', () => {
    it('should display vehicle listings on home page', () => {
      cy.visit('/')
      cy.get('[data-testid="vehicle-grid"]').should('be.visible')
      cy.get('[data-testid^="card-vehicle-"]').should('have.length.at.least', 1)
    })

    it('should show vehicle details correctly', () => {
      cy.visit('/')
      cy.get('[data-testid^="card-vehicle-"]').first().within(() => {
        cy.get('[data-testid^="text-brand-"]').should('be.visible')
        cy.get('[data-testid^="text-model-"]').should('be.visible')
        cy.get('[data-testid^="text-price-"]').should('be.visible')
        cy.get('[data-testid^="img-vehicle-"]').should('be.visible')
      })
    })

    it('should navigate to vehicle detail page when clicked', () => {
      cy.visit('/')
      cy.get('[data-testid^="card-vehicle-"]').first().click()
      cy.url().should('include', '/vehicle/')
      cy.get('[data-testid="vehicle-detail-container"]').should('be.visible')
    })

    it('should filter vehicles by search', () => {
      cy.visit('/')
      cy.get('[data-testid="input-search"]').type('Honda')
      cy.get('[data-testid="button-search"]').click()
      
      cy.get('[data-testid^="card-vehicle-"]').each(($el) => {
        cy.wrap($el).should('contain', 'Honda')
      })
    })

    it('should filter vehicles by location', () => {
      cy.visit('/')
      cy.get('[data-testid="select-location"]').click()
      cy.get('[data-testid="option-brasilia"]').click()
      
      cy.get('[data-testid^="card-vehicle-"]').should('have.length.at.least', 1)
    })
  })

  describe('Vehicle Detail Page', () => {
    it('should display all vehicle information', () => {
      cy.visit('/vehicle/29')
      
      // Basic info
      cy.get('[data-testid="text-vehicle-brand"]').should('be.visible')
      cy.get('[data-testid="text-vehicle-model"]').should('be.visible')
      cy.get('[data-testid="text-vehicle-year"]').should('be.visible')
      cy.get('[data-testid="text-price-per-day"]').should('be.visible')
      
      // Images
      cy.get('[data-testid="vehicle-images"]').should('be.visible')
      
      // Features
      cy.get('[data-testid="vehicle-features"]').should('be.visible')
      
      // Booking form
      cy.get('[data-testid="booking-form"]').should('be.visible')
    })

    it('should show correct pricing calculation', () => {
      cy.loginAsAdmin()
      cy.visit('/vehicle/29')
      
      // Fill booking dates
      cy.get('[data-testid="input-start-date"]').type('2025-08-15')
      cy.get('[data-testid="input-end-date"]').type('2025-08-17')
      
      // Check price breakdown appears
      cy.get('[data-testid="price-breakdown"]').should('be.visible')
      cy.get('[data-testid="text-daily-rate"]').should('contain', 'R$ 98,00')
      cy.get('[data-testid="text-service-fee"]').should('be.visible')
      cy.get('[data-testid="text-insurance-fee"]').should('be.visible')
      cy.get('[data-testid="text-total-price"]').should('be.visible')
    })

    it('should validate booking dates', () => {
      cy.loginAsAdmin()
      cy.visit('/vehicle/29')
      
      // Try to book with end date before start date
      cy.get('[data-testid="input-start-date"]').type('2025-08-17')
      cy.get('[data-testid="input-end-date"]').type('2025-08-15')
      cy.get('[data-testid="button-book-now"]').click()
      
      cy.contains('Data de devolução deve ser posterior').should('be.visible')
    })

    it('should require login for booking', () => {
      cy.visit('/vehicle/29')
      cy.get('[data-testid="input-start-date"]').type('2025-08-15')
      cy.get('[data-testid="input-end-date"]').type('2025-08-17')
      cy.get('[data-testid="button-book-now"]').click()
      
      cy.contains('Login necessário').should('be.visible')
    })
  })

  describe('Vehicle Creation (Admin)', () => {
    it('should allow admin to create new vehicle', () => {
      cy.loginAsAdmin()
      cy.visit('/add-vehicle')
      
      const timestamp = Date.now()
      cy.get('[data-testid="input-brand"]').type('Toyota')
      cy.get('[data-testid="input-model"]').type(`Test Car ${timestamp}`)
      cy.get('[data-testid="input-year"]').type('2023')
      cy.get('[data-testid="input-price-per-day"]').type('150.00')
      cy.get('[data-testid="select-category"]').select('suv')
      cy.get('[data-testid="input-location"]').type('São Paulo, SP')
      cy.get('[data-testid="textarea-description"]').type('Test vehicle description')
      
      cy.get('[data-testid="button-submit"]').click()
      cy.contains('Veículo criado com sucesso').should('be.visible')
    })

    it('should validate required fields for vehicle creation', () => {
      cy.loginAsAdmin()
      cy.visit('/add-vehicle')
      cy.get('[data-testid="button-submit"]').click()
      
      cy.contains('Marca é obrigatória').should('be.visible')
      cy.contains('Modelo é obrigatório').should('be.visible')
      cy.contains('Ano é obrigatório').should('be.visible')
    })

    it('should not allow non-admin to access vehicle creation', () => {
      // Create and login as regular user first
      const timestamp = Date.now()
      cy.registerUser({
        name: `Regular User ${timestamp}`,
        email: `regular${timestamp}@example.com`,
        password: 'password123',
        phone: '11999999999',
        location: 'São Paulo, SP'
      })
      
      cy.visit('/add-vehicle')
      cy.url().should('include', '/') // Should redirect to home
      cy.contains('Acesso negado').should('be.visible')
    })
  })

  describe('Vehicle Search and Filters', () => {
    it('should search vehicles by brand', () => {
      cy.visit('/')
      cy.get('[data-testid="input-search"]').type('Honda')
      cy.get('[data-testid="button-search"]').click()
      
      cy.get('[data-testid^="card-vehicle-"]').should('have.length.at.least', 1)
      cy.get('[data-testid^="text-brand-"]').should('contain', 'Honda')
    })

    it('should filter by price range', () => {
      cy.visit('/')
      cy.get('[data-testid="select-price-min"]').select('50')
      cy.get('[data-testid="select-price-max"]').select('100')
      cy.get('[data-testid="button-apply-filters"]').click()
      
      cy.get('[data-testid^="card-vehicle-"]').should('have.length.at.least', 1)
    })

    it('should filter by transmission type', () => {
      cy.visit('/')
      cy.get('[data-testid="select-transmission"]').select('automatic')
      cy.get('[data-testid="button-apply-filters"]').click()
      
      cy.get('[data-testid^="card-vehicle-"]').should('have.length.at.least', 1)
    })

    it('should clear all filters', () => {
      cy.visit('/')
      cy.get('[data-testid="input-search"]').type('Honda')
      cy.get('[data-testid="select-transmission"]').select('automatic')
      cy.get('[data-testid="button-clear-filters"]').click()
      
      cy.get('[data-testid="input-search"]').should('have.value', '')
      cy.get('[data-testid="select-transmission"]').should('have.value', '')
    })
  })
})