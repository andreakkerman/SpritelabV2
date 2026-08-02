const { defineConfig } = require("@playwright/test");
const fs = require("node:fs");
const systemChrome = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium", "/usr/bin/chromium-browser", "/opt/google/chrome/chrome",
].find(candidate => candidate && fs.existsSync(candidate));
module.exports = defineConfig({
  testDir: "tests", testMatch: "**/*.spec.js", timeout: 30000, fullyParallel: false, reporter: "list",
  use: { baseURL: "http://127.0.0.1:4173", browserName: "chromium", launchOptions: { ...(systemChrome ? { executablePath: systemChrome } : {}), args: ["--no-sandbox"] }, trace: "retain-on-failure" },
  webServer: { command: "python3 -m http.server 4173", url: "http://127.0.0.1:4173", reuseExistingServer: true }
});
