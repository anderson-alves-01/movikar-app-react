/// <reference types="cypress" />

// Custom commands for the alugae.mobi application

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login with email and password
       */
      login(email: string, password: string): Chainable<void>
      
      /**
       * Login as admin user
       */
      loginAsAdmin(): Chainable<void>
      
      /**
       * Login as regular user
       */
      loginAsUser(): Chainable<void>
      
      /**
       * Register a new user
       */
      registerUser(userData: {
        name: string
        email: string
        password: string
        phone: string
        location: string
      }): Chainable<void>
      
      /**
       * Navigate to a specific vehicle
       */
      goToVehicle(vehicleId: number): Chainable<void>
      
      /**
       * Make a booking for a vehicle
       */
      makeBooking(vehicleId: number, startDate: string, endDate: string): Chainable<void>
      
      /**
       * Wait for API response
       */
      waitForApi(alias: string): Chainable<void>
      
      /**
       * Check if user is authenticated
       */
      checkAuthenticated(): Chainable<void>
      
      /**
       * Check if user is not authenticated
       */
      checkNotAuthenticated(): Chainable<void>
      
      /**
       * Fill stripe payment form
       */
      fillStripePayment(cardNumber?: string): Chainable<void>
      
      /**
       * Add points to user account
       */
      addPointsToUser(userId: number, points: number): Chainable<void>
    }
  }
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('[data-testid="input-email"]').type(email)
  cy.get('[data-testid="input-password"]').type(password)
  cy.get('[data-testid="button-submit"]').click()
  cy.wait(1000) // Wait for login to complete
})

// Login as admin
Cypress.Commands.add('loginAsAdmin', () => {
  cy.login('admin@alugae.mobi', 'admin123')
})

// Login as regular user  
Cypress.Commands.add('loginAsUser', () => {
  cy.login('user@test.com', 'user123')
})

// Register user
Cypress.Commands.add('registerUser', (userData) => {
  cy.visit('/register')
  cy.get('[data-testid="input-name"]').type(userData.name)
  cy.get('[data-testid="input-email"]').type(userData.email)
  cy.get('[data-testid="input-password"]').type(userData.password)
  cy.get('[data-testid="input-phone"]').type(userData.phone)
  cy.get('[data-testid="input-location"]').type(userData.location)
  cy.get('[data-testid="button-submit"]').click()
})

// Navigate to vehicle
Cypress.Commands.add('goToVehicle', (vehicleId: number) => {
  cy.visit(`/vehicle/${vehicleId}`)
})

// Make booking
Cypress.Commands.add('makeBooking', (vehicleId: number, startDate: string, endDate: string) => {
  cy.goToVehicle(vehicleId)
  cy.get('[data-testid="input-start-date"]').type(startDate)
  cy.get('[data-testid="input-end-date"]').type(endDate)
  cy.get('[data-testid="button-book-now"]').click()
})

// Wait for API
Cypress.Commands.add('waitForApi', (alias: string) => {
  cy.wait(alias, { timeout: 10000 })
})

// Check authenticated
Cypress.Commands.add('checkAuthenticated', () => {
  cy.get('[data-testid="header-user-menu"]').should('be.visible')
})

// Check not authenticated
Cypress.Commands.add('checkNotAuthenticated', () => {
  cy.get('[data-testid="button-login"]').should('be.visible')
})

// Fill Stripe payment
Cypress.Commands.add('fillStripePayment', (cardNumber = '4242424242424242') => {
  cy.get('iframe[name^="__privateStripeFrame"]').then(($iframe) => {
    const $body = $iframe.contents().find('body')
    cy.wrap($body)
      .find('input[name="cardnumber"]')
      .type(cardNumber)
    cy.wrap($body)
      .find('input[name="exp-date"]')
      .type('1225')
    cy.wrap($body)
      .find('input[name="cvc"]')
      .type('123')
  })
})

// Add points to user
Cypress.Commands.add('addPointsToUser', (userId: number, points: number) => {
  cy.request({
    method: 'POST',
    url: '/api/rewards/add-points',
    body: {
      userId,
      points,
      description: 'Test points'
    }
  })
})

export {}