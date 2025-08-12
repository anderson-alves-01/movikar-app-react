
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Diretório dos testes
  testDir: './tests/e2e',
  
  // Timeout padrão para cada teste
  timeout: 30000,
  
  // Expect timeout
  expect: {
    timeout: 5000
  },

  // Configuração para CI/CD no Replit
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configurado para Replit
  reporter: [
    ['html'],
    ['json', { outputFile: 'tests/results/playwright-results.json' }],
    ['line']
  ],

  // Configurações globais
  use: {
    // URL base da aplicação
    baseURL: 'http://0.0.0.0:5000',
    
    // Trace para debugging
    trace: 'on-first-retry',
    
    // Screenshots em falhas
    screenshot: 'only-on-failure',
    
    // Video em falhas
    video: 'retain-on-failure',
    
    // Ignorar certificados HTTPS em desenvolvimento
    ignoreHTTPSErrors: true,
    
    // Viewport padrão
    viewport: { width: 1280, height: 720 }
  },

  // Configuração de projetos (navegadores)
  projects: [
    {
      name: 'chromium',
      use: { 
        ...require('@playwright/test').devices['Desktop Chrome'],
        // Configurações específicas para Replit
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
          ]
        }
      },
    },
    
    // Mobile testing
    {
      name: 'mobile-chrome',
      use: { ...require('@playwright/test').devices['Pixel 5'] },
    },
  ],

  // Servidor de desenvolvimento
  webServer: {
    command: 'npm run dev',
    port: 5000,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
});
