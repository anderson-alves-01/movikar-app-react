describe('Messaging System', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Message Center Access', () => {
    it('should require authentication to access messages', () => {
      cy.visit('/messages')
      
      // Should redirect to login
      cy.url().should('include', '/login')
      cy.contains('Faça login para continuar').should('be.visible')
    })

    it('should display message center for authenticated users', () => {
      cy.loginAsAdmin()
      cy.visit('/messages')
      
      cy.get('[data-testid="message-center"]').should('be.visible')
      cy.get('[data-testid="message-threads-list"]').should('be.visible')
      cy.get('[data-testid="message-compose-area"]').should('be.visible')
    })

    it('should show empty state when no messages', () => {
      cy.loginAsAdmin()
      cy.visit('/messages')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid^="message-thread-"]').length === 0) {
          cy.get('[data-testid="empty-messages-state"]').should('be.visible')
          cy.contains('Nenhuma mensagem ainda').should('be.visible')
        }
      })
    })
  })

  describe('Message Threads', () => {
    it('should display message threads list', () => {
      cy.loginAsAdmin()
      cy.visit('/messages')
      
      cy.get('[data-testid="message-threads-list"]').should('be.visible')
      
      // Check if threads exist
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid^="message-thread-"]').length > 0) {
          cy.get('[data-testid^="message-thread-"]').should('have.length.at.least', 1)
        }
      })
    })

    it('should show thread information correctly', () => {
      cy.loginAsAdmin()
      cy.visit('/messages')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid^="message-thread-"]').length > 0) {
          cy.get('[data-testid^="message-thread-"]').first().within(() => {
            cy.get('[data-testid="text-participant-name"]').should('be.visible')
            cy.get('[data-testid="text-last-message"]').should('be.visible')
            cy.get('[data-testid="text-message-time"]').should('be.visible')
          })
        }
      })
    })

    it('should select thread when clicked', () => {
      cy.loginAsAdmin()
      cy.visit('/messages')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid^="message-thread-"]').length > 0) {
          cy.get('[data-testid^="message-thread-"]').first().click()
          
          cy.get('[data-testid="selected-thread"]').should('be.visible')
          cy.get('[data-testid="message-history"]').should('be.visible')
        }
      })
    })

    it('should show unread message indicator', () => {
      cy.loginAsAdmin()
      cy.visit('/messages')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="unread-indicator"]').length > 0) {
          cy.get('[data-testid="unread-indicator"]').should('be.visible')
          cy.get('[data-testid="unread-count"]').should('be.visible')
        }
      })
    })
  })

  describe('Vehicle-Specific Messages', () => {
    it('should show message option on vehicle detail page', () => {
      cy.loginAsAdmin()
      cy.visit('/vehicle/29')
      
      cy.get('[data-testid="button-message-owner"]').should('be.visible')
    })

    it('should open message center when messaging vehicle owner', () => {
      cy.loginAsAdmin()
      cy.visit('/vehicle/29')
      
      cy.get('[data-testid="button-message-owner"]').click()
      
      cy.get('[data-testid="message-modal"]').should('be.visible')
      cy.get('[data-testid="text-vehicle-context"]').should('be.visible')
      cy.get('[data-testid="textarea-message-content"]').should('be.visible')
      cy.get('[data-testid="button-send-message"]').should('be.visible')
    })

    it('should send message about specific vehicle', () => {
      cy.loginAsAdmin()
      cy.visit('/vehicle/29')
      
      cy.get('[data-testid="button-message-owner"]').click()
      
      cy.get('[data-testid="textarea-message-content"]').type('Interested in renting this vehicle. Is it available for next weekend?')
      cy.get('[data-testid="button-send-message"]').click()
      
      cy.contains('Mensagem enviada com sucesso').should('be.visible')
      cy.get('[data-testid="message-modal"]').should('not.exist')
    })

    it('should create booking-specific message thread', () => {
      cy.loginAsAdmin()
      
      // Complete a booking first
      cy.makeBooking(29, '2025-08-15', '2025-08-17')
      cy.fillStripePayment()
      cy.get('[data-testid="button-submit-payment"]').click()
      
      // Go to booking details and send message
      cy.visit('/my-bookings')
      cy.get('[data-testid^="booking-card-"]').first().click()
      cy.get('[data-testid="button-message-owner"]').click()
      
      cy.get('[data-testid="textarea-message-content"]').type('Booking confirmed. What time should I pick up the vehicle?')
      cy.get('[data-testid="button-send-message"]').click()
      
      cy.contains('Mensagem enviada').should('be.visible')
    })
  })

  describe('Message Composition', () => {
    it('should validate message content', () => {
      cy.loginAsAdmin()
      cy.visit('/vehicle/29')
      
      cy.get('[data-testid="button-message-owner"]').click()
      cy.get('[data-testid="button-send-message"]').click()
      
      cy.contains('Mensagem não pode estar vazia').should('be.visible')
    })

    it('should enforce message length limits', () => {
      cy.loginAsAdmin()
      cy.visit('/vehicle/29')
      
      cy.get('[data-testid="button-message-owner"]').click()
      
      // Try to send very long message
      const longMessage = 'a'.repeat(1001) // Assuming 1000 char limit
      cy.get('[data-testid="textarea-message-content"]').type(longMessage)
      cy.get('[data-testid="button-send-message"]').click()
      
      cy.contains('Mensagem muito longa').should('be.visible')
    })

    it('should show character count', () => {
      cy.loginAsAdmin()
      cy.visit('/vehicle/29')
      
      cy.get('[data-testid="button-message-owner"]').click()
      
      cy.get('[data-testid="textarea-message-content"]').type('Test message')
      cy.get('[data-testid="text-character-count"]').should('contain', '12/1000')
    })

    it('should send message successfully', () => {
      cy.loginAsAdmin()
      cy.visit('/vehicle/29')
      
      cy.get('[data-testid="button-message-owner"]').click()
      cy.get('[data-testid="textarea-message-content"]').type('Hello, I am interested in this vehicle.')
      cy.get('[data-testid="button-send-message"]').click()
      
      cy.contains('Mensagem enviada com sucesso').should('be.visible')
    })
  })

  describe('Message History', () => {
    it('should display conversation history', () => {
      cy.loginAsAdmin()
      cy.visit('/messages')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid^="message-thread-"]').length > 0) {
          cy.get('[data-testid^="message-thread-"]').first().click()
          
          cy.get('[data-testid="message-history"]').should('be.visible')
          cy.get('[data-testid^="message-item-"]').should('have.length.at.least', 1)
        }
      })
    })

    it('should show message timestamps', () => {
      cy.loginAsAdmin()
      cy.visit('/messages')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid^="message-thread-"]').length > 0) {
          cy.get('[data-testid^="message-thread-"]').first().click()
          
          cy.get('[data-testid^="message-item-"]').first().within(() => {
            cy.get('[data-testid="text-message-time"]').should('be.visible')
          })
        }
      })
    })

    it('should distinguish between sent and received messages', () => {
      cy.loginAsAdmin()
      cy.visit('/messages')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid^="message-thread-"]').length > 0) {
          cy.get('[data-testid^="message-thread-"]').first().click()
          
          // Should have visual distinction between sent and received
          cy.get('[data-testid="message-sent"]').should('exist')
          cy.get('[data-testid="message-received"]').should('exist')
        }
      })
    })

    it('should mark messages as read when viewed', () => {
      cy.loginAsAdmin()
      cy.visit('/messages')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="unread-indicator"]').length > 0) {
          // Click on unread thread
          cy.get('[data-testid^="message-thread-"]').first().click()
          
          // Unread indicator should disappear
          cy.get('[data-testid="unread-indicator"]').should('not.exist')
        }
      })
    })
  })

  describe('Real-time Updates', () => {
    it('should update thread list when new message arrives', () => {
      cy.loginAsAdmin()
      cy.visit('/messages')
      
      // Get initial thread count
      cy.get('[data-testid^="message-thread-"]').then(($threads) => {
        const initialCount = $threads.length
        
        // Send a new message from another window/tab simulation
        cy.visit('/vehicle/29')
        cy.get('[data-testid="button-message-owner"]').click()
        cy.get('[data-testid="textarea-message-content"]').type('New test message')
        cy.get('[data-testid="button-send-message"]').click()
        
        // Go back to messages and check for update
        cy.visit('/messages')
        cy.get('[data-testid^="message-thread-"]').should('have.length.at.least', initialCount)
      })
    })

    it('should show typing indicator', () => {
      cy.loginAsAdmin()
      cy.visit('/messages')
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid^="message-thread-"]').length > 0) {
          cy.get('[data-testid^="message-thread-"]').first().click()
          
          // Start typing in compose area
          cy.get('[data-testid="textarea-compose-message"]').type('Test')
          
          // Should show typing indicator (if implemented)
          cy.get('[data-testid="typing-indicator"]').should('exist')
        }
      })
    })
  })

  describe('Message Search and Filtering', () => {
    it('should search messages by content', () => {
      cy.loginAsAdmin()
      cy.visit('/messages')
      
      cy.get('[data-testid="input-search-messages"]').type('vehicle')
      cy.get('[data-testid="button-search-messages"]').click()
      
      cy.get('[data-testid^="message-thread-"]').each(($thread) => {
        cy.wrap($thread).should('contain', 'vehicle')
      })
    })

    it('should filter by message status', () => {
      cy.loginAsAdmin()
      cy.visit('/messages')
      
      cy.get('[data-testid="select-message-filter"]').select('unread')
      
      cy.get('[data-testid^="message-thread-"]').each(($thread) => {
        cy.wrap($thread).find('[data-testid="unread-indicator"]').should('exist')
      })
    })

    it('should filter by vehicle/booking context', () => {
      cy.loginAsAdmin()
      cy.visit('/messages')
      
      cy.get('[data-testid="select-context-filter"]').select('bookings')
      
      cy.get('[data-testid^="message-thread-"]').each(($thread) => {
        cy.wrap($thread).should('contain', 'Reserva')
      })
    })
  })
})