describe('Accessibility Tests', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation on home page', () => {
      cy.visit('/')
      
      // Tab through navigation elements
      cy.get('body').tab()
      cy.focused().should('have.attr', 'data-testid', 'link-home')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'data-testid', 'link-vehicles')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'data-testid', 'button-login')
    })

    it('should support keyboard navigation in forms', () => {
      cy.visit('/login')
      
      // Tab through form fields
      cy.get('[data-testid="input-email"]').focus()
      cy.focused().type('admin@alugae.mobi')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'data-testid', 'input-password')
      cy.focused().type('admin123')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'data-testid', 'button-submit')
      
      // Submit form with Enter key
      cy.focused().type('{enter}')
      cy.url().should('include', '/')
    })

    it('should support keyboard navigation in vehicle cards', () => {
      cy.visit('/')
      
      // Navigate to vehicle cards
      cy.get('[data-testid^="card-vehicle-"]').first().focus()
      cy.focused().type('{enter}')
      
      // Should navigate to vehicle detail
      cy.url().should('include', '/vehicle/')
    })

    it('should support keyboard navigation in admin panel', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/dashboard')
      
      // Tab through admin navigation
      cy.get('[data-testid="nav-admin-dashboard"]').focus()
      cy.focused().tab()
      cy.focused().should('have.attr', 'data-testid', 'nav-admin-users')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'data-testid', 'nav-admin-vehicles')
    })
  })

  describe('Screen Reader Support', () => {
    it('should have proper heading structure', () => {
      cy.visit('/')
      
      // Check heading hierarchy
      cy.get('h1').should('exist').and('be.visible')
      cy.get('h2').should('exist')
      
      // Headings should be in logical order
      cy.get('h1').first().should('contain', 'alugae.mobi')
    })

    it('should have descriptive alt text for images', () => {
      cy.visit('/vehicle/29')
      
      // Vehicle images should have alt text
      cy.get('[data-testid="vehicle-images"] img').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt')
        cy.wrap($img).invoke('attr', 'alt').should('not.be.empty')
      })
    })

    it('should have proper labels for form inputs', () => {
      cy.visit('/login')
      
      // All inputs should have associated labels
      cy.get('[data-testid="input-email"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="input-password"]').should('have.attr', 'aria-label')
      
      // Or be associated with label elements
      cy.get('label[for="email"]').should('exist')
      cy.get('label[for="password"]').should('exist')
    })

    it('should announce dynamic content changes', () => {
      cy.loginAsAdmin()
      cy.visit('/vehicle/29')
      
      // Booking form should announce price changes
      cy.get('[data-testid="input-start-date"]').type('2025-08-15')
      cy.get('[data-testid="input-end-date"]').type('2025-08-17')
      
      // Price breakdown should be announced
      cy.get('[data-testid="price-breakdown"]').should('have.attr', 'aria-live', 'polite')
    })

    it('should have proper ARIA labels for interactive elements', () => {
      cy.visit('/')
      
      // Search button should have aria-label
      cy.get('[data-testid="button-search"]').should('have.attr', 'aria-label')
      
      // Filter controls should have proper labels
      cy.get('[data-testid="select-location"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="select-transmission"]').should('have.attr', 'aria-label')
    })
  })

  describe('Color Contrast and Visual Accessibility', () => {
    it('should maintain readability in high contrast mode', () => {
      cy.visit('/')
      
      // Test with forced-colors media query simulation
      cy.window().then((win) => {
        const style = win.document.createElement('style')
        style.textContent = '@media (forced-colors: active) { * { background: ButtonFace !important; color: ButtonText !important; } }'
        win.document.head.appendChild(style)
      })
      
      // Text should still be readable
      cy.get('[data-testid="vehicle-grid"]').should('be.visible')
      cy.get('[data-testid^="card-vehicle-"]').should('be.visible')
    })

    it('should work without color-only information', () => {
      cy.loginAsAdmin()
      cy.visit('/admin/vehicles')
      
      // Status indicators should not rely only on color
      cy.get('[data-testid^="vehicle-row-"]').each(($row) => {
        // Should have text or icons in addition to color
        cy.wrap($row).find('[data-testid="text-vehicle-status"]').should('exist')
      })
    })

    it('should have sufficient color contrast for text', () => {
      cy.visit('/')
      
      // Main text should have good contrast
      cy.get('body').should('have.css', 'color').and('not.be.empty')
      cy.get('body').should('have.css', 'background-color').and('not.be.empty')
      
      // Button text should be readable
      cy.get('[data-testid="button-search"]').should('be.visible')
      cy.get('[data-testid="button-login"]').should('be.visible')
    })
  })

  describe('Focus Management', () => {
    it('should manage focus in modals', () => {
      cy.loginAsAdmin()
      cy.visit('/vehicle/29')
      
      // Open message modal
      cy.get('[data-testid="button-message-owner"]').click()
      
      // Focus should move to modal
      cy.get('[data-testid="message-modal"]').should('be.visible')
      cy.focused().should('be.inside', '[data-testid="message-modal"]')
      
      // Escape should close modal and return focus
      cy.focused().type('{esc}')
      cy.get('[data-testid="message-modal"]').should('not.exist')
      cy.focused().should('have.attr', 'data-testid', 'button-message-owner')
    })

    it('should trap focus within modals', () => {
      cy.loginAsAdmin()
      cy.visit('/my-bookings')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid^="booking-card-"]').length > 0) {
          cy.get('[data-testid^="booking-card-"]').first().click()
          
          // Focus should be trapped within modal
          cy.get('[data-testid="booking-details-modal"]').should('be.visible')
          
          // Tab should cycle within modal
          cy.focused().tab()
          cy.focused().should('be.inside', '[data-testid="booking-details-modal"]')
        }
      })
    })

    it('should have visible focus indicators', () => {
      cy.visit('/login')
      
      // Focus indicators should be visible
      cy.get('[data-testid="input-email"]').focus()
      cy.focused().should('have.css', 'outline').and('not.equal', 'none')
      
      cy.get('[data-testid="button-submit"]').focus()
      cy.focused().should('have.css', 'outline').and('not.equal', 'none')
    })

    it('should skip to main content', () => {
      cy.visit('/')
      
      // Should have skip link for keyboard users
      cy.get('body').tab()
      cy.focused().should('contain', 'Pular para conteúdo principal')
      
      // Skip link should work
      cy.focused().type('{enter}')
      cy.focused().should('be.inside', 'main')
    })
  })

  describe('ARIA Attributes and Roles', () => {
    it('should have proper landmark roles', () => {
      cy.visit('/')
      
      // Page should have proper landmark structure
      cy.get('header').should('have.attr', 'role', 'banner')
      cy.get('main').should('exist')
      cy.get('nav').should('have.attr', 'role', 'navigation')
    })

    it('should use proper ARIA attributes for complex widgets', () => {
      cy.visit('/')
      
      // Dropdown menus should have proper ARIA
      cy.get('[data-testid="select-location"]').should('have.attr', 'aria-haspopup')
      cy.get('[data-testid="select-transmission"]').should('have.attr', 'aria-expanded')
    })

    it('should announce loading states', () => {
      cy.visit('/')
      
      // Loading states should be announced
      cy.get('[data-testid="input-search"]').type('Honda')
      cy.get('[data-testid="button-search"]').click()
      
      // Should have aria-busy or loading indicator
      cy.get('[data-testid="vehicle-grid"]').should('have.attr', 'aria-busy', 'false')
    })

    it('should have proper error announcements', () => {
      cy.visit('/login')
      
      // Submit empty form
      cy.get('[data-testid="button-submit"]').click()
      
      // Errors should be announced
      cy.get('[data-testid="error-email"]').should('have.attr', 'role', 'alert')
      cy.get('[data-testid="error-password"]').should('have.attr', 'role', 'alert')
    })
  })

  describe('Mobile Accessibility', () => {
    it('should be accessible on mobile devices', () => {
      cy.viewport('iphone-x')
      cy.visit('/')
      
      // Touch targets should be large enough
      cy.get('[data-testid="button-login"]').should('have.css', 'min-height', '44px')
      cy.get('[data-testid^="card-vehicle-"]').first().should('have.css', 'min-height', '44px')
    })

    it('should support mobile screen readers', () => {
      cy.viewport('iphone-x')
      cy.visit('/login')
      
      // Form should be accessible on mobile
      cy.get('[data-testid="input-email"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="input-password"]').should('have.attr', 'aria-label')
      
      // Submit button should be properly labeled
      cy.get('[data-testid="button-submit"]').should('not.have.attr', 'aria-label', '')
    })

    it('should handle mobile navigation accessibility', () => {
      cy.viewport('iphone-x')
      cy.visit('/')
      
      // Mobile menu should be accessible
      cy.get('[data-testid="mobile-menu-button"]').should('have.attr', 'aria-expanded', 'false')
      cy.get('[data-testid="mobile-menu-button"]').click()
      cy.get('[data-testid="mobile-menu-button"]').should('have.attr', 'aria-expanded', 'true')
      
      // Menu items should be accessible
      cy.get('[data-testid="mobile-navigation"]').should('be.visible')
      cy.get('[data-testid="mobile-navigation"] a').each(($link) => {
        cy.wrap($link).should('have.attr', 'href')
      })
    })
  })

  describe('Internationalization Accessibility', () => {
    it('should have proper language attributes', () => {
      cy.visit('/')
      
      // HTML should have lang attribute
      cy.get('html').should('have.attr', 'lang', 'pt-BR')
      
      // Any foreign language content should be marked
      cy.get('[lang]').each(($el) => {
        cy.wrap($el).invoke('attr', 'lang').should('not.be.empty')
      })
    })

    it('should handle RTL layouts if needed', () => {
      cy.visit('/')
      
      // Should respect dir attribute if set
      cy.get('html').invoke('attr', 'dir').then((dir) => {
        if (dir === 'rtl') {
          // RTL-specific accessibility checks
          cy.get('[data-testid="vehicle-grid"]').should('have.css', 'direction', 'rtl')
        }
      })
    })
  })

  describe('Reduced Motion Support', () => {
    it('should respect prefers-reduced-motion', () => {
      // Simulate reduced motion preference
      cy.window().then((win) => {
        Object.defineProperty(win, 'matchMedia', {
          writable: true,
          value: cy.stub().returns({
            matches: true,
            media: '(prefers-reduced-motion: reduce)',
            onchange: null,
            addListener: cy.stub(),
            removeListener: cy.stub(),
            addEventListener: cy.stub(),
            removeEventListener: cy.stub(),
            dispatchEvent: cy.stub(),
          }),
        })
      })
      
      cy.visit('/')
      
      // Animations should be reduced or disabled
      cy.get('[data-testid^="card-vehicle-"]').first().should('have.css', 'animation', 'none')
    })
  })
})