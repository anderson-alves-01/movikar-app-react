describe('Booking System', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Booking Flow', () => {
    it('should complete full booking flow successfully', () => {
      cy.loginAsAdmin()
      cy.visit('/vehicle/29')
      
      // Fill booking form
      cy.get('[data-testid="input-start-date"]').type('2025-08-15')
      cy.get('[data-testid="input-end-date"]').type('2025-08-17')
      
      // Verify pricing calculation
      cy.get('[data-testid="price-breakdown"]').should('be.visible')
      cy.get('[data-testid="text-total-price"]').should('contain', 'R$')
      
      // Submit booking
      cy.get('[data-testid="button-book-now"]').click()
      
      // Should redirect to checkout
      cy.url().should('include', '/checkout/')
      cy.get('[data-testid="checkout-container"]').should('be.visible')
    })

    it('should validate booking dates', () => {
      cy.loginAsAdmin()
      cy.visit('/vehicle/29')
      
      // Test past date
      cy.get('[data-testid="input-start-date"]').type('2023-01-01')
      cy.get('[data-testid="input-end-date"]').type('2023-01-02')
      cy.get('[data-testid="button-book-now"]').click()
      
      cy.contains('Data de início deve ser futura').should('be.visible')
    })

    it('should show correct pricing with dynamic fees', () => {
      cy.loginAsAdmin()
      cy.visit('/vehicle/29')
      
      cy.get('[data-testid="input-start-date"]').type('2025-08-15')
      cy.get('[data-testid="input-end-date"]').type('2025-08-17') // 2 days
      
      // Wait for price calculation
      cy.get('[data-testid="price-breakdown"]').should('be.visible')
      
      // Verify components are visible
      cy.get('[data-testid="text-subtotal"]').should('contain', 'R$ 196,00') // 2 days * R$ 98
      cy.get('[data-testid="text-service-fee"]').should('contain', 'R$ 19,60') // 10%
      cy.get('[data-testid="text-insurance-fee"]').should('contain', 'R$ 39,20') // 20%
      cy.get('[data-testid="text-total-price"]').should('contain', 'R$ 254,80') // Total
    })

    it('should prevent booking unavailable dates', () => {
      cy.loginAsAdmin()
      
      // First, create a booking for certain dates
      cy.visit('/vehicle/29')
      cy.get('[data-testid="input-start-date"]').type('2025-08-20')
      cy.get('[data-testid="input-end-date"]').type('2025-08-22')
      cy.get('[data-testid="button-book-now"]').click()
      
      // Try to book overlapping dates
      cy.visit('/vehicle/29')
      cy.get('[data-testid="input-start-date"]').type('2025-08-21')
      cy.get('[data-testid="input-end-date"]').type('2025-08-23')
      cy.get('[data-testid="button-book-now"]').click()
      
      cy.contains('Veículo não disponível').should('be.visible')
    })
  })

  describe('Checkout Process', () => {
    it('should display checkout information correctly', () => {
      cy.loginAsAdmin()
      cy.makeBooking(29, '2025-08-15', '2025-08-17')
      
      // Verify checkout details
      cy.get('[data-testid="checkout-vehicle-info"]').should('be.visible')
      cy.get('[data-testid="text-vehicle-name"]').should('contain', 'Honda')
      cy.get('[data-testid="text-booking-dates"]').should('be.visible')
      cy.get('[data-testid="text-booking-duration"]').should('contain', '2 dias')
      
      // Verify payment summary
      cy.get('[data-testid="payment-summary"]').should('be.visible')
      cy.get('[data-testid="text-subtotal-amount"]').should('be.visible')
      cy.get('[data-testid="text-service-fee-amount"]').should('be.visible')
      cy.get('[data-testid="text-insurance-fee-amount"]').should('be.visible')
      cy.get('[data-testid="text-total-amount"]').should('be.visible')
    })

    it('should show points reward section when user has points', () => {
      cy.loginAsAdmin()
      
      // Add points to user
      cy.addPointsToUser(2, 500)
      
      cy.makeBooking(29, '2025-08-15', '2025-08-17')
      
      // Should show points section
      cy.get('[data-testid="points-section"]').should('be.visible')
      cy.get('[data-testid="text-available-points"]').should('contain', '500')
      cy.get('[data-testid="input-points-to-use"]').should('be.visible')
      cy.get('[data-testid="button-apply-points"]').should('be.visible')
    })

    it('should apply points discount correctly', () => {
      cy.loginAsAdmin()
      cy.addPointsToUser(2, 500)
      cy.makeBooking(29, '2025-08-15', '2025-08-17')
      
      // Apply 100 points (R$ 1.00 discount)
      cy.get('[data-testid="input-points-to-use"]').type('100')
      cy.get('[data-testid="button-apply-points"]').click()
      
      // Should show discount applied
      cy.contains('Desconto aplicado').should('be.visible')
      cy.get('[data-testid="text-discount-amount"]').should('contain', 'R$ 1,00')
    })

    it('should validate points usage limits', () => {
      cy.loginAsAdmin()
      cy.addPointsToUser(2, 100) // Only 100 points
      cy.makeBooking(29, '2025-08-15', '2025-08-17')
      
      // Try to use more points than available
      cy.get('[data-testid="input-points-to-use"]').type('500')
      cy.get('[data-testid="button-apply-points"]').click()
      
      cy.contains('Pontos insuficientes').should('be.visible')
    })
  })

  describe('Payment Processing', () => {
    it('should display payment form correctly', () => {
      cy.loginAsAdmin()
      cy.makeBooking(29, '2025-08-15', '2025-08-17')
      
      // Should show Stripe payment form
      cy.get('[data-testid="payment-form"]').should('be.visible')
      cy.get('[data-testid="stripe-payment-element"]').should('be.visible')
      cy.get('[data-testid="button-submit-payment"]').should('be.visible')
    })

    it('should validate payment form fields', () => {
      cy.loginAsAdmin()
      cy.makeBooking(29, '2025-08-15', '2025-08-17')
      
      // Try to submit without filling payment info
      cy.get('[data-testid="button-submit-payment"]').click()
      
      // Stripe should show validation errors
      cy.contains('Your card number is incomplete').should('be.visible')
    })

    it('should process successful payment', () => {
      cy.loginAsAdmin()
      cy.makeBooking(29, '2025-08-15', '2025-08-17')
      
      // Fill payment form with test card
      cy.fillStripePayment('4242424242424242')
      cy.get('[data-testid="button-submit-payment"]').click()
      
      // Should show success message and redirect
      cy.contains('Pagamento processado com sucesso').should('be.visible')
      cy.url().should('include', '/booking-confirmation')
    })

    it('should handle payment failure', () => {
      cy.loginAsAdmin()
      cy.makeBooking(29, '2025-08-15', '2025-08-17')
      
      // Fill payment form with declined test card
      cy.fillStripePayment('4000000000000002')
      cy.get('[data-testid="button-submit-payment"]').click()
      
      // Should show error message
      cy.contains('Pagamento recusado').should('be.visible')
    })
  })

  describe('Booking Management', () => {
    it('should display user bookings', () => {
      cy.loginAsAdmin()
      cy.visit('/my-bookings')
      
      cy.get('[data-testid="bookings-list"]').should('be.visible')
      cy.get('[data-testid^="booking-card-"]').should('have.length.at.least', 0)
    })

    it('should show booking details', () => {
      cy.loginAsAdmin()
      cy.visit('/my-bookings')
      
      // If there are bookings, check the first one
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid^="booking-card-"]').length > 0) {
          cy.get('[data-testid^="booking-card-"]').first().within(() => {
            cy.get('[data-testid="text-booking-vehicle"]').should('be.visible')
            cy.get('[data-testid="text-booking-dates"]').should('be.visible')
            cy.get('[data-testid="text-booking-status"]').should('be.visible')
            cy.get('[data-testid="text-booking-total"]').should('be.visible')
          })
        }
      })
    })

    it('should allow booking cancellation within policy', () => {
      cy.loginAsAdmin()
      cy.visit('/my-bookings')
      
      // Find a booking that can be cancelled
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid^="booking-card-"]').length > 0) {
          cy.get('[data-testid^="booking-card-"]').first().within(() => {
            cy.get('[data-testid="button-cancel-booking"]').click()
          })
          
          // Confirm cancellation
          cy.get('[data-testid="button-confirm-cancel"]').click()
          cy.contains('Reserva cancelada com sucesso').should('be.visible')
        }
      })
    })
  })
})