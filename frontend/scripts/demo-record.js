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
  let productId = "";
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

    logMarker("products_create");
    await page.getByPlaceholder("Name").fill("Demo Espresso Beans");
    await page.getByPlaceholder("SKU").fill("DEMO-ESP-01");
    await page.getByPlaceholder("Price").fill("24.99");
    await page.getByPlaceholder("Stock", { exact: true }).fill("120");
    await page.getByPlaceholder("Low stock threshold", { exact: true }).fill("10");
    await Promise.all([
      waitForApiResponse("POST", "/api/products"),
      page.getByRole("button", { name: "Create" }).click(),
    ]);
    await waitForNotice("Product created.", "Failed to create product.");

    await page.getByRole("button", { name: "Refresh list" }).click();
    const productRows = page.locator("table tbody tr");
    await page.waitForTimeout(300);
    const productRow = productRows.filter({ hasText: "DEMO-ESP-01" }).first();
    productId = await resolveRowId(productRow, productRows.first(), "1");

    await page.getByPlaceholder("Product ID for update/delete").fill(productId);
    await Promise.all([
      waitForApiResponse("GET", `/api/products/${productId}`),
      page.getByRole("button", { name: "Fetch" }).click(),
    ]);
    await waitForNotice("Product loaded.", "Failed to fetch product.");

    logMarker("products_update");
    await page.getByPlaceholder("Price").fill("26.50");
    await Promise.all([
      waitForApiResponse("PUT", `/api/products/${productId}`),
      page.getByRole("button", { name: "Update" }).click(),
    ]);
    await waitForNotice("Product updated.", "Failed to update product.");

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
    const customerRows = page.locator("table tbody tr");
    await page.waitForTimeout(300);
    const customerRow = customerRows.filter({ hasText: "demo.customer@retailops.dev" }).first();
    customerId = await resolveRowId(customerRow, customerRows.first(), "1");

    await page.getByPlaceholder("Customer ID for update/delete").fill(customerId);
    await Promise.all([
      waitForApiResponse("GET", `/api/customers/${customerId}`),
      page.getByRole("button", { name: "Fetch" }).click(),
    ]);
    await waitForNotice("Customer loaded.", "Failed to fetch customer.");

    logMarker("customers_update");
    await page.getByPlaceholder("Phone").fill("+1-415-555-0142");
    await Promise.all([
      waitForApiResponse("PUT", `/api/customers/${customerId}`),
      page.getByRole("button", { name: "Update" }).click(),
    ]);
    await waitForNotice("Customer updated.", "Failed to update customer.");

    logMarker("open_orders");
    await page.locator(".nav").getByRole("link", { name: "Orders", exact: true }).click();
    await page.waitForURL("**/orders");
    await page.waitForTimeout(300);

    await page.getByPlaceholder("Customer ID (optional)").fill(customerId);
    await page.getByRole("button", { name: "Add item" }).click();
    const productIdInputs = page.getByPlaceholder("Product ID");
    await productIdInputs.nth(0).fill(productId);
    await page.getByPlaceholder("Quantity").nth(0).fill("1");

    logMarker("orders_create");
    await Promise.all([
      waitForApiResponse("POST", "/api/orders"),
      page.getByRole("button", { name: "Create order" }).click(),
    ]);
    await waitForNotice("Order created.", "Failed to create order.");
    await page.getByRole("button", { name: "Refresh list" }).click();
    const orderRows = page.locator("table tbody tr");
    await page.waitForTimeout(300);
    const orderId = await resolveRowId(orderRows.first(), orderRows.first(), "1");

    logMarker("orders_pay");
    await page.getByPlaceholder("Order ID").fill(orderId);
    await Promise.all([
      waitForApiResponse("POST", `/api/orders/${orderId}/pay`),
      page.getByRole("button", { name: "Pay" }).click(),
    ]);
    await waitForNotice("Order marked as paid.", "Failed to pay order.");

    logMarker("open_reports");
    await page.locator(".nav").getByRole("link", { name: "Reports", exact: true }).click();
    await page.waitForURL("**/reports");
    await page.waitForTimeout(500);
    logMarker("run_daily_sales");
    await Promise.all([
      waitForApiResponse("GET", "/api/reports/daily-sales"),
      page.getByRole("button", { name: "Daily sales" }).click(),
    ]);
    await waitForNotice("Daily sales loaded.", "Failed to load daily sales.");
    logMarker("run_top_products");
    await Promise.all([
      waitForApiResponse("GET", "/api/reports/top-products"),
      page.getByRole("button", { name: "Top products" }).click(),
    ]);
    await waitForNotice("Top products loaded.", "Failed to load top products.");
    logMarker("run_low_stock");
    await Promise.all([
      waitForApiResponse("GET", "/api/reports/low-stock"),
      page.getByRole("button", { name: "Low stock" }).click(),
    ]);
    await waitForNotice("Low stock report loaded.", "Failed to load low stock.");
    logMarker("queue_snapshot");
    await Promise.all([
      waitForApiResponse("POST", "/api/reports/daily-sales/snapshot"),
      page.getByRole("button", { name: "Queue snapshot" }).click(),
    ]);
    await waitForNotice("Snapshot queued.", "Failed to queue snapshot.");
    logMarker("fetch_snapshot");
    await Promise.all([
      waitForApiResponse("GET", "/api/reports/daily-sales/snapshot"),
      page.getByRole("button", { name: "Fetch snapshot" }).click(),
    ]);
    await waitForNotice("Snapshot retrieved.", "Snapshot not ready.");

    logMarker("open_billing");
    await page.locator(".nav").getByRole("link", { name: "Billing", exact: true }).click();
    await page.waitForURL("**/billing");
    await page.waitForTimeout(500);
    logMarker("billing_subscribe");
    await Promise.all([
      waitForApiResponse("POST", "/api/billing/subscribe"),
      page.getByRole("button", { name: "Create subscription" }).click(),
    ]);
    await waitForNotice("Subscription created.", "Failed to create subscription.");
    logMarker("billing_refresh");
    await Promise.all([
      waitForApiResponse("GET", "/api/billing/subscription"),
      page.getByRole("button", { name: "Refresh subscription" }).click(),
    ]);
    await waitForNotice("Subscription loaded.", "Failed to fetch subscription.");

    logMarker("open_profile");
    await page.locator(".nav").getByRole("link", { name: "Profile", exact: true }).click();
    await page.waitForURL("**/profile");
    await page.waitForTimeout(500);

    logMarker("open_settings");
    await page.locator(".nav").getByRole("link", { name: "Settings", exact: true }).click();
    await page.waitForURL("**/settings");
    await page.waitForTimeout(500);
    logMarker("save_settings");
    await page.getByRole("button", { name: "Save settings" }).click();
    await page.getByText("Saved.").waitFor({ timeout: 5000 });

    logMarker("open_overview");
    await page.locator(".nav").getByRole("link", { name: "Overview", exact: true }).click();
    await page.waitForURL("**/");
    await page.waitForTimeout(600);

    logMarker("cleanup_customers");
    await page.goto(`${FRONTEND_URL}/customers`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Create customer" }).click();
    await page.getByPlaceholder("Customer ID for update/delete").fill(customerId);
    await Promise.all([
      waitForApiResponse("DELETE", `/api/customers/${customerId}`),
      page.getByRole("button", { name: "Delete" }).click(),
    ]);
    await waitForNotice("Customer deleted.", "Failed to delete customer.");

    logMarker("cleanup_products");
    await page.goto(`${FRONTEND_URL}/products`, { waitUntil: "networkidle" });
    await page.getByPlaceholder("Product ID for update/delete").fill(productId);
    await Promise.all([
      waitForApiResponse("DELETE", `/api/products/${productId}`),
      page.getByRole("button", { name: "Delete" }).click(),
    ]);
    await waitForNotice("Product deleted.", "Failed to delete product.");

    await page.waitForTimeout(1500);
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
