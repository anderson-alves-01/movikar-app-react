describe('Admin Panel', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Admin Access Control', () => {
    it('should redirect non-admin users from admin pages', () => {
      // Create and login as regular user
      const timestamp = Date.now()
      cy.registerUser({
        name: `Regular User ${timestamp}`,
        email: `regular${timestamp}@example.com`,
        password: 'password123',
        phone: '11999999999',
        location: 'São Paulo, SP'
      })
      
      cy.visit('/admin/dashboard')
      
      // Should redirect to home page
      cy.url().should('include', '/')
      cy.contains('Acesso negado').should('be.visible')
    })

    it('should allow admin access to admin pages', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/dashboard')
      
      cy.get('[data-testid="admin-dashboard"]').should('be.visible')
      cy.get('[data-testid="admin-navigation"]').should('be.visible')
    })

    it('should show admin navigation menu', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/dashboard')
      
      cy.get('[data-testid="nav-admin-dashboard"]').should('be.visible')
      cy.get('[data-testid="nav-admin-users"]').should('be.visible')
      cy.get('[data-testid="nav-admin-vehicles"]').should('be.visible')
      cy.get('[data-testid="nav-admin-bookings"]').should('be.visible')
      cy.get('[data-testid="nav-admin-settings"]').should('be.visible')
    })
  })

  describe('Admin Dashboard', () => {
    it('should display key metrics', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/dashboard')
      
      cy.get('[data-testid="metric-total-users"]').should('be.visible')
      cy.get('[data-testid="metric-total-vehicles"]').should('be.visible')
      cy.get('[data-testid="metric-total-bookings"]').should('be.visible')
      cy.get('[data-testid="metric-total-revenue"]').should('be.visible')
    })

    it('should show recent activity', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/dashboard')
      
      cy.get('[data-testid="recent-activity"]').should('be.visible')
      cy.get('[data-testid="activity-list"]').should('exist')
    })

    it('should display performance charts', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/dashboard')
      
      cy.get('[data-testid="revenue-chart"]').should('be.visible')
      cy.get('[data-testid="bookings-chart"]').should('be.visible')
    })

    it('should show pending approvals', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/dashboard')
      
      cy.get('[data-testid="pending-approvals"]').should('be.visible')
      cy.get('[data-testid="pending-vehicles-count"]').should('be.visible')
      cy.get('[data-testid="pending-documents-count"]').should('be.visible')
    })
  })

  describe('User Management', () => {
    it('should display user list', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/users')
      
      cy.get('[data-testid="users-table"]').should('be.visible')
      cy.get('[data-testid^="user-row-"]').should('have.length.at.least', 1)
    })

    it('should allow user search', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/users')
      
      cy.get('[data-testid="input-search-users"]').type('admin')
      cy.get('[data-testid="button-search-users"]').click()
      
      cy.get('[data-testid^="user-row-"]').should('contain', 'admin@alugae.mobi')
    })

    it('should allow user filtering by role', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/users')
      
      cy.get('[data-testid="select-user-role"]').select('admin')
      cy.get('[data-testid="button-apply-filters"]').click()
      
      cy.get('[data-testid^="user-row-"]').each(($row) => {
        cy.wrap($row).should('contain', 'Admin')
      })
    })

    it('should show user details modal', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/users')
      
      cy.get('[data-testid^="user-row-"]').first().click()
      
      cy.get('[data-testid="user-details-modal"]').should('be.visible')
      cy.get('[data-testid="text-user-name"]').should('be.visible')
      cy.get('[data-testid="text-user-email"]').should('be.visible')
      cy.get('[data-testid="text-user-role"]').should('be.visible')
      cy.get('[data-testid="text-user-status"]').should('be.visible')
    })

    it('should allow user role modification', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/users')
      
      cy.get('[data-testid^="user-row-"]').first().click()
      cy.get('[data-testid="button-edit-user"]').click()
      
      cy.get('[data-testid="select-user-role"]').select('owner')
      cy.get('[data-testid="button-save-user"]').click()
      
      cy.contains('Usuário atualizado com sucesso').should('be.visible')
    })

    it('should allow user account suspension', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/users')
      
      cy.get('[data-testid^="user-row-"]').first().click()
      cy.get('[data-testid="button-suspend-user"]').click()
      
      cy.get('[data-testid="suspend-user-modal"]').should('be.visible')
      cy.get('[data-testid="textarea-suspension-reason"]').type('Violation of terms')
      cy.get('[data-testid="button-confirm-suspend"]').click()
      
      cy.contains('Usuário suspenso com sucesso').should('be.visible')
    })
  })

  describe('Vehicle Management', () => {
    it('should display pending vehicle approvals', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/vehicles')
      
      cy.get('[data-testid="pending-vehicles-section"]').should('be.visible')
      cy.get('[data-testid="pending-vehicles-table"]').should('exist')
    })

    it('should approve pending vehicle', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/vehicles')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="button-approve-vehicle"]').length > 0) {
          cy.get('[data-testid="button-approve-vehicle"]').first().click()
          cy.contains('Veículo aprovado com sucesso').should('be.visible')
        }
      })
    })

    it('should reject pending vehicle with reason', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/vehicles')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="button-reject-vehicle"]').length > 0) {
          cy.get('[data-testid="button-reject-vehicle"]').first().click()
          
          cy.get('[data-testid="rejection-modal"]').should('be.visible')
          cy.get('[data-testid="textarea-rejection-reason"]').type('Incomplete documentation')
          cy.get('[data-testid="button-confirm-reject"]').click()
          
          cy.contains('Veículo rejeitado').should('be.visible')
        }
      })
    })

    it('should view vehicle documents', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/vehicles')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="button-view-documents"]').length > 0) {
          cy.get('[data-testid="button-view-documents"]').first().click()
          
          cy.get('[data-testid="documents-modal"]').should('be.visible')
          cy.get('[data-testid="document-crlv"]').should('be.visible')
        }
      })
    })

    it('should filter vehicles by status', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/vehicles')
      
      cy.get('[data-testid="select-vehicle-status"]').select('approved')
      cy.get('[data-testid="button-apply-filters"]').click()
      
      cy.get('[data-testid^="vehicle-row-"]').each(($row) => {
        cy.wrap($row).should('contain', 'Aprovado')
      })
    })
  })

  describe('Booking Management', () => {
    it('should display all bookings', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/bookings')
      
      cy.get('[data-testid="bookings-table"]').should('be.visible')
      cy.get('[data-testid^="booking-row-"]').should('exist')
    })

    it('should filter bookings by status', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/bookings')
      
      cy.get('[data-testid="select-booking-status"]').select('confirmed')
      cy.get('[data-testid="button-apply-filters"]').click()
      
      cy.get('[data-testid^="booking-row-"]').each(($row) => {
        cy.wrap($row).should('contain', 'Confirmado')
      })
    })

    it('should view booking details', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/bookings')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid^="booking-row-"]').length > 0) {
          cy.get('[data-testid^="booking-row-"]').first().click()
          
          cy.get('[data-testid="booking-details-modal"]').should('be.visible')
          cy.get('[data-testid="text-booking-id"]').should('be.visible')
          cy.get('[data-testid="text-renter-name"]').should('be.visible')
          cy.get('[data-testid="text-vehicle-name"]').should('be.visible')
          cy.get('[data-testid="text-booking-dates"]').should('be.visible')
        }
      })
    })

    it('should allow booking cancellation', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/bookings')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="button-cancel-booking"]').length > 0) {
          cy.get('[data-testid="button-cancel-booking"]').first().click()
          
          cy.get('[data-testid="cancel-booking-modal"]').should('be.visible')
          cy.get('[data-testid="textarea-cancellation-reason"]').type('System maintenance')
          cy.get('[data-testid="button-confirm-cancel"]').click()
          
          cy.contains('Reserva cancelada').should('be.visible')
        }
      })
    })
  })

  describe('Admin Settings', () => {
    it('should display current settings', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/settings')
      
      cy.get('[data-testid="admin-settings-form"]').should('be.visible')
      cy.get('[data-testid="input-service-fee"]').should('be.visible')
      cy.get('[data-testid="input-insurance-fee"]').should('be.visible')
      cy.get('[data-testid="input-support-email"]').should('be.visible')
      cy.get('[data-testid="input-support-phone"]').should('be.visible')
    })

    it('should update service fee percentage', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/settings')
      
      cy.get('[data-testid="input-service-fee"]').clear().type('12')
      cy.get('[data-testid="button-save-settings"]').click()
      
      cy.contains('Configurações salvas com sucesso').should('be.visible')
      
      // Verify the change was saved
      cy.reload()
      cy.get('[data-testid="input-service-fee"]').should('have.value', '12')
    })

    it('should update insurance fee percentage', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/settings')
      
      cy.get('[data-testid="input-insurance-fee"]').clear().type('25')
      cy.get('[data-testid="button-save-settings"]').click()
      
      cy.contains('Configurações salvas com sucesso').should('be.visible')
      
      // Verify the change was saved
      cy.reload()
      cy.get('[data-testid="input-insurance-fee"]').should('have.value', '25')
    })

    it('should validate fee percentage ranges', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/settings')
      
      // Try to set service fee above maximum
      cy.get('[data-testid="input-service-fee"]').clear().type('60')
      cy.get('[data-testid="button-save-settings"]').click()
      
      cy.contains('Taxa de serviço deve estar entre 0% e 50%').should('be.visible')
      
      // Try to set insurance fee above maximum
      cy.get('[data-testid="input-insurance-fee"]').clear().type('40')
      cy.get('[data-testid="button-save-settings"]').click()
      
      cy.contains('Taxa de seguro deve estar entre 0% e 30%').should('be.visible')
    })

    it('should toggle PIX payment feature', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/settings')
      
      cy.get('[data-testid="toggle-pix-payment"]').click()
      cy.get('[data-testid="button-save-settings"]').click()
      
      cy.contains('Configurações salvas com sucesso').should('be.visible')
    })

    it('should update subscription plan prices', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/settings')
      
      cy.get('[data-testid="input-essential-price"]').clear().type('35.90')
      cy.get('[data-testid="input-plus-price"]').clear().type('69.90')
      cy.get('[data-testid="button-save-settings"]').click()
      
      cy.contains('Configurações salvas com sucesso').should('be.visible')
      
      // Verify prices are updated on subscription plans page
      cy.visit('/subscription-plans')
      cy.get('[data-testid="plan-essential"] [data-testid="text-plan-price"]').should('contain', 'R$ 35,90')
      cy.get('[data-testid="plan-plus"] [data-testid="text-plan-price"]').should('contain', 'R$ 69,90')
    })
  })
})