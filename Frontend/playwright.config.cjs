const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/ui',
  timeout: 15_000,
  use: { baseURL: 'http://localhost:5501', headless: true },
  webServer: [
    {
      command: 'node scripts/static-server.cjs',
      url: 'http://localhost:5501',
      reuseExistingServer: false,
    },
    {
      command: 'CORS_ORIGINS=http://localhost:5501 npm run build && CORS_ORIGINS=http://localhost:5501 npm start',
      cwd: '../Backend',
      url: 'http://127.0.0.1:8000/api/health',
      reuseExistingServer: false,
    },
  ],
});
