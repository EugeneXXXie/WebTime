import test from "node:test";
import assert from "node:assert/strict";

test("open-tab tracking: twenty idle minutes, concurrent domains, deduplication, close, lock and recovery", async () => {
  const realNow = Date.now,
    realInterval = globalThis.setInterval;
  let now = new Date(2026, 8, 30, 12).getTime(),
    idle = "idle",
    writes = 0,
    failWrite = false;
  let tabs = [
    {
      id: 1,
      windowId: 1,
      url: "https://youtube.com/watch?a=private",
      active: false,
    },
    { id: 2, windowId: 2, url: "https://github.com/project", active: true },
    { id: 3, windowId: 1, url: "https://www.youtube.com/other", active: false },
  ];
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
      onStateChanged: event(),
    },
    windows: {
      async getAll() {
        return [
          { id: 1, focused: false },
          { id: 2, focused: false },
        ];
      },
      onFocusChanged: event(),
      onRemoved: event(),
    },
    tabs: {
      async query() {
        return structuredClone(tabs);
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
  let chrome = createChrome();
  globalThis.chrome = chrome;
  Date.now = () => now;
  globalThis.setInterval = () => 0;
  const send = (message) =>
    new Promise((resolve) =>
      chrome.runtime.onMessage.listeners[0](message, { id: "test" }, resolve),
    );
  const snap = async () => {
    const response = await send({ type: "snapshot" });
    assert(response.ok, response.error);
    return response.result;
  };
  const settle = () => new Promise((r) => setImmediate(r));
  try {
    await import("../background/service-worker.js?open-tabs");
    await settle();
    for (let i = 0; i < 60; i++) {
      now += 20000;
      await chrome.alarms.onAlarm.emit({ name: "checkpoint" });
    }
    let result = await snap();
    assert.equal(result.data.domains["youtube.com"].totalSeconds, 1200);
    assert.equal(result.data.domains["github.com"].totalSeconds, 1200);
    assert.equal(result.data.activity.totalSeconds, 1200);
    assert.equal(result.live.status, "live");
    assert.equal(result.live.domains.length, 2);
    tabs = tabs.filter((tab) => tab.id !== 1);
    await chrome.tabs.onRemoved.emit(1);
    now += 20000;
    result = await snap();
    assert.equal(result.data.domains["youtube.com"].totalSeconds, 1220);
    tabs = tabs.filter((tab) => tab.id !== 3);
    await chrome.tabs.onRemoved.emit(3);
    now += 20000;
    result = await snap();
    assert.equal(result.data.domains["youtube.com"].totalSeconds, 1220);
    assert.equal(result.data.domains["github.com"].totalSeconds, 1240);
    idle = "locked";
    await chrome.idle.onStateChanged.emit("locked");
    now += 60000;
    result = await snap();
    assert.equal(result.live.status, "paused");
    assert.equal(result.data.activity.totalSeconds, 1240);
    idle = "idle";
    await chrome.idle.onStateChanged.emit("idle");
    now += 20000;
    await chrome.alarms.onAlarm.emit({ name: "checkpoint" });
    chrome = createChrome();
    globalThis.chrome = chrome;
    await import("../background/service-worker.js?recover");
    await settle();
    now += 20000;
    result = await snap();
    assert.equal(result.data.activity.totalSeconds, 1280);
    await chrome.alarms.onAlarm.emit({ name: "checkpoint" });
    session.running = false;
    now += 3600000;
    chrome = createChrome();
    globalThis.chrome = chrome;
    await import("../background/service-worker.js?browser-restart");
    await settle();
    result = await snap();
    assert.equal(result.data.activity.totalSeconds, 1280);
    tabs = [
      { id: 4, windowId: 1, url: "chrome://settings" },
      { id: 5, windowId: 1, url: "https://private.test", incognito: true },
      { id: 6, windowId: 1, url: "https://discarded.test", discarded: true },
      { id: 7, windowId: 1, url: "https://frozen.test", frozen: true },
    ];
    await chrome.tabs.onUpdated.emit(2, { status: "complete" });
    now += 20000;
    result = await snap();
    assert.equal(result.live.status, "inactive");
    assert.equal(result.data.activity.totalSeconds, 1280);
    assert(!JSON.stringify(local).includes("private"));
    assert(!JSON.stringify(local).includes("/watch"));
    const original = structuredClone(local.store.data);
    assert.equal(
      (await send({ type: "import", data: { version: 99 } })).ok,
      false,
    );
    assert.deepEqual(local.store.data, original);
    failWrite = true;
    assert.equal((await send({ type: "clear" })).ok, false);
    assert.deepEqual(local.store.data, original);
    failWrite = false;
    const before = writes;
    for (let i = 0; i < 10; i++) {
      now += 1000;
      await snap();
    }
    assert(writes - before <= 1);
    await send({ type: "clear" });
    assert.deepEqual(local.store.data.domains, {});
    assert.equal(local.store.data.activity.totalSeconds, 0);
  } finally {
    Date.now = realNow;
    globalThis.setInterval = realInterval;
    delete globalThis.chrome;
  }
});
