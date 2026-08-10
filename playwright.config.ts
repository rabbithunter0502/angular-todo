import { defineConfig, devices } from '@playwright/test';

/**
 * Runs against the **production build**, served statically — not `ng serve` — so a bug that only
 * shows up post-bundling/minification (the kind unit tests can't see) fails here instead of in
 * prod. `webServer.command` assumes `dist/angular-todo/browser` already exists: the CI job runs
 * `npm run build` before `npm run e2e` (see `.github/workflows/pipeline.yml`); locally, run
 * `npm run build && npm run e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4300',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx http-server dist/angular-todo/browser -p 4300 -s',
    url: 'http://127.0.0.1:4300',
    reuseExistingServer: !process.env['CI'],
    timeout: 30_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
