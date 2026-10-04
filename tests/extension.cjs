const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const server = require("node:http").createServer((_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.end(
    "<!doctype html><title>WebTime test</title><p>Synthetic open-tab test</p>",
  );
});
(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "webtime-test-"));
  const browser = await chromium.launchPersistentContext(profile, {
    headless: true,
    locale: "zh-CN",
    ignoreDefaultArgs: ["--disable-extensions"],
    executablePath: process.env.CHROME_PATH || chromium.executablePath(),
    args: ["--enable-unsafe-extension-debugging"],
  });
  browser.setDefaultTimeout(15000);
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
    assert.equal(await page.locator("html").getAttribute("lang"), "zh");
    assert.equal(await page.locator('[data-page="today"]').innerText(), "今天");
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
    await page.locator("#language").selectOption("en");
    await page.locator("#theme").selectOption("light");
    await page.waitForFunction(
      () => document.documentElement.dataset.theme === "light",
    );
    const stored = await page.evaluate(() => chrome.storage.local.get("store"));
    assert.equal(stored.store.data.settings.theme, "light");
    assert.equal(stored.store.data.settings.language, "en");
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
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = server.address().port;
    await page.evaluate(() => chrome.runtime.sendMessage({ type: "clear" }));
    const one = await browser.newPage(),
      two = await browser.newPage(),
      duplicate = await browser.newPage();
    await one.goto(`http://localhost:${port}/one`);
    await two.goto(`http://127.0.0.1:${port}/two`);
    await duplicate.goto(`http://localhost:${port}/another`);
    await page.bringToFront(); // All tracked pages are now in the background.
    const snapshotNow = () =>
      page.evaluate(async () => {
        const response = await chrome.runtime.sendMessage({ type: "snapshot" });
        if (!response.ok) throw Error(response.error);
        return response.result;
      });
    const before = await snapshotNow();
    assert.equal(before.live.domains.length, 2);
    await page.waitForTimeout(1200);
    const after = await snapshotNow();
    const elapsed =
      after.data.activity.totalSeconds - before.data.activity.totalSeconds;
    assert(elapsed >= 1);
    for (const domain of ["localhost", "127.0.0.1"])
      assert(
        Math.abs(
          (after.data.domains[domain]?.totalSeconds || 0) -
            (before.data.domains[domain]?.totalSeconds || 0) -
            elapsed,
        ) < 0.05,
        "Each domain counts once, even with duplicate background tabs",
      );
    await page.goto(`chrome-extension://${loaded.id}/settings/index.html`);
    assert.equal(await page.locator("#blockLocalIPs").isChecked(), false);
    await page.locator("#blockLocalIPs").check();
    await page.waitForFunction(
      async () =>
        (await chrome.runtime.sendMessage({ type: "snapshot" })).result.data
          .settings.blockLocalIPs === true,
    );
    const blocked = await snapshotNow();
    assert.equal(blocked.live.status, "inactive");
    await page.waitForTimeout(1100);
    assert.deepEqual((await snapshotNow()).data.domains, blocked.data.domains);
    assert.equal(
      (await snapshotNow()).data.activity.totalSeconds,
      blocked.data.activity.totalSeconds,
    );
    await page.reload();
    await page.waitForFunction(
      () => document.querySelector("#blockLocalIPs").checked,
    );
    await page.locator("#blockLocalIPs").uncheck();
    await page.waitForFunction(
      async () =>
        (await chrome.runtime.sendMessage({ type: "snapshot" })).result.live
          .domains?.length === 2,
    );
    await page.waitForTimeout(1100);
    assert(
      (await snapshotNow()).data.activity.totalSeconds >
        blocked.data.activity.totalSeconds,
    );
    await one.close();
    await duplicate.close();
    const closed = await snapshotNow();
    assert.equal(closed.live.domains.length, 1);
    await page.waitForTimeout(1100);
    const later = await snapshotNow();
    assert.equal(
      later.data.domains.localhost.totalSeconds,
      closed.data.domains.localhost.totalSeconds,
    );
    assert(
      later.data.activity.totalSeconds > closed.data.activity.totalSeconds,
    );
    await two.close();
    assert.equal((await snapshotNow()).live.status, "inactive");
    const labels = {
      zh: "设置",
      en: "Settings",
      ja: "設定",
      ko: "설정",
      de: "Einstellungen",
      it: "Impostazioni",
      ru: "Настройки",
      es: "Ajustes",
    };
    const translatedFixture = freshData();
    const now = Date.now();
    addInterval(translatedFixture, "github.com", now - 20520000, now, true);
    addInterval(
      translatedFixture,
      "youtube.com",
      now - 7200000,
      now,
      true,
      false,
    );
    await page.evaluate(
      (data) => chrome.runtime.sendMessage({ type: "import", data }),
      translatedFixture,
    );
    const dashboard = await browser.newPage();
    await dashboard.goto(
      `chrome-extension://${loaded.id}/dashboard/index.html`,
    );
    await dashboard.locator("#hero-number").waitFor();
    // Exercise native new-tab links without reaching external websites.
    for (const domain of ["youtube.com", "github.com"]) {
      const target = `https://${domain}/`;
      await browser.route(target, (route) =>
        route.fulfill({
          contentType: "text/html",
          body: "<title>Test destination</title>",
        }),
      );
      await dashboard.goto(
        `chrome-extension://${loaded.id}/dashboard/index.html#detail/${domain}`,
      );
      const title = dashboard.locator(".detail-title");
      await title.waitFor();
      const img = title.locator("img");
      for (const [width, height] of [
        [16, 16],
        [64, 32],
        [16, 64],
      ]) {
        await img.evaluate(
          (img, { width, height }) => {
            img.src =
              "data:image/svg+xml," +
              encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="red"/></svg>`,
              );
          },
          { width, height },
        );
        await img.evaluate((img) => img.decode());
        const geometry = await img.evaluate((img) => {
          const a = img.getBoundingClientRect(),
            b = img.parentElement.getBoundingClientRect();
          return {
            width: a.width,
            height: a.height,
            dx: a.x + a.width / 2 - b.x - b.width / 2,
            dy: a.y + a.height / 2 - b.y - b.height / 2,
            fit: getComputedStyle(img).objectFit,
            overflow: getComputedStyle(img.parentElement).overflow,
          };
        });
        assert.equal(geometry.width, 40);
        assert.equal(geometry.height, 40);
        assert(Math.abs(geometry.dx) < 0.1 && Math.abs(geometry.dy) < 0.1);
        assert.equal(geometry.fit, "contain");
        assert.equal(geometry.overflow, "hidden");
      }
      assert.equal(
        await title.evaluate((el) => getComputedStyle(el).cursor),
        "pointer",
      );
      const originalURL = dashboard.url();
      const openedPromise = browser.waitForEvent("page");
      await title.click();
      const opened = await openedPromise;
      await opened.waitForURL(target);
      assert.equal(dashboard.url(), originalURL);
      await opened.close();
    }
    await dashboard.goto(
      `chrome-extension://${loaded.id}/dashboard/index.html`,
    );
    await dashboard.locator("#hero-number").waitFor();
    const popup = await browser.newPage();
    await popup.setViewportSize({ width: 380, height: 560 });
    await popup.goto(`chrome-extension://${loaded.id}/popup/index.html`);
    await popup.locator("#total").waitFor();
    await page.goto(`chrome-extension://${loaded.id}/settings/index.html`);
    for (const [lang, label] of Object.entries(labels)) {
      console.log("Checking locale", lang);
      await page.locator("#language").selectOption(lang);
      await page.waitForFunction(
        (lang) => document.documentElement.lang === lang,
        lang,
      );
      assert.equal(await page.locator("h1").innerText(), label);
      await popup.waitForFunction(
        (lang) => document.documentElement.lang === lang,
        lang,
      );
      assert(
        await popup.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `Popup overflow: ${lang}`,
      );
      if (lang === "zh")
        await page.evaluate(async () => {
          const { errorMessage } = await import("../shared/ui.js");
          errorMessage(Error("Invalid settings."));
        });
      if (lang === "en")
        assert.equal(
          await page.locator("#error").innerText(),
          "Invalid settings.",
        );
      await dashboard.waitForFunction(
        (lang) => document.documentElement.lang === lang,
        lang,
      );
      assert.equal((await snapshotNow()).data.settings.language, lang);
      await page.locator("#clear").click();
      if (lang !== "en")
        assert.notEqual(
          await page.locator("#confirm-title").innerText(),
          "Clear all data?",
        );
      await page.locator('button[value="cancel"]').click();
      await dashboard.setViewportSize({ width: 390, height: 844 });
      assert(
        await dashboard.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `Dashboard overflow: ${lang}`,
      );
      if (["zh", "de"].includes(lang)) {
        for (const [route, selector] of [
          ["week", ".rhythm"],
          ["month", ".rhythm"],
          ["websites", "#search"],
          ["detail/github.com", ".detail-title"],
          ["today", "#hero-number"],
        ]) {
          await dashboard.evaluate((route) => (location.hash = route), route);
          await dashboard.locator(selector).waitFor();
          assert(
            await dashboard.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            `${lang} ${route} overflow`,
          );
        }
      }
      await page.setViewportSize({ width: 390, height: 844 });
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `Settings overflow: ${lang}`,
      );
      if (lang === "de") {
        fs.mkdirSync(path.join(root, "tests/artifacts"), { recursive: true });
        await popup.screenshot({
          path: path.join(root, "tests/artifacts/popup-de.png"),
          fullPage: true,
        });
        await dashboard.screenshot({
          path: path.join(root, "tests/artifacts/dashboard-de-mobile.png"),
          fullPage: true,
        });
      }
    }
    await page.locator("#language").selectOption("system");
    await page.locator("#error").evaluate((el) => el.remove());
    await page.waitForFunction(() => document.documentElement.lang === "zh");
    await page.setViewportSize({ width: 1280, height: 1100 });
    fs.mkdirSync(path.join(root, "tests/artifacts"), { recursive: true });
    await page.screenshot({
      path: path.join(root, "tests/artifacts/settings-zh.png"),
      fullPage: true,
    });
    await dashboard.setViewportSize({ width: 1280, height: 900 });
    await dashboard.screenshot({
      path: path.join(root, "tests/artifacts/dashboard-zh.png"),
      fullPage: true,
    });
    await dashboard.close();
    await popup.close();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: real Chrome unpacked load, MV3 worker restart, messaging, storage, invalid import preservation, settings and popup; no page or console errors.",
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
