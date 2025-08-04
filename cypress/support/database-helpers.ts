// Database helper functions for Cypress tests

interface DatabaseHelpers {
  clearTestData(): void;
  seedTestData(): void;
  addPointsToUser(userId: number, points: number): void;
  createTestVehicle(vehicleData: any): void;
  cleanupAfterTest(): void;
}

export const dbHelpers: DatabaseHelpers = {
  // Clear test data from database
  clearTestData() {
    cy.task('db:clear', null, { timeout: 10000 });
  },

  // Seed database with test data
  seedTestData() {
    cy.task('db:seed', null, { timeout: 15000 });
  },

  // Add points to a specific user
  addPointsToUser(userId: number, points: number) {
    cy.task('db:addPoints', { userId, points });
  },

  // Create a test vehicle
  createTestVehicle(vehicleData: any) {
    cy.task('db:createVehicle', vehicleData);
  },

  // Cleanup after test completion
  cleanupAfterTest() {
    // Remove any test data created during the test
    cy.task('db:cleanup', null);
  }
};

// Add custom commands for database operations
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Clear all test data from database
       */
      clearTestData(): Chainable<void>
      
      /**
       * Seed database with test data
       */
      seedTestData(): Chainable<void>
      
      /**
       * Add points to user for testing
       */
      addTestPoints(userId: number, points: number): Chainable<void>
      
      /**
       * Create test vehicle
       */
      createTestVehicle(vehicleData: any): Chainable<void>
      
      /**
       * Cleanup test data
       */
      cleanupTestData(): Chainable<void>
    }
  }
}

Cypress.Commands.add('clearTestData', () => {
  dbHelpers.clearTestData();
});

Cypress.Commands.add('seedTestData', () => {
  dbHelpers.seedTestData();
});

Cypress.Commands.add('addTestPoints', (userId: number, points: number) => {
  dbHelpers.addPointsToUser(userId, points);
});

Cypress.Commands.add('createTestVehicle', (vehicleData: any) => {
  dbHelpers.createTestVehicle(vehicleData);
});

Cypress.Commands.add('cleanupTestData', () => {
  dbHelpers.cleanupAfterTest();
});

export {}