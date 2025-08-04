// API helper functions for Cypress tests

interface ApiHelpers {
  makeAuthenticatedRequest(method: string, url: string, body?: any): Cypress.Chainable<any>;
  loginAndGetToken(email: string, password: string): Cypress.Chainable<string>;
  createTestBooking(vehicleId: number, startDate: string, endDate: string): Cypress.Chainable<any>;
  processTestPayment(amount: number): Cypress.Chainable<any>;
  updateAdminSettings(settings: any): Cypress.Chainable<any>;
}

export const apiHelpers: ApiHelpers = {
  // Make authenticated API request
  makeAuthenticatedRequest(method: string, url: string, body?: any) {
    return cy.getCookies().then((cookies) => {
      const token = cookies.find(cookie => cookie.name === 'token')?.value;
      
      return cy.request({
        method,
        url: `http://localhost:5000${url}`,
        body,
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json'
        },
        failOnStatusCode: false
      });
    });
  },

  // Login and get authentication token
  loginAndGetToken(email: string, password: string) {
    return cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/auth/login',
      body: { email, password }
    }).then((response) => {
      expect(response.status).to.equal(200);
      return response.body.token;
    });
  },

  // Create test booking via API
  createTestBooking(vehicleId: number, startDate: string, endDate: string) {
    const bookingData = {
      vehicleId,
      startDate,
      endDate,
      totalPrice: "254.80",
      serviceFee: "19.60",
      insuranceFee: "39.20"
    };

    return apiHelpers.makeAuthenticatedRequest('POST', '/api/store-checkout-data', bookingData);
  },

  // Process test payment
  processTestPayment(amount: number) {
    return apiHelpers.makeAuthenticatedRequest('POST', '/api/create-payment-intent', {
      amount: amount,
      currency: 'brl'
    });
  },

  // Update admin settings
  updateAdminSettings(settings: any) {
    return apiHelpers.makeAuthenticatedRequest('PUT', '/api/admin/settings', settings);
  }
};

// Add custom commands for API operations
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Make authenticated API request
       */
      apiRequest(method: string, url: string, body?: any): Chainable<any>
      
      /**
       * Get auth token for user
       */
      getAuthToken(email: string, password: string): Chainable<string>
      
      /**
       * Create booking via API
       */
      apiCreateBooking(vehicleId: number, startDate: string, endDate: string): Chainable<any>
      
      /**
       * Update admin settings via API
       */
      apiUpdateSettings(settings: any): Chainable<any>
    }
  }
}

Cypress.Commands.add('apiRequest', (method: string, url: string, body?: any) => {
  return apiHelpers.makeAuthenticatedRequest(method, url, body);
});

Cypress.Commands.add('getAuthToken', (email: string, password: string) => {
  return apiHelpers.loginAndGetToken(email, password);
});

Cypress.Commands.add('apiCreateBooking', (vehicleId: number, startDate: string, endDate: string) => {
  return apiHelpers.createTestBooking(vehicleId, startDate, endDate);
});

Cypress.Commands.add('apiUpdateSettings', (settings: any) => {
  return apiHelpers.updateAdminSettings(settings);
});

export {}