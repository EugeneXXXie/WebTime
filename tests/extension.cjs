const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "webtime-test-"));
  const browser = await chromium.launchPersistentContext(profile, {
    headless: true,
    ignoreDefaultArgs: ["--disable-extensions"],
    executablePath: process.env.CHROME_PATH || chromium.executablePath(),
    args: ["--enable-unsafe-extension-debugging"],
  });
  try {
    const cdp = await browser.browser().newBrowserCDPSession();
    const loaded = await cdp.send("Extensions.loadUnpacked", { path: root });
    console.log("Loaded extension", loaded.id);
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto(`chrome-extension://${loaded.id}/dashboard/index.html`);
    await page.locator("#hero-number").waitFor();
    const snapshot = await page.evaluate(() =>
      chrome.runtime.sendMessage({ type: "snapshot" }),
    );
    assert(snapshot.ok);
    assert.notEqual(snapshot.result.live.status, "live");
    const invalid = await page.evaluate(() =>
      chrome.runtime.sendMessage({ type: "import", data: { version: 999 } }),
    );
    assert.equal(invalid.ok, false);
    await page.goto(`chrome-extension://${loaded.id}/settings/index.html`);
    await page.locator("#theme").selectOption("light");
    await page.waitForFunction(
      () => document.documentElement.dataset.theme === "light",
    );
    const stored = await page.evaluate(() => chrome.storage.local.get("store"));
    assert.equal(stored.store.data.settings.theme, "light");
    const pageCDP = await browser.newCDPSession(page);
    await pageCDP.send("ServiceWorker.enable");
    await pageCDP.send("ServiceWorker.stopAllWorkers");
    const restarted = await page.evaluate(() =>
      chrome.runtime.sendMessage({ type: "snapshot" }),
    );
    assert(restarted.ok);
    assert.equal(restarted.result.data.settings.theme, "light");
    const { freshData, addInterval } = await import("../tracking/core.js");
    const fixture = freshData();
    fixture.settings.theme = "light";
    addInterval(fixture, "github.com", Date.now() - 60000, Date.now(), true);
    const imported = await page.evaluate(
      (data) => chrome.runtime.sendMessage({ type: "import", data }),
      fixture,
    );
    assert(imported.ok);
    await page.goto(`chrome-extension://${loaded.id}/dashboard/index.html`);
    await page.waitForFunction(
      () => document.querySelector(".favicon img")?.naturalWidth > 0,
    );
    await page
      .locator(".favicon img")
      .first()
      .evaluate((el) => el.dispatchEvent(new Event("error")));
    assert.equal(await page.locator(".site-row .favicon img").count(), 0);
    assert.equal(
      await page.locator(".site-row .favicon-letter").innerText(),
      "G",
    );
    await page.goto(`chrome-extension://${loaded.id}/popup/index.html`);
    await page.locator("#theme").waitFor();
    await page.waitForFunction(
      () => document.documentElement.dataset.theme === "light",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: real Chrome unpacked load, MV3 worker restart, messaging, storage, invalid import preservation, settings and popup; no page or console errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
