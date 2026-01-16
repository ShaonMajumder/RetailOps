const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const FRONTEND_URL = process.env.DEMO_FRONTEND_URL || "http://localhost:3000";
const API_BASE_URL = process.env.DEMO_API_BASE_URL || "http://localhost:8080";
const EMAIL = process.env.DEMO_EMAIL;
const PASSWORD = process.env.DEMO_PASSWORD;
const BROWSER_CHANNEL = process.env.DEMO_BROWSER_CHANNEL || "chrome";
const OUTPUT_DIR = process.env.DEMO_OUTPUT_DIR || path.join(__dirname, "..", "public", "demo-recordings");
const RECORD_VIDEO = process.env.DEMO_RECORD_VIDEO !== "false";

if (!EMAIL || !PASSWORD) {
  console.error("Missing DEMO_EMAIL or DEMO_PASSWORD env vars.");
  process.exit(1);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const runDemo = async () => {
  let browser;
  try {
    browser = await chromium.launch({ headless: false, slowMo: 150, channel: BROWSER_CHANNEL });
  } catch (error) {
    console.warn(`Failed to launch channel "${BROWSER_CHANNEL}", falling back to Playwright Chromium.`);
    browser = await chromium.launch({ headless: false, slowMo: 150 });
  }
  const contextOptions = {};
  let context;
  try {
    if (RECORD_VIDEO) {
      contextOptions.recordVideo = {
        dir: OUTPUT_DIR,
        size: { width: 1440, height: 900 },
      };
    }
    context = await browser.newContext(contextOptions);
  } catch (error) {
    if (!RECORD_VIDEO) {
      throw error;
    }
    console.warn("Video recording unavailable (ffmpeg missing). Running without recording.");
    context = await browser.newContext();
  }
  const page = await context.newPage();

  try {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "networkidle" });

    await page.getByPlaceholder("API Base URL").fill(API_BASE_URL);
    await page.getByPlaceholder("Email").fill(EMAIL);
    await page.getByPlaceholder("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Login", exact: true }).click();

    await page.waitForURL("**/products");
    await page.waitForTimeout(1000);

    await page.getByPlaceholder("Name").fill("Demo Espresso Beans");
    await page.getByPlaceholder("SKU").fill("DEMO-ESP-01");
    await page.getByPlaceholder("Price").fill("24.99");
    await page.getByPlaceholder("Stock").fill("120");
    await page.getByPlaceholder("Low stock threshold").fill("10");
    await page.getByRole("button", { name: "Create" }).click();
    await page.getByText("Product created.").waitFor({ timeout: 5000 });

    await page.getByRole("link", { name: "Reports" }).click();
    await page.waitForURL("**/reports");
    await page.getByRole("button", { name: "Top products" }).click();
    await page.getByText("Top products loaded.").waitFor({ timeout: 5000 });

    await page.waitForTimeout(1500);
  } catch (error) {
    console.error("Demo recording failed:", error);
    process.exitCode = 1;
  } finally {
    await context.close();
    await browser.close();

    if (page.video()) {
      const videoPath = await page.video().path();
      console.log(`Demo recording saved to: ${videoPath}`);
    }
  }
};

runDemo().catch((error) => {
  console.error("Demo runner crashed:", error);
  process.exit(1);
});
