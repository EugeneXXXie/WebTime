import {
  Tracker,
  normalizeDomain,
  freshData,
  validateBackup,
  validateSettings,
} from "../tracking/core.js";
import { load, save } from "../storage/storage.js";

const SAVE_INTERVAL = 20000;
let tracker,
  lastSave = 0;
let queue = Promise.resolve();
function serialize(work, report = true) {
  const next = queue.then(work);
  queue = next.catch((error) => {
    if (report) console.error("WebTime:", error);
  });
  return next;
}
async function initialize() {
  if (tracker) return;
  const [store, session] = await Promise.all([
    load(),
    chrome.storage.session.get("running"),
  ]);
  tracker = new Tracker(store.data, session.running ? store.checkpoint : null);
  chrome.idle.setDetectionInterval(tracker.data.settings.idleThreshold);
  await chrome.storage.session.set({ running: true });
  if (!(await chrome.alarms.get("checkpoint")))
    await chrome.alarms.create("checkpoint", { periodInMinutes: 0.5 });
}
async function active() {
  const idle = await chrome.idle.queryState(
    tracker.data.settings.idleThreshold,
  );
  if (idle !== "active") return { domain: null, status: "paused" };
  const windows = await chrome.windows.getAll({ windowTypes: ["normal"] });
  const focused = windows.find((w) => w.focused);
  if (!focused) return { domain: null, status: "inactive" };
  const [tab] = await chrome.tabs.query({ active: true, windowId: focused.id });
  return {
    domain: tab && !tab.incognito ? normalizeDomain(tab.url) : null,
    status: "inactive",
  };
}
async function reconcile(force = false) {
  await initialize();
  const state = await active(),
    now = Date.now();
  tracker.update(state.domain, now, state.status);
  if (force || now - lastSave >= SAVE_INTERVAL) {
    await save(tracker.data, tracker.current);
    lastSave = now;
  }
  return {
    data: tracker.data,
    live: { ...tracker.current, status: tracker.status },
    at: now,
  };
}
const changed = () => serialize(() => reconcile(true));
chrome.tabs.onActivated.addListener(changed);
chrome.tabs.onUpdated.addListener((_id, info) => {
  if (info.url || info.status === "complete") changed();
});
chrome.tabs.onRemoved.addListener(changed);
chrome.windows.onFocusChanged.addListener(changed);
chrome.windows.onRemoved.addListener(changed);
chrome.idle.onStateChanged.addListener(changed);
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkpoint") changed();
});
chrome.runtime.onInstalled.addListener(changed);
chrome.runtime.onStartup.addListener(() =>
  serialize(async () => {
    await initialize();
    tracker.current = null;
    await reconcile(true);
  }),
);
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id) return false;
  serialize(async () => {
    await initialize();
    if (message.type === "snapshot") return reconcile(false);
    if (message.type === "export") return (await reconcile(true)).data;
    if (message.type === "settings") {
      const settings = validateSettings(message.settings);
      await reconcile(true);
      tracker.data.settings = settings;
      chrome.idle.setDetectionInterval(settings.idleThreshold);
      return reconcile(true);
    }
    if (message.type === "import" || message.type === "clear") {
      const data =
        message.type === "import"
          ? validateBackup(message.data)
          : { ...freshData(), settings: tracker.data.settings };
      // Commit before replacing in-memory state, so quota/write errors preserve current data.
      await save(data, null);
      tracker = new Tracker(data);
      lastSave = Date.now();
      chrome.idle.setDetectionInterval(data.settings.idleThreshold);
      return reconcile(true);
    }
    throw Error("Unknown request.");
  }, false).then(
    (result) => respond({ ok: true, result }),
    (error) => respond({ ok: false, error: error.message }),
  );
  return true;
});
// A timer is an optimization, never the sole source of persistence or recovery.
setInterval(() => serialize(() => reconcile(true)), SAVE_INTERVAL);
changed();
