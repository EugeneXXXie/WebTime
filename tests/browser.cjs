// Development-only browser validation. Set PLAYWRIGHT_MODULE to a local Playwright install.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const http = require("node:http"),
  fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
};
const server = http.createServer((req, res) => {
  const file = path.resolve(
    root,
    "." + decodeURIComponent(req.url.split("?")[0]),
  );
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) res.writeHead(404).end();
    else {
      res.setHeader(
        "Content-Type",
        mime[path.extname(file)] || "application/octet-stream",
      );
      res.end(data);
    }
  });
});
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || chromium.executablePath(),
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      locale: "en-US",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/dashboard/index.html?demo");
    await page.locator(".site-row").first().waitFor();
    await page.waitForTimeout(800);
    fs.mkdirSync(path.join(root, "tests/artifacts"), { recursive: true });
    await page.screenshot({
      animations: "disabled",
      path: path.join(root, "tests/artifacts/today-dark.png"),
    });
    assert(
      await page
        .locator(".week-strip")
        .evaluate((el) => el.getBoundingClientRect().bottom <= 1080),
      "Core content must fit 1080p",
    );
    await page.locator(".site-row").first().hover();
    assert.equal(await page.locator(".segment.linked").count(), 1);
    await page.locator(".site-row").first().focus();
    await page.evaluate(() => (window.focusedRow = document.activeElement));
    await page.waitForTimeout(5200);
    assert(
      await page.evaluate(
        () =>
          document.activeElement === window.focusedRow &&
          window.focusedRow.isConnected,
      ),
      "Realtime refresh preserves focus and DOM nodes",
    );
    await page.locator(".site-row").first().click();
    await page.locator(".detail-title").waitFor();
    assert.equal(await page.locator(".detail-stats strong").count(), 3);
    await page.locator('[data-page="week"]').click();
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-page="week"]')
          .getAttribute("aria-current") === "page",
    );
    await page.locator(".rhythm").waitFor();
    assert.equal(await page.locator(".heat").count(), 168);
    await page.locator('[data-page="month"]').click();
    await page.waitForFunction(
      () => document.querySelectorAll(".activity .bar").length === 30,
    );
    assert.equal(await page.locator(".activity .bar").count(), 30);
    await page.locator('[data-page="websites"]').click();
    await page.locator("#search").fill("github");
    assert.equal(await page.locator(".site-row").count(), 1);
    await page.locator("#sort").selectOption("name");
    await page.locator("#search").fill("not-a-site");
    assert.match(
      await page.locator("#directory").innerText(),
      /No websites match/,
    );
    await page.goto(base + "/settings/index.html?demo");
    await page.locator("#theme").selectOption("light");
    await page.waitForFunction(
      () => document.documentElement.dataset.theme === "light",
    );
    await page.screenshot({
      animations: "disabled",
      path: path.join(root, "tests/artifacts/settings-light.png"),
    });
    await page.locator("#theme").selectOption("system");
    await page.emulateMedia({ colorScheme: "light" });
    await page.waitForFunction(
      () =>
        getComputedStyle(document.body).backgroundColor ===
        "rgb(245, 246, 248)",
    );
    await page.locator("#animation").selectOption("reduced");
    await page.waitForFunction(
      () => document.documentElement.dataset.motion === "reduced",
    );
    await page.locator("#animation").selectOption("off");
    await page.waitForFunction(
      () => document.documentElement.dataset.motion === "off",
    );
    await page.locator("#clear").click();
    assert(await page.locator("dialog").isVisible());
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    assert(!(await page.locator("dialog").isVisible()));
    const downloadPromise = page.waitForEvent("download");
    await page.locator("#export").click();
    const download = await downloadPromise;
    assert.match(download.suggestedFilename(), /^webtime-backup-/);
    const backup = await fs.promises.readFile(await download.path());
    await page.locator("#file").setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: backup,
    });
    await page.locator("dialog[open]").waitFor();
    await page.locator("#confirm-action").click();
    await page.waitForFunction(
      () =>
        document.querySelector("#notice").textContent === "Backup restored.",
    );
    await page.locator("#clear").click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(100);
    assert.equal(
      await page.locator("#notice").innerText(),
      "Backup restored.",
      "Escape after a previous confirmation must cancel",
    );
    await page.locator("#file").setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"version":999}'),
    });
    await page.waitForFunction(() =>
      document.querySelector("#notice").textContent.includes("Invalid"),
    );
    assert(!(await page.locator("dialog").isVisible()));
    await page.locator("#clear").click();
    await page.locator("#confirm-action").click();
    await page.waitForFunction(
      () =>
        document.querySelector("#notice").textContent ===
        "All recorded data cleared.",
    );
    for (const [width, height] of [
      [1280, 720],
      [2560, 1440],
      [390, 844],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto(base + "/dashboard/index.html?demo");
      await page.locator(".site-row").first().waitFor();
      await page.waitForTimeout(750);
      const aligned = await page.evaluate(() => {
        const a = document
          .querySelector('[aria-current="page"]')
          .getBoundingClientRect();
        const b = document
          .querySelector(".nav-indicator")
          .getBoundingClientRect();
        return Math.abs(a.left - b.left) < 2;
      });
      assert(aligned, "Navigation indicator aligns with active page");
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Overflow at ${width}`,
      );
      await page.screenshot({
        animations: "disabled",
        path: path.join(root, `tests/artifacts/today-${width}.png`),
      });
    }
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(base + "/dashboard/index.html");
    await page.locator("#hero-number").waitFor();
    assert.equal(await page.locator(".site-row").count(), 0);
    await page.setViewportSize({ width: 380, height: 560 });
    await page.goto(base + "/popup/index.html?demo");
    await page.locator(".popup-row").first().waitFor();
    await page.locator("#theme").selectOption("light");
    await page.waitForFunction(
      () => document.documentElement.dataset.theme === "light",
    );
    await page.waitForTimeout(750);
    await page.locator("body").screenshot({
      animations: "disabled",
      path: path.join(root, "tests/artifacts/popup.png"),
    });
    assert.deepEqual(errors, []);
    console.log(
      "PASS: layouts, linked hover, detail, 7/30 days, search, sorting, themes, motion, export/import, invalid import, clear/cancel, popup; no page errors.",
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  server.close();
  process.exitCode = 1;
});
