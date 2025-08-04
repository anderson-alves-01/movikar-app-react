describe('Subscription System', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Subscription Plans', () => {
    it('should display subscription plans correctly', () => {
      cy.visit('/subscription-plans')
      
      cy.get('[data-testid="subscription-plans-container"]').should('be.visible')
      cy.get('[data-testid="plan-essential"]').should('be.visible')
      cy.get('[data-testid="plan-plus"]').should('be.visible')
      
      // Check plan details
      cy.get('[data-testid="plan-essential"]').within(() => {
        cy.get('[data-testid="text-plan-name"]').should('contain', 'Essential')
        cy.get('[data-testid="text-plan-price"]').should('be.visible')
        cy.get('[data-testid="text-plan-features"]').should('be.visible')
        cy.get('[data-testid="button-select-plan"]').should('be.visible')
      })
      
      cy.get('[data-testid="plan-plus"]').within(() => {
        cy.get('[data-testid="text-plan-name"]').should('contain', 'Plus')
        cy.get('[data-testid="text-plan-price"]').should('be.visible')
        cy.get('[data-testid="text-plan-features"]').should('be.visible')
        cy.get('[data-testid="button-select-plan"]').should('be.visible')
      })
    })

    it('should require authentication to select a plan', () => {
      cy.visit('/subscription-plans')
      
      cy.get('[data-testid="plan-essential"] [data-testid="button-select-plan"]').click()
      
      // Should redirect to login
      cy.url().should('include', '/login')
      cy.contains('Faça login para continuar').should('be.visible')
    })

    it('should redirect to subscription checkout when authenticated', () => {
      cy.loginAsAdmin()
      cy.visit('/subscription-plans')
      
      cy.get('[data-testid="plan-essential"] [data-testid="button-select-plan"]').click()
      
      // Should redirect to subscription checkout
      cy.url().should('include', '/subscription-checkout')
      cy.get('[data-testid="subscription-checkout-container"]').should('be.visible')
    })

    it('should show annual discount option', () => {
      cy.visit('/subscription-plans')
      
      cy.get('[data-testid="toggle-annual-billing"]').should('be.visible')
      cy.get('[data-testid="toggle-annual-billing"]').click()
      
      // Prices should update to show annual discount
      cy.get('[data-testid="text-annual-savings"]').should('be.visible')
      cy.get('[data-testid="text-discount-percentage"]').should('contain', '20%')
    })
  })

  describe('Subscription Checkout', () => {
    it('should display subscription checkout correctly', () => {
      cy.loginAsAdmin()
      cy.visit('/subscription-checkout?plan=essential&billing=monthly')
      
      cy.get('[data-testid="subscription-checkout-container"]').should('be.visible')
      cy.get('[data-testid="subscription-summary"]').should('be.visible')
      cy.get('[data-testid="text-selected-plan"]').should('contain', 'Essential')
      cy.get('[data-testid="text-billing-cycle"]').should('contain', 'Mensal')
      cy.get('[data-testid="text-subscription-price"]').should('be.visible')
    })

    it('should show points discount section when user has points', () => {
      cy.loginAsAdmin()
      cy.addPointsToUser(2, 1000)
      cy.visit('/subscription-checkout?plan=essential&billing=monthly')
      
      cy.get('[data-testid="points-section"]').should('be.visible')
      cy.get('[data-testid="text-available-points"]').should('contain', '1000')
      cy.get('[data-testid="input-points-to-use"]').should('be.visible')
      cy.get('[data-testid="button-apply-points"]').should('be.visible')
    })

    it('should apply points discount to subscription', () => {
      cy.loginAsAdmin()
      cy.addPointsToUser(2, 500)
      cy.visit('/subscription-checkout?plan=essential&billing=monthly')
      
      // Apply 300 points (R$ 3.00 discount)
      cy.get('[data-testid="input-points-to-use"]').type('300')
      cy.get('[data-testid="button-apply-points"]').click()
      
      cy.contains('Desconto aplicado').should('be.visible')
      cy.get('[data-testid="text-discount-amount"]').should('contain', 'R$ 3,00')
      cy.get('[data-testid="text-final-total"]').should('be.visible')
    })

    it('should process subscription payment successfully', () => {
      cy.loginAsAdmin()
      cy.visit('/subscription-checkout?plan=essential&billing=monthly')
      
      cy.fillStripePayment()
      cy.get('[data-testid="button-submit-payment"]').click()
      
      // Should show success message
      cy.contains('Assinatura ativada com sucesso').should('be.visible')
      cy.url().should('include', '/dashboard')
    })

    it('should handle subscription payment failure', () => {
      cy.loginAsAdmin()
      cy.visit('/subscription-checkout?plan=essential&billing=monthly')
      
      // Use declined test card
      cy.fillStripePayment('4000000000000002')
      cy.get('[data-testid="button-submit-payment"]').click()
      
      cy.contains('Pagamento recusado').should('be.visible')
    })

    it('should calculate correct pricing for annual billing', () => {
      cy.loginAsAdmin()
      cy.visit('/subscription-checkout?plan=essential&billing=annual')
      
      cy.get('[data-testid="text-billing-cycle"]').should('contain', 'Anual')
      cy.get('[data-testid="text-discount-applied"]').should('contain', '20%')
      cy.get('[data-testid="text-original-price"]').should('be.visible')
      cy.get('[data-testid="text-discounted-price"]').should('be.visible')
    })
  })

  describe('Subscription Management', () => {
    it('should display current subscription status', () => {
      cy.loginAsAdmin()
      cy.visit('/subscription')
      
      cy.get('[data-testid="subscription-status-card"]').should('be.visible')
      cy.get('[data-testid="text-current-plan"]').should('be.visible')
      cy.get('[data-testid="text-subscription-status"]').should('be.visible')
      cy.get('[data-testid="text-next-billing-date"]').should('be.visible')
    })

    it('should show subscription benefits', () => {
      cy.loginAsAdmin()
      cy.visit('/subscription')
      
      cy.get('[data-testid="subscription-benefits"]').should('be.visible')
      cy.get('[data-testid="text-max-listings"]').should('be.visible')
      cy.get('[data-testid="text-highlights-available"]').should('be.visible')
      cy.get('[data-testid="text-priority-support"]').should('be.visible')
    })

    it('should allow subscription plan upgrade', () => {
      cy.loginAsAdmin()
      cy.visit('/subscription')
      
      // If user has Essential plan, should allow upgrade to Plus
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="button-upgrade-plan"]').length > 0) {
          cy.get('[data-testid="button-upgrade-plan"]').click()
          cy.url().should('include', '/subscription-plans')
        }
      })
    })

    it('should allow subscription cancellation', () => {
      cy.loginAsAdmin()
      cy.visit('/subscription')
      
      cy.get('[data-testid="button-cancel-subscription"]').click()
      
      // Should show cancellation confirmation
      cy.get('[data-testid="cancel-subscription-modal"]').should('be.visible')
      cy.get('[data-testid="text-cancellation-warning"]').should('be.visible')
      cy.get('[data-testid="button-confirm-cancel"]').should('be.visible')
      cy.get('[data-testid="button-keep-subscription"]').should('be.visible')
    })

    it('should confirm subscription cancellation', () => {
      cy.loginAsAdmin()
      cy.visit('/subscription')
      
      cy.get('[data-testid="button-cancel-subscription"]').click()
      cy.get('[data-testid="button-confirm-cancel"]').click()
      
      cy.contains('Assinatura cancelada com sucesso').should('be.visible')
      cy.get('[data-testid="text-subscription-status"]').should('contain', 'Cancelada')
    })

    it('should show subscription history', () => {
      cy.loginAsAdmin()
      cy.visit('/subscription')
      
      cy.get('[data-testid="subscription-history"]').should('be.visible')
      cy.get('[data-testid="subscription-payments-list"]').should('exist')
    })
  })

  describe('Subscription Features', () => {
    it('should enforce vehicle listing limits for free users', () => {
      // Create a user without subscription
      const timestamp = Date.now()
      cy.registerUser({
        name: `Free User ${timestamp}`,
        email: `free${timestamp}@example.com`,
        password: 'password123',
        phone: '11999999999',
        location: 'São Paulo, SP'
      })
      
      cy.visit('/add-vehicle')
      
      // Should show upgrade prompt for free users trying to add vehicles
      cy.contains('Upgrade necessário').should('be.visible')
      cy.get('[data-testid="button-upgrade-subscription"]').should('be.visible')
    })

    it('should allow unlimited vehicles for Plus subscribers', () => {
      cy.loginAsAdmin() // Admin has Plus subscription
      cy.visit('/add-vehicle')
      
      // Should show vehicle creation form
      cy.get('[data-testid="vehicle-form"]').should('be.visible')
      cy.get('[data-testid="input-brand"]').should('be.visible')
    })

    it('should show highlight options for subscribers', () => {
      cy.loginAsAdmin()
      cy.visit('/my-vehicles')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid^="vehicle-card-"]').length > 0) {
          cy.get('[data-testid^="vehicle-card-"]').first().within(() => {
            cy.get('[data-testid="button-highlight-vehicle"]').should('be.visible')
          })
        }
      })
    })

    it('should track highlight usage', () => {
      cy.loginAsAdmin()
      cy.visit('/my-vehicles')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="button-highlight-vehicle"]').length > 0) {
          cy.get('[data-testid="button-highlight-vehicle"]').first().click()
          
          cy.get('[data-testid="highlight-options"]').should('be.visible')
          cy.get('[data-testid="button-premium-highlight"]').click()
          
          cy.contains('Veículo destacado com sucesso').should('be.visible')
          
          // Check highlights usage in subscription page
          cy.visit('/subscription')
          cy.get('[data-testid="text-highlights-used"]').should('contain', '1')
        }
      })
    })
  })
})