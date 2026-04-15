import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    specPattern: '../katas/**/cypress/*.cy.ts',
    supportFile: 'support/e2e.ts',
    video: false,
    screenshotOnRunFailure: true,
  },
});
