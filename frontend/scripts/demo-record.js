const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const parseEnvFile = (raw) => {
  return raw.split(/\r?\n/).reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return acc;
    }
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) {
      return acc;
    }
    let value = match[2] || "";
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    acc[match[1]] = value;
    return acc;
  }, {});
};

const loadEnvFile = (filePath) => {
  if (!filePath || !fs.existsSync(filePath)) {
    return {};
  }
  try {
    return parseEnvFile(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.warn(`Failed to read env file: ${filePath}`);
    return {};
  }
};

const envFromFiles = [
  process.env.DEMO_CREDENTIALS_PATH,
  path.join(__dirname, "..", ".env.local"),
  path.join(__dirname, "..", ".env"),
  path.join(__dirname, "..", "..", ".env"),
].reduce((acc, filePath) => ({ ...acc, ...loadEnvFile(filePath) }), {});

const getEnv = (key, fallback) => process.env[key] || envFromFiles[key] || fallback;

const FRONTEND_URL = getEnv("DEMO_FRONTEND_URL", "http://localhost:3000");
const API_BASE_URL = getEnv("DEMO_API_BASE_URL", "http://localhost:8080");
const EMAIL = getEnv("DEMO_EMAIL", "");
const PASSWORD = getEnv("DEMO_PASSWORD", "");
const BROWSER_CHANNEL = getEnv("DEMO_BROWSER_CHANNEL", "chrome");
const OUTPUT_DIR = getEnv("DEMO_OUTPUT_DIR", path.join(__dirname, "..", "recordings"));
const RECORD_VIDEO = getEnv("DEMO_RECORD_VIDEO", "true") !== "false";
const MARKERS_PATH = getEnv("DEMO_MARKERS_PATH", path.join(OUTPUT_DIR, "markers.json"));

if (!EMAIL || !PASSWORD) {
  console.error("Missing DEMO_EMAIL or DEMO_PASSWORD. Set them in .env/.env.local or via env vars.");
  process.exit(1);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const runDemo = async () => {
  const startTime = Date.now();
  const markers = [];
  const logMarker = (label) => {
    const elapsedMs = Date.now() - startTime;
    const marker = { label, elapsed_ms: elapsedMs };
    markers.push(marker);
    console.log(`MARK ${label} @ ${elapsedMs}ms`);
  };
  const waitForNotice = async (successText, failureText) => {
    try {
      await page.getByText(successText).waitFor({ timeout: 2000 });
      return true;
    } catch (error) {
      if (failureText) {
        try {
          await page.getByText(failureText).waitFor({ timeout: 1500 });
        } catch (noticeError) {
          console.warn(`Notice not found: ${failureText}`);
        }
      }
      return false;
    }
  };
  const waitForApiResponse = async (method, urlPart) => {
    try {
      const response = await page.waitForResponse(
        (resp) => resp.url().includes(urlPart) && resp.request().method() === method,
        { timeout: 10000 }
      );
      if (!response.ok()) {
        console.warn(`API ${method} ${urlPart} failed with status ${response.status()}.`);
      }
      return response;
    } catch (error) {
      console.warn(`API ${method} ${urlPart} did not respond in time.`);
      return null;
    }
  };
  const mergeLocalSettings = async (payload) => {
    if (!payload?.data?.token) {
      return;
    }
    const token = payload.data.token;
    const tenantId = payload.data.user?.tenant_id ? String(payload.data.user.tenant_id) : "";
    const user = payload.data.user || null;
    await page.evaluate(
      ({ tokenValue, tenantValue, userValue }) => {
        const key = "retailops_settings_v1";
        const raw = localStorage.getItem(key);
        let existing = {};
        if (raw) {
          try {
            existing = JSON.parse(raw);
          } catch {
            existing = {};
          }
        }
        const merged = {
          baseUrl: existing.baseUrl || "http://localhost:8080",
          token: tokenValue || existing.token || "",
          tenantId: tenantValue || existing.tenantId || "1",
          tenantName: existing.tenantName || "",
          user: userValue || existing.user || null,
        };
        localStorage.setItem(key, JSON.stringify(merged));
      },
      { tokenValue: token, tenantValue: tenantId, userValue: user }
    );
  };
  const readRowId = async (rowLocator) => (await rowLocator.locator("td").first().innerText()).trim();
  const resolveRowId = async (preferredRow, fallbackRow, fallbackValue) => {
    if (await preferredRow.count()) {
      return await readRowId(preferredRow);
    }
    if (await fallbackRow.count()) {
      return await readRowId(fallbackRow);
    }
    return fallbackValue;
  };

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
  let customerId = "";

  try {
    logMarker("open_login");
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "networkidle" });

    await page.getByPlaceholder("API Base URL").fill(API_BASE_URL);
    await page.getByPlaceholder("Email").fill(EMAIL);
    await page.getByPlaceholder("Password").fill(PASSWORD);
    logMarker("submit_login");
    const loginResponsePromise = waitForApiResponse("POST", "/api/auth/login");
    await page.locator(".form").getByRole("button", { name: "Login", exact: true }).click();
    const loginResponse = await loginResponsePromise;
    if (!loginResponse || !loginResponse.ok()) {
      throw new Error("Login failed. Check DEMO_EMAIL/DEMO_PASSWORD and API availability.");
    }
    const loginPayload = await loginResponse.json().catch(() => null);

    await page.waitForURL("**/products");
    await mergeLocalSettings(loginPayload);
    const storedToken = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem("retailops_settings_v1");
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed.token || "";
      } catch {
        return "";
      }
    });
    if (!storedToken) {
      throw new Error("Login token not stored. Aborting demo.");
    }
    await page.waitForTimeout(300);

    logMarker("open_customers");
    await page.locator(".nav").getByRole("link", { name: "Customers", exact: true }).click();
    await page.waitForURL("**/customers");
    await page.waitForTimeout(300);

    logMarker("customers_open_form");
    await page.getByRole("button", { name: "Create customer" }).click();

    logMarker("customers_create");
    await page.getByPlaceholder("Name").fill("Demo Customer");
    await page.getByPlaceholder("Email").fill("demo.customer@retailops.dev");
    await page.getByPlaceholder("Phone").fill("+1-415-555-0199");
    await Promise.all([
      waitForApiResponse("POST", "/api/customers"),
      page.getByRole("button", { name: "Create" }).click(),
    ]);
    await waitForNotice("Customer created.", "Failed to create customer.");

    await page.getByRole("button", { name: "Refresh list" }).click();
    await page.waitForTimeout(1200);
  } catch (error) {
    console.error("Demo recording failed:", error);
    process.exitCode = 1;
  } finally {
    try {
      fs.writeFileSync(MARKERS_PATH, JSON.stringify(markers, null, 2));
      console.log(`Markers saved to: ${MARKERS_PATH}`);
    } catch (writeError) {
      console.warn("Failed to write markers file:", writeError);
    }

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
