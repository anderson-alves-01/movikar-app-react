import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: false,
    screenshotOnRunFailure: false,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 15000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    taskTimeout: 60000,
    pageLoadTimeout: 60000,
    retries: {
      runMode: 2,
      openMode: 1
    },
    experimentalStudio: false,
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 1,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'electron') {
          launchOptions.args.push('--disable-features=VizDisplayCompositor')
          launchOptions.args.push('--disable-gpu')
          launchOptions.args.push('--no-sandbox')
        }
        return launchOptions
      })
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
})