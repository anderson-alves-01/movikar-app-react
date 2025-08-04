/// <reference types="cypress" />

import { defineConfig } from 'cypress';

/**
 * Cypress plugins configuration
 * Used for tasks, database setup, and other server-side operations
 */

module.exports = (on: Cypress.PluginEvents, config: Cypress.PluginConfig) => {
  // Task definitions for database operations
  on('task', {
    // Database operations
    'db:clear'() {
      // Clear test data from database
      console.log('Clearing test data from database...');
      return null;
    },

    'db:seed'() {
      // Seed database with test data
      console.log('Seeding database with test data...');
      return null;
    },

    'db:addPoints'({ userId, points }: { userId: number; points: number }) {
      // Add points to user for testing
      console.log(`Adding ${points} points to user ${userId}`);
      return null;
    },

    'db:createVehicle'(vehicleData: any) {
      // Create test vehicle
      console.log('Creating test vehicle:', vehicleData);
      return null;
    },

    'db:cleanup'() {
      // Cleanup test data
      console.log('Cleaning up test data...');
      return null;
    },

    // File operations
    'file:exists'(filePath: string) {
      const fs = require('fs');
      return fs.existsSync(filePath);
    },

    'file:read'(filePath: string) {
      const fs = require('fs');
      try {
        return fs.readFileSync(filePath, 'utf8');
      } catch (error) {
        return null;
      }
    },

    // Log operations
    'log:info'(message: string) {
      console.log(`[CYPRESS INFO] ${message}`);
      return null;
    },

    'log:error'(message: string) {
      console.error(`[CYPRESS ERROR] ${message}`);
      return null;
    }
  });

  // Event listeners
  on('before:browser:launch', (browser, launchOptions) => {
    console.log('Launching browser:', browser.name);
    
    if (browser.name === 'chrome' && browser.isHeadless) {
      // Chrome headless optimizations
      launchOptions.args.push('--disable-gpu');
      launchOptions.args.push('--no-sandbox');
      launchOptions.args.push('--disable-dev-shm-usage');
    }

    return launchOptions;
  });

  on('after:spec', (spec, results) => {
    console.log(`Spec completed: ${spec.relative}`);
    console.log(`Tests: ${results.stats?.tests}, Passes: ${results.stats?.passes}, Failures: ${results.stats?.failures}`);
  });

  on('after:run', (results) => {
    console.log('Test run completed');
    console.log('Total tests:', results.totalTests);
    console.log('Total passed:', results.totalPassed);
    console.log('Total failed:', results.totalFailed);
    console.log('Duration:', results.totalDuration);
  });

  return config;
};