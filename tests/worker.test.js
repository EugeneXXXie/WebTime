import test from "node:test";
import assert from "node:assert/strict";

test("browser event integration, multi-window, idle, restart, atomic save and import", async () => {
  const realNow = Date.now,
    realInterval = globalThis.setInterval;
  let now = new Date(2026, 8, 30, 12).getTime(),
    idle = "active",
    focused = 1,
    url = "https://www.youtube.com/watch?v=private",
    writes = 0,
    failWrite = false,
    threshold = 60;
  const local = {},
    session = {};
  const event = () => ({
    listeners: [],
    addListener(fn) {
      this.listeners.push(fn);
    },
    async emit(...args) {
      await Promise.all(this.listeners.map((fn) => fn(...args)));
      await new Promise((r) => setImmediate(r));
    },
  });
  const area = (data) => ({
    async get(key) {
      return { [key]: structuredClone(data[key]) };
    },
    async set(value) {
      if (data === local) {
        if (failWrite) throw Error("Quota exceeded");
        writes++;
      }
      Object.assign(data, structuredClone(value));
    },
  });
  const createChrome = () => ({
    runtime: {
      id: "test",
      onMessage: event(),
      onInstalled: event(),
      onStartup: event(),
    },
    storage: { local: area(local), session: area(session) },
    idle: {
      async queryState() {
        return idle;
      },
      setDetectionInterval(value) {
        threshold = value;
      },
      onStateChanged: event(),
    },
    windows: {
      async getAll() {
        return [
          { id: 1, focused: focused === 1 },
          { id: 2, focused: focused === 2 },
        ];
      },
      onFocusChanged: event(),
      onRemoved: event(),
    },
    tabs: {
      async query({ windowId }) {
        return [
          {
            id: windowId,
            active: true,
            url: windowId === 2 ? "https://github.com/second" : url,
          },
        ];
      },
      onActivated: event(),
      onUpdated: event(),
      onRemoved: event(),
    },
    alarms: {
      async get() {
        return { name: "checkpoint" };
      },
      async create() {},
      onAlarm: event(),
    },
  });
  const settle = () => new Promise((r) => setImmediate(r));
  let chrome = createChrome();
  globalThis.chrome = chrome;
  Date.now = () => now;
  globalThis.setInterval = () => 0;
  const send = (message) =>
    new Promise((resolve) =>
      chrome.runtime.onMessage.listeners[0](message, { id: "test" }, resolve),
    );
  const seconds = (result, domain) =>
    result.result.data.domains[domain]?.totalSeconds || 0;
  try {
    await import("../background/service-worker.js?first");
    await settle();
    for (let i = 0; i < 15; i++) {
      now += 20000;
      await chrome.alarms.onAlarm.emit({ name: "checkpoint" });
    }
    let snap = await send({ type: "snapshot" });
    assert.equal(seconds(snap, "youtube.com"), 300);
    url = "https://github.com/a?token=secret";
    await chrome.tabs.onActivated.emit();
    now += 20000;
    url = "https://www.github.com/b";
    await chrome.tabs.onUpdated.emit(1, { url });
    await settle();
    now += 20000;
    focused = -1;
    await chrome.windows.onFocusChanged.emit(-1);
    now += 60000;
    snap = await send({ type: "snapshot" });
    assert.equal(seconds(snap, "github.com"), 40);
    assert.equal(snap.result.live.status, "inactive");
    focused = 2;
    await chrome.windows.onFocusChanged.emit(2);
    now += 20000;
    idle = "idle";
    await chrome.idle.onStateChanged.emit("idle");
    now += 60000;
    snap = await send({ type: "snapshot" });
    assert.equal(seconds(snap, "github.com"), 60);
    assert.equal(snap.result.live.status, "paused");
    idle = "active";
    await chrome.idle.onStateChanged.emit("active");
    now += 20000;
    await chrome.alarms.onAlarm.emit({ name: "checkpoint" });
    const beforeRestart = seconds(
      await send({ type: "snapshot" }),
      "github.com",
    );
    chrome = createChrome();
    globalThis.chrome = chrome;
    await import("../background/service-worker.js?restart");
    await settle();
    now += 20000;
    snap = await send({ type: "snapshot" });
    assert.equal(seconds(snap, "github.com"), beforeRestart + 20);
    await chrome.alarms.onAlarm.emit({ name: "checkpoint" });
    session.running = false;
    now += 3600000;
    chrome = createChrome();
    globalThis.chrome = chrome;
    await import("../background/service-worker.js?browserrestart");
    await settle();
    snap = await send({ type: "snapshot" });
    assert.equal(seconds(snap, "github.com"), beforeRestart + 20);
    focused = 1;
    url = "chrome://settings";
    await chrome.windows.onFocusChanged.emit(1);
    now += 30000;
    snap = await send({ type: "snapshot" });
    assert.equal(snap.result.live.status, "inactive");
    assert(!JSON.stringify(local).includes("token=secret"));
    assert(!JSON.stringify(local).includes("/watch"));
    const original = structuredClone(local.store.data);
    const invalid = await send({ type: "import", data: { version: 5 } });
    assert.equal(invalid.ok, false);
    assert.deepEqual(local.store.data, original);
    failWrite = true;
    const fail = await send({ type: "clear" });
    assert.equal(fail.ok, false);
    assert.deepEqual(local.store.data, original);
    failWrite = false;
    const startWrites = writes;
    for (let i = 0; i < 10; i++) {
      now += 1000;
      await send({ type: "snapshot" });
    }
    assert(writes - startWrites <= 1, "No per-second storage writes");
    const backup = structuredClone(local.store.data);
    backup.settings.idleThreshold = 30;
    assert((await send({ type: "import", data: backup })).ok);
    assert.equal(threshold, 30);
    await send({ type: "clear" });
    assert.deepEqual(local.store.data.domains, {});
  } finally {
    Date.now = realNow;
    globalThis.setInterval = realInterval;
    delete globalThis.chrome;
  }
});
