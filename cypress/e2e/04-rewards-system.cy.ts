describe('Rewards and Referral System', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Rewards Balance', () => {
    it('should display user rewards balance', () => {
      cy.loginAsAdmin()
      cy.visit('/rewards')
      
      cy.get('[data-testid="rewards-balance-card"]').should('be.visible')
      cy.get('[data-testid="text-total-points"]').should('be.visible')
      cy.get('[data-testid="text-available-points"]').should('be.visible')
      cy.get('[data-testid="text-used-points"]').should('be.visible')
    })

    it('should show rewards transaction history', () => {
      cy.loginAsAdmin()
      cy.visit('/rewards')
      
      cy.get('[data-testid="rewards-history"]').should('be.visible')
      cy.get('[data-testid="rewards-transactions-list"]').should('exist')
    })

    it('should display referral statistics', () => {
      cy.loginAsAdmin()
      cy.visit('/rewards')
      
      cy.get('[data-testid="referral-stats"]').should('be.visible')
      cy.get('[data-testid="text-referral-count"]').should('be.visible')
      cy.get('[data-testid="text-successful-referrals"]').should('be.visible')
    })
  })

  describe('Referral System', () => {
    it('should generate referral link', () => {
      cy.loginAsAdmin()
      cy.visit('/rewards')
      
      cy.get('[data-testid="referral-link-section"]').should('be.visible')
      cy.get('[data-testid="input-referral-link"]').should('not.be.empty')
      cy.get('[data-testid="button-copy-referral-link"]').should('be.visible')
    })

    it('should copy referral link to clipboard', () => {
      cy.loginAsAdmin()
      cy.visit('/rewards')
      
      cy.get('[data-testid="button-copy-referral-link"]').click()
      cy.contains('Link copiado').should('be.visible')
    })

    it('should track referral registration', () => {
      cy.loginAsAdmin()
      cy.visit('/rewards')
      
      // Get referral code
      cy.get('[data-testid="input-referral-link"]').invoke('val').then((referralLink) => {
        const referralCode = (referralLink as string).split('ref=')[1]
        
        // Register new user with referral
        const timestamp = Date.now()
        cy.visit(`/register?ref=${referralCode}`)
        
        cy.get('[data-testid="referral-banner"]').should('be.visible')
        cy.get('[data-testid="text-referral-code"]').should('contain', referralCode)
        
        // Complete registration
        cy.registerUser({
          name: `Referred User ${timestamp}`,
          email: `referred${timestamp}@example.com`,
          password: 'password123',
          phone: '11999999999',
          location: 'São Paulo, SP'
        })
        
        // Check that referral was tracked
        cy.loginAsAdmin()
        cy.visit('/rewards')
        cy.get('[data-testid="text-referral-count"]').should('contain', '1')
      })
    })

    it('should prevent self-referral', () => {
      cy.loginAsAdmin()
      cy.visit('/rewards')
      
      // Get own referral code
      cy.get('[data-testid="input-referral-link"]').invoke('val').then((referralLink) => {
        const referralCode = (referralLink as string).split('ref=')[1]
        
        // Logout and try to register with own referral code
        cy.get('[data-testid="header-user-menu"]').click()
        cy.get('[data-testid="button-logout"]').click()
        
        const timestamp = Date.now()
        cy.visit(`/register?ref=${referralCode}`)
        
        cy.registerUser({
          name: `Self Referred ${timestamp}`,
          email: `admin+self${timestamp}@alugae.mobi`,
          password: 'password123',
          phone: '11999999999',
          location: 'São Paulo, SP'
        })
        
        // Should show error about self-referral
        cy.contains('Não é possível usar seu próprio código').should('be.visible')
      })
    })
  })

  describe('Points Usage', () => {
    it('should show points section in checkout when user has points', () => {
      cy.loginAsAdmin()
      
      // Add points to user
      cy.addPointsToUser(2, 500)
      
      // Make a booking
      cy.makeBooking(29, '2025-08-15', '2025-08-17')
      
      // Should show points section
      cy.get('[data-testid="points-section"]').should('be.visible')
      cy.get('[data-testid="text-available-points"]').should('contain', '500')
      cy.get('[data-testid="input-points-to-use"]').should('be.visible')
      cy.get('[data-testid="button-apply-points"]').should('be.visible')
    })

    it('should apply points discount correctly', () => {
      cy.loginAsAdmin()
      cy.addPointsToUser(2, 1000)
      cy.makeBooking(29, '2025-08-15', '2025-08-17')
      
      // Apply 500 points (R$ 5.00 discount)
      cy.get('[data-testid="input-points-to-use"]').type('500')
      cy.get('[data-testid="button-apply-points"]').click()
      
      // Should show success message
      cy.contains('Desconto aplicado').should('be.visible')
      cy.get('[data-testid="text-discount-amount"]').should('contain', 'R$ 5,00')
      
      // Total should be reduced
      cy.get('[data-testid="text-final-total"]').should('be.visible')
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

    it('should not exceed total booking amount with points', () => {
      cy.loginAsAdmin()
      cy.addPointsToUser(2, 50000) // 50000 points = R$ 500
      cy.makeBooking(29, '2025-08-15', '2025-08-17')
      
      // Get total amount first
      cy.get('[data-testid="text-total-amount"]').invoke('text').then((totalText) => {
        const totalAmount = parseFloat(totalText.replace('R$', '').replace(',', '.'))
        const maxPoints = Math.floor(totalAmount * 100)
        
        // Try to use more points than booking total
        cy.get('[data-testid="input-points-to-use"]').type((maxPoints + 100).toString())
        cy.get('[data-testid="button-apply-points"]').click()
        
        cy.contains('Pontos excedem o valor total').should('be.visible')
      })
    })

    it('should update points balance after usage', () => {
      cy.loginAsAdmin()
      cy.addPointsToUser(2, 1000)
      
      // Check initial balance
      cy.visit('/rewards')
      cy.get('[data-testid="text-available-points"]').should('contain', '1000')
      
      // Use points in booking
      cy.makeBooking(29, '2025-08-15', '2025-08-17')
      cy.get('[data-testid="input-points-to-use"]').type('200')
      cy.get('[data-testid="button-apply-points"]').click()
      
      // Complete payment
      cy.fillStripePayment()
      cy.get('[data-testid="button-submit-payment"]').click()
      
      // Check updated balance
      cy.visit('/rewards')
      cy.get('[data-testid="text-available-points"]').should('contain', '800')
    })
  })

  describe('Points Earning', () => {
    it('should earn points for successful bookings', () => {
      cy.loginAsAdmin()
      
      // Check initial balance
      cy.visit('/rewards')
      cy.get('[data-testid="text-total-points"]').invoke('text').then((initialText) => {
        const initialPoints = parseInt(initialText.replace(/\D/g, ''))
        
        // Complete a booking
        cy.makeBooking(29, '2025-08-15', '2025-08-17')
        cy.fillStripePayment()
        cy.get('[data-testid="button-submit-payment"]').click()
        
        // Wait for booking completion
        cy.contains('Pagamento processado com sucesso').should('be.visible')
        
        // Check increased balance
        cy.visit('/rewards')
        cy.get('[data-testid="text-total-points"]').invoke('text').then((newText) => {
          const newPoints = parseInt(newText.replace(/\D/g, ''))
          expect(newPoints).to.be.greaterThan(initialPoints)
        })
      })
    })

    it('should earn points for successful referrals', () => {
      cy.loginAsAdmin()
      
      // Check initial balance
      cy.visit('/rewards')
      cy.get('[data-testid="text-total-points"]').invoke('text').then((initialText) => {
        const initialPoints = parseInt(initialText.replace(/\D/g, ''))
        
        // Get referral code and register new user
        cy.get('[data-testid="input-referral-link"]').invoke('val').then((referralLink) => {
          const referralCode = (referralLink as string).split('ref=')[1]
          
          const timestamp = Date.now()
          cy.visit(`/register?ref=${referralCode}`)
          
          cy.registerUser({
            name: `Referred User ${timestamp}`,
            email: `referred${timestamp}@example.com`,
            password: 'password123',
            phone: '11999999999',
            location: 'São Paulo, SP'
          })
          
          // Check increased balance after successful referral
          cy.loginAsAdmin()
          cy.visit('/rewards')
          cy.get('[data-testid="text-total-points"]').invoke('text').then((newText) => {
            const newPoints = parseInt(newText.replace(/\D/g, ''))
            expect(newPoints).to.be.greaterThan(initialPoints)
          })
        })
      })
    })
  })
})