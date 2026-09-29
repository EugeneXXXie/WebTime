import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeDomain,
  freshData,
  addInterval,
  Tracker,
  validateBackup,
  summarize,
  dayKey,
} from "../tracking/core.js";

test("only normal web hosts, www merged without collapsing country domains", () => {
  assert.equal(
    normalizeDomain("https://WWW.GitHub.com/a?q=secret"),
    "github.com",
  );
  assert.equal(normalizeDomain("https://google.co.jp/a"), "google.co.jp");
  for (const url of [
    "chrome://settings",
    "edge://settings",
    "about:blank",
    "file:///a",
    "chrome-extension://id/a",
    "bad",
  ])
    assert.equal(normalizeDomain(url), null);
});
test("five minutes, same-domain navigation, tab change, idle and focus loss", () => {
  const data = freshData(),
    tracker = new Tracker(data);
  const t = new Date(2026, 8, 30, 12).getTime();
  tracker.update("youtube.com", t);
  for (let i = 1; i <= 15; i++) tracker.update("youtube.com", t + i * 20000);
  tracker.update("github.com", t + 300000);
  tracker.update(null, t + 320000, "inactive");
  tracker.update(null, t + 380000, "paused");
  assert.equal(data.domains["youtube.com"].totalSeconds, 300);
  assert.equal(data.domains["github.com"].totalSeconds, 20);
  assert.equal(summarize(data, [dayKey(t)]).sessions, 2);
});
test("midnight and hourly buckets preserve elapsed seconds", () => {
  const data = freshData(),
    start = new Date(2026, 8, 30, 23, 59, 50).getTime();
  addInterval(data, "github.com", start, start + 30000, true);
  assert.equal(data.domains["github.com"].daily["2026-09-30"], 10);
  assert.equal(data.domains["github.com"].hourly["2026-10-01"][0], 20);
});
test("sleep gap and backwards clock never inflate duration", () => {
  const data = freshData(),
    tracker = new Tracker(data);
  tracker.update("github.com", 100000);
  tracker.update("github.com", 120000);
  tracker.update("github.com", 999999);
  tracker.update("github.com", 900000);
  assert.equal(data.domains["github.com"].totalSeconds, 20);
});
test("checkpoint resumes once; fresh browser does not backfill", () => {
  const data = freshData();
  const one = new Tracker(data);
  one.update("github.com", 100000);
  one.update("github.com", 120000);
  const two = new Tracker(data, one.current);
  two.update("github.com", 140000);
  assert.equal(data.domains["github.com"].totalSeconds, 40);
  const three = new Tracker(data);
  three.update("github.com", 160000);
  assert.equal(data.domains["github.com"].totalSeconds, 40);
});
test("import round-trip and invalid data rejected", () => {
  const data = freshData();
  addInterval(data, "github.com", Date.now() - 10000, Date.now(), true);
  assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(data))), data);
  for (const bad of [
    {},
    { ...data, version: 2 },
    { ...data, settings: { theme: "evil" } },
    { ...data, domains: { "https://bad/a": {} } },
  ])
    assert.throws(() => validateBackup(bad));
  const bad = structuredClone(data);
  bad.domains["github.com"].totalSeconds = -1;
  assert.throws(() => validateBackup(bad));
});
test("single-label hostnames cannot collide with object prototypes", () => {
  const data = freshData();
  for (const host of ["constructor", "__proto__", "prototype"])
    addInterval(data, host, 100000, 110000, true);
  assert.equal(data.domains.constructor.totalSeconds, 10);
  assert.equal(data.domains.__proto__.totalSeconds, 10);
  assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(data))), data);
});
