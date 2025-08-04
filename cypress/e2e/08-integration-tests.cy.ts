describe('Full Integration Tests', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Complete User Journey - Renter', () => {
    it('should complete full rental process from registration to booking completion', () => {
      const timestamp = Date.now()
      const userData = {
        name: `Integration Test User ${timestamp}`,
        email: `integration${timestamp}@example.com`,
        password: 'testpass123',
        phone: '11999999999',
        location: 'São Paulo, SP'
      }

      // 1. User Registration
      cy.visit('/register')
      cy.registerUser(userData)
      cy.contains('Conta criada com sucesso').should('be.visible')
      cy.checkAuthenticated()

      // 2. Browse Vehicles
      cy.visit('/')
      cy.get('[data-testid="vehicle-grid"]').should('be.visible')
      cy.get('[data-testid^="card-vehicle-"]').should('have.length.at.least', 1)

      // 3. Search for specific vehicle
      cy.get('[data-testid="input-search"]').type('Honda')
      cy.get('[data-testid="button-search"]').click()
      cy.get('[data-testid^="card-vehicle-"]').first().click()

      // 4. View Vehicle Details
      cy.get('[data-testid="vehicle-detail-container"]').should('be.visible')
      cy.get('[data-testid="booking-form"]').should('be.visible')

      // 5. Make Booking
      cy.get('[data-testid="input-start-date"]').type('2025-08-20')
      cy.get('[data-testid="input-end-date"]').type('2025-08-22')
      cy.get('[data-testid="price-breakdown"]').should('be.visible')
      cy.get('[data-testid="button-book-now"]').click()

      // 6. Checkout Process
      cy.url().should('include', '/checkout/')
      cy.get('[data-testid="checkout-container"]').should('be.visible')
      cy.get('[data-testid="payment-summary"]').should('be.visible')

      // 7. Complete Payment
      cy.fillStripePayment()
      cy.get('[data-testid="button-submit-payment"]').click()

      // 8. Booking Confirmation
      cy.contains('Pagamento processado com sucesso').should('be.visible')
      cy.url().should('include', '/booking-confirmation')

      // 9. Check Booking in Account
      cy.visit('/my-bookings')
      cy.get('[data-testid="bookings-list"]').should('be.visible')
      cy.get('[data-testid^="booking-card-"]').should('have.length.at.least', 1)
    })

    it('should complete referral flow with points earning', () => {
      const timestamp = Date.now()
      
      // 1. Admin creates referral link
      cy.loginAsAdmin()
      cy.visit('/rewards')
      cy.get('[data-testid="input-referral-link"]').invoke('val').then((referralLink) => {
        const referralCode = (referralLink as string).split('ref=')[1]
        
        // 2. Logout and register with referral
        cy.get('[data-testid="header-user-menu"]').click()
        cy.get('[data-testid="button-logout"]').click()
        
        // 3. New user registers with referral
        cy.visit(`/register?ref=${referralCode}`)
        cy.get('[data-testid="referral-banner"]').should('be.visible')
        
        cy.registerUser({
          name: `Referred User ${timestamp}`,
          email: `referred${timestamp}@example.com`,
          password: 'password123',
          phone: '11999999999',
          location: 'São Paulo, SP'
        })
        
        // 4. Complete first booking to activate referral
        cy.makeBooking(29, '2025-08-25', '2025-08-27')
        cy.fillStripePayment()
        cy.get('[data-testid="button-submit-payment"]').click()
        
        // 5. Check referrer earned points
        cy.loginAsAdmin()
        cy.visit('/rewards')
        cy.get('[data-testid="text-referral-count"]').should('contain', '1')
        cy.get('[data-testid="text-total-points"]').should('not.contain', '0')
      })
    })
  })

  describe('Complete User Journey - Owner', () => {
    it('should complete vehicle listing and rental management process', () => {
      const timestamp = Date.now()
      
      // 1. Owner registers and subscribes
      cy.registerUser({
        name: `Owner ${timestamp}`,
        email: `owner${timestamp}@example.com`,
        password: 'ownerpass123',
        phone: '11999999999',
        location: 'Rio de Janeiro, RJ'
      })

      // 2. Subscribe to enable vehicle listing
      cy.visit('/subscription-plans')
      cy.get('[data-testid="plan-essential"] [data-testid="button-select-plan"]').click()
      cy.fillStripePayment()
      cy.get('[data-testid="button-submit-payment"]').click()
      cy.contains('Assinatura ativada com sucesso').should('be.visible')

      // 3. Add Vehicle
      cy.visit('/add-vehicle')
      cy.get('[data-testid="input-brand"]').type('Volkswagen')
      cy.get('[data-testid="input-model"]').type(`Test Car ${timestamp}`)
      cy.get('[data-testid="input-year"]').type('2022')
      cy.get('[data-testid="input-price-per-day"]').type('120.00')
      cy.get('[data-testid="select-category"]').select('sedan')
      cy.get('[data-testid="input-location"]').type('Rio de Janeiro, RJ')
      cy.get('[data-testid="textarea-description"]').type('Test vehicle for integration')
      cy.get('[data-testid="button-submit"]').click()
      cy.contains('Veículo criado com sucesso').should('be.visible')

      // 4. Vehicle appears in admin approval queue
      cy.loginAsAdmin()
      cy.visit('/admin/vehicles')
      cy.get('[data-testid="pending-vehicles-table"]').should('contain', `Test Car ${timestamp}`)

      // 5. Admin approves vehicle
      cy.get('[data-testid="button-approve-vehicle"]').last().click()
      cy.contains('Veículo aprovado com sucesso').should('be.visible')

      // 6. Vehicle is now available for rent
      cy.visit('/')
      cy.get('[data-testid="input-search"]').type(`Test Car ${timestamp}`)
      cy.get('[data-testid="button-search"]').click()
      cy.get('[data-testid^="card-vehicle-"]').should('contain', `Test Car ${timestamp}`)

      // 7. Owner manages bookings
      cy.login(`owner${timestamp}@example.com`, 'ownerpass123')
      cy.visit('/my-vehicles')
      cy.get('[data-testid^="vehicle-card-"]').should('contain', `Test Car ${timestamp}`)
    })
  })

  describe('Payment Integration Flow', () => {
    it('should handle complete payment workflow with points and discounts', () => {
      cy.loginAsAdmin()
      
      // 1. Add points to user account
      cy.addPointsToUser(2, 1000)
      
      // 2. Make booking
      cy.makeBooking(29, '2025-08-30', '2025-09-01')
      
      // 3. Apply points discount
      cy.get('[data-testid="input-points-to-use"]').type('500')
      cy.get('[data-testid="button-apply-points"]').click()
      cy.contains('Desconto aplicado').should('be.visible')
      
      // 4. Complete payment with discount
      cy.fillStripePayment()
      cy.get('[data-testid="button-submit-payment"]').click()
      
      // 5. Verify payment processed and points deducted
      cy.contains('Pagamento processado com sucesso').should('be.visible')
      
      // 6. Check updated points balance
      cy.visit('/rewards')
      cy.get('[data-testid="text-available-points"]').should('contain', '500')
    })

    it('should handle subscription payment with annual discount', () => {
      const timestamp = Date.now()
      
      // 1. Register new user
      cy.registerUser({
        name: `Subscriber ${timestamp}`,
        email: `subscriber${timestamp}@example.com`,
        password: 'subpass123',
        phone: '11999999999',
        location: 'Brasília, DF'
      })

      // 2. Select annual subscription
      cy.visit('/subscription-plans')
      cy.get('[data-testid="toggle-annual-billing"]').click()
      cy.get('[data-testid="plan-plus"] [data-testid="button-select-plan"]').click()
      
      // 3. Verify annual discount applied
      cy.get('[data-testid="text-billing-cycle"]').should('contain', 'Anual')
      cy.get('[data-testid="text-discount-applied"]').should('contain', '20%')
      
      // 4. Complete payment
      cy.fillStripePayment()
      cy.get('[data-testid="button-submit-payment"]').click()
      
      // 5. Verify subscription activated
      cy.contains('Assinatura ativada com sucesso').should('be.visible')
      cy.visit('/subscription')
      cy.get('[data-testid="text-current-plan"]').should('contain', 'Plus')
      cy.get('[data-testid="text-subscription-status"]').should('contain', 'Ativa')
    })
  })

  describe('Admin Management Workflow', () => {
    it('should complete full admin management cycle', () => {
      cy.loginAsAdmin()
      
      // 1. Update system settings
      cy.visit('/admin/settings')
      cy.get('[data-testid="input-service-fee"]').clear().type('8')
      cy.get('[data-testid="input-insurance-fee"]').clear().type('18')
      cy.get('[data-testid="button-save-settings"]').click()
      cy.contains('Configurações salvas com sucesso').should('be.visible')
      
      // 2. Verify settings applied in booking
      cy.visit('/vehicle/29')
      cy.get('[data-testid="input-start-date"]').type('2025-09-05')
      cy.get('[data-testid="input-end-date"]').type('2025-09-07')
      
      // Verify new rates are applied (8% service, 18% insurance)
      cy.get('[data-testid="text-service-fee"]').should('contain', 'R$ 15,68') // 8% of R$ 196
      cy.get('[data-testid="text-insurance-fee"]').should('contain', 'R$ 35,28') // 18% of R$ 196
      
      // 3. Manage user accounts
      cy.visit('/admin/users')
      cy.get('[data-testid="input-search-users"]').type('test')
      cy.get('[data-testid="button-search-users"]').click()
      cy.get('[data-testid^="user-row-"]').should('be.visible')
      
      // 4. Review bookings
      cy.visit('/admin/bookings')
      cy.get('[data-testid="bookings-table"]').should('be.visible')
      cy.get('[data-testid="select-booking-status"]').select('confirmed')
      cy.get('[data-testid="button-apply-filters"]').click()
      
      // 5. Monitor dashboard metrics
      cy.visit('/admin/dashboard')
      cy.get('[data-testid="metric-total-users"]').should('be.visible')
      cy.get('[data-testid="metric-total-vehicles"]').should('be.visible')
      cy.get('[data-testid="metric-total-bookings"]').should('be.visible')
      cy.get('[data-testid="metric-total-revenue"]').should('be.visible')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle network failures gracefully', () => {
      cy.loginAsAdmin()
      
      // Simulate network failure during booking
      cy.intercept('POST', '/api/bookings', { forceNetworkError: true }).as('networkError')
      
      cy.visit('/vehicle/29')
      cy.get('[data-testid="input-start-date"]').type('2025-09-10')
      cy.get('[data-testid="input-end-date"]').type('2025-09-12')
      cy.get('[data-testid="button-book-now"]').click()
      
      // Should show appropriate error message
      cy.contains('Erro de conexão').should('be.visible')
      cy.get('[data-testid="button-retry"]').should('be.visible')
    })

    it('should handle authentication expiry during session', () => {
      cy.loginAsAdmin()
      
      // Simulate token expiry
      cy.window().then((win) => {
        win.localStorage.removeItem('auth-storage')
      })
      cy.clearCookies()
      
      // Try to access protected route
      cy.visit('/admin/dashboard')
      
      // Should redirect to login
      cy.url().should('include', '/login')
      cy.contains('Sessão expirada').should('be.visible')
    })

    it('should handle booking conflicts', () => {
      cy.loginAsAdmin()
      
      // Make first booking
      cy.makeBooking(29, '2025-09-15', '2025-09-17')
      cy.fillStripePayment()
      cy.get('[data-testid="button-submit-payment"]').click()
      
      // Try to book same dates
      cy.visit('/vehicle/29')
      cy.get('[data-testid="input-start-date"]').type('2025-09-16')
      cy.get('[data-testid="input-end-date"]').type('2025-09-18')
      cy.get('[data-testid="button-book-now"]').click()
      
      cy.contains('Veículo não disponível').should('be.visible')
    })

    it('should handle payment failures and retry', () => {
      cy.loginAsAdmin()
      cy.makeBooking(29, '2025-09-20', '2025-09-22')
      
      // Use declined test card
      cy.fillStripePayment('4000000000000002')
      cy.get('[data-testid="button-submit-payment"]').click()
      
      // Should show error and allow retry
      cy.contains('Pagamento recusado').should('be.visible')
      
      // Retry with valid card
      cy.fillStripePayment('4242424242424242')
      cy.get('[data-testid="button-submit-payment"]').click()
      
      cy.contains('Pagamento processado com sucesso').should('be.visible')
    })
  })

  describe('Mobile Responsiveness', () => {
    it('should work correctly on mobile viewport', () => {
      cy.viewport('iphone-x')
      
      // Test mobile navigation
      cy.visit('/')
      cy.get('[data-testid="mobile-menu-button"]').click()
      cy.get('[data-testid="mobile-navigation"]').should('be.visible')
      
      // Test mobile booking flow
      cy.loginAsAdmin()
      cy.visit('/vehicle/29')
      cy.get('[data-testid="booking-form"]').should('be.visible')
      
      // Mobile form should be responsive
      cy.get('[data-testid="input-start-date"]').should('be.visible')
      cy.get('[data-testid="input-end-date"]').should('be.visible')
    })

    it('should handle mobile payment flow', () => {
      cy.viewport('iphone-x')
      cy.loginAsAdmin()
      
      cy.makeBooking(29, '2025-09-25', '2025-09-27')
      
      // Mobile checkout should be usable
      cy.get('[data-testid="checkout-container"]').should('be.visible')
      cy.get('[data-testid="payment-form"]').should('be.visible')
      
      cy.fillStripePayment()
      cy.get('[data-testid="button-submit-payment"]').should('be.visible').click()
      
      cy.contains('Pagamento processado com sucesso').should('be.visible')
    })
  })
})