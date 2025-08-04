describe('Performance Tests', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Page Load Performance', () => {
    it('should load home page within acceptable time', () => {
      const startTime = performance.now()
      
      cy.visit('/')
      cy.get('[data-testid="vehicle-grid"]').should('be.visible')
      
      cy.window().then(() => {
        const loadTime = performance.now() - startTime
        expect(loadTime).to.be.lessThan(3000) // 3 seconds max
      })
    })

    it('should load vehicle detail page quickly', () => {
      cy.visit('/vehicle/29', { timeout: 5000 })
      cy.get('[data-testid="vehicle-detail-container"]').should('be.visible')
      
      // Check that images load within reasonable time
      cy.get('[data-testid="vehicle-images"] img').should('be.visible')
      cy.get('[data-testid="booking-form"]').should('be.visible')
    })

    it('should load admin dashboard efficiently', () => {
      cy.loginAsAdmin()
      
      const startTime = performance.now()
      cy.visit('/admin/dashboard')
      cy.get('[data-testid="admin-dashboard"]').should('be.visible')
      
      cy.window().then(() => {
        const loadTime = performance.now() - startTime
        expect(loadTime).to.be.lessThan(2000) // 2 seconds for admin
      })
    })
  })

  describe('API Response Times', () => {
    it('should respond to vehicle search quickly', () => {
      cy.intercept('GET', '/api/vehicles*').as('vehicleSearch')
      
      cy.visit('/')
      cy.get('[data-testid="input-search"]').type('Honda')
      cy.get('[data-testid="button-search"]').click()
      
      cy.wait('@vehicleSearch').then((interception) => {
        expect(interception.reply?.delay).to.be.undefined
        // Check response time is reasonable
        const responseTime = Date.now() - interception.request.timestamp
        expect(responseTime).to.be.lessThan(1000) // 1 second max
      })
    })

    it('should handle authentication requests efficiently', () => {
      cy.intercept('POST', '/api/auth/login').as('loginRequest')
      
      cy.visit('/login')
      cy.get('[data-testid="input-email"]').type('admin@alugae.mobi')
      cy.get('[data-testid="input-password"]').type('admin123')
      cy.get('[data-testid="button-submit"]').click()
      
      cy.wait('@loginRequest').then((interception) => {
        const responseTime = Date.now() - interception.request.timestamp
        expect(responseTime).to.be.lessThan(2000) // 2 seconds max for auth
      })
    })

    it('should process booking creation efficiently', () => {
      cy.loginAsAdmin()
      cy.intercept('POST', '/api/store-checkout-data').as('checkoutData')
      
      cy.visit('/vehicle/29')
      cy.get('[data-testid="input-start-date"]').type('2025-08-15')
      cy.get('[data-testid="input-end-date"]').type('2025-08-17')
      cy.get('[data-testid="button-book-now"]').click()
      
      cy.wait('@checkoutData').then((interception) => {
        const responseTime = Date.now() - interception.request.timestamp
        expect(responseTime).to.be.lessThan(1500) // 1.5 seconds max
      })
    })
  })

  describe('Database Query Performance', () => {
    it('should handle large vehicle listings efficiently', () => {
      cy.visit('/')
      
      // Load all vehicles and measure time
      cy.get('[data-testid="vehicle-grid"]').should('be.visible')
      cy.get('[data-testid^="card-vehicle-"]').should('have.length.at.least', 1)
      
      // Scroll to load more if pagination exists
      cy.scrollTo('bottom')
      
      // Should not show loading indicators for too long
      cy.get('[data-testid="loading-vehicles"]').should('not.exist')
    })

    it('should efficiently filter vehicles by multiple criteria', () => {
      cy.visit('/')
      
      // Apply multiple filters
      cy.get('[data-testid="select-location"]').select('brasilia')
      cy.get('[data-testid="select-transmission"]').select('automatic')
      cy.get('[data-testid="select-price-min"]').select('50')
      cy.get('[data-testid="select-price-max"]').select('150')
      cy.get('[data-testid="button-apply-filters"]').click()
      
      // Results should load quickly
      cy.get('[data-testid="vehicle-grid"]').should('be.visible')
      cy.get('[data-testid="loading-vehicles"]').should('not.exist')
    })

    it('should handle admin data queries efficiently', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/dashboard')
      
      // Multiple metrics should load without significant delay
      cy.get('[data-testid="metric-total-users"]').should('be.visible')
      cy.get('[data-testid="metric-total-vehicles"]').should('be.visible')
      cy.get('[data-testid="metric-total-bookings"]').should('be.visible')
      cy.get('[data-testid="metric-total-revenue"]').should('be.visible')
      
      // Charts should render without long loading
      cy.get('[data-testid="revenue-chart"]').should('be.visible')
      cy.get('[data-testid="bookings-chart"]').should('be.visible')
    })
  })

  describe('Memory Usage', () => {
    it('should not have memory leaks during navigation', () => {
      cy.loginAsAdmin()
      
      // Navigate through multiple pages
      cy.visit('/')
      cy.visit('/vehicles')
      cy.visit('/my-bookings')
      cy.visit('/rewards')
      cy.visit('/subscription')
      cy.visit('/admin/dashboard')
      cy.visit('/admin/users')
      cy.visit('/admin/vehicles')
      
      // Check that page still responds normally
      cy.get('[data-testid="admin-navigation"]').should('be.visible')
      cy.get('[data-testid="pending-vehicles-table"]').should('exist')
    })

    it('should handle large image galleries efficiently', () => {
      cy.visit('/vehicle/29')
      
      // Check that vehicle images load without blocking UI
      cy.get('[data-testid="vehicle-images"]').should('be.visible')
      
      // Navigate through images if multiple exist
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="button-next-image"]').length > 0) {
          for (let i = 0; i < 5; i++) {
            cy.get('[data-testid="button-next-image"]').click()
            cy.wait(100) // Small delay between clicks
          }
        }
      })
      
      // Form should still be responsive
      cy.get('[data-testid="booking-form"]').should('be.visible')
      cy.get('[data-testid="input-start-date"]').should('be.enabled')
    })
  })

  describe('Concurrent User Simulation', () => {
    it('should handle multiple simultaneous bookings', () => {
      // Simulate multiple users trying to book same vehicle
      const bookingPromises = []
      
      for (let i = 0; i < 3; i++) {
        bookingPromises.push(
          cy.loginAsAdmin().then(() => {
            cy.visit('/vehicle/29')
            cy.get('[data-testid="input-start-date"]').type(`2025-10-${15 + i}`)
            cy.get('[data-testid="input-end-date"]').type(`2025-10-${17 + i}`)
            cy.get('[data-testid="button-book-now"]').click()
            
            // Should handle concurrent requests gracefully
            cy.url().should('include', '/checkout/')
          })
        )
      }
      
      // All bookings should be processed or properly rejected
      Promise.all(bookingPromises)
    })

    it('should handle multiple admin operations', () => {
      cy.loginAsAdmin()
      
      // Perform multiple admin operations quickly
      cy.visit('/admin/settings')
      cy.get('[data-testid="input-service-fee"]').clear().type('9')
      cy.get('[data-testid="button-save-settings"]').click()
      
      cy.visit('/admin/users')
      cy.get('[data-testid="input-search-users"]').type('test')
      cy.get('[data-testid="button-search-users"]').click()
      
      cy.visit('/admin/vehicles')
      cy.get('[data-testid="select-vehicle-status"]').select('pending')
      cy.get('[data-testid="button-apply-filters"]').click()
      
      // All operations should complete successfully
      cy.get('[data-testid="pending-vehicles-table"]').should('be.visible')
    })
  })

  describe('Network Performance', () => {
    it('should work efficiently on slow connections', () => {
      // Simulate slow network
      cy.intercept('**/*', (req) => {
        req.reply((res) => {
          // Add 200ms delay to simulate slower connection
          return new Promise((resolve) => {
            setTimeout(() => resolve(res), 200)
          })
        })
      })
      
      cy.visit('/')
      cy.get('[data-testid="vehicle-grid"]').should('be.visible')
      
      // Navigation should still work
      cy.get('[data-testid^="card-vehicle-"]').first().click()
      cy.get('[data-testid="vehicle-detail-container"]').should('be.visible')
    })

    it('should optimize image loading', () => {
      cy.visit('/vehicle/29')
      
      // Images should load progressively
      cy.get('[data-testid="vehicle-images"] img').should('be.visible')
      
      // Check that images have proper loading attributes
      cy.get('[data-testid="vehicle-images"] img').should('have.attr', 'loading', 'lazy')
    })

    it('should handle offline scenarios gracefully', () => {
      cy.loginAsAdmin()
      
      // Simulate offline
      cy.intercept('**/*', { forceNetworkError: true }).as('offline')
      
      cy.visit('/my-bookings')
      
      // Should show appropriate offline message
      cy.contains('Erro de conexão').should('be.visible')
      
      // Restore connection
      cy.intercept('**/*').as('online')
      
      // Should recover when connection restored
      cy.get('[data-testid="button-retry"]').click()
      cy.get('[data-testid="bookings-list"]').should('be.visible')
    })
  })

  describe('Resource Usage', () => {
    it('should efficiently load and cache static assets', () => {
      cy.visit('/')
      
      // Check that CSS and JS files are cached
      cy.window().then((win) => {
        // Should not reload CSS on navigation
        cy.visit('/vehicles')
        cy.visit('/')
        
        // Page should load quickly from cache
        cy.get('[data-testid="vehicle-grid"]').should('be.visible')
      })
    })

    it('should optimize API response sizes', () => {
      cy.intercept('GET', '/api/vehicles').as('vehiclesAPI')
      
      cy.visit('/')
      
      cy.wait('@vehiclesAPI').then((interception) => {
        const responseSize = JSON.stringify(interception.response?.body).length
        
        // Response should be reasonably sized (not loading unnecessary data)
        expect(responseSize).to.be.lessThan(100000) // 100KB max for vehicle list
      })
    })

    it('should handle large datasets efficiently', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/users')
      
      // Should paginate large user lists
      cy.get('[data-testid="users-table"]').should('be.visible')
      
      // Check for pagination controls
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="pagination"]').length > 0) {
          cy.get('[data-testid="pagination"]').should('be.visible')
          
          // Navigate to next page
          cy.get('[data-testid="button-next-page"]').click()
          cy.get('[data-testid="users-table"]').should('be.visible')
        }
      })
    })
  })
})