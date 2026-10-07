import test from "node:test";
import assert from "node:assert/strict";
import * as core from "../tracking/core.js";

const start = new Date(2026, 9, 7, 23, 59, 50).getTime();
const day = core.dayKey(start);

test("main domains use public suffix rules and preserve IP/single-label hosts", () => {
  assert.equal(typeof core.mainDomain, "function");
  for (const [host, expected] of [
    ["space.bilibili.com", "bilibili.com"],
    ["mail.google.com", "google.com"],
    ["a.b.example.co.uk", "example.co.uk"],
    ["news.example.com.cn", "example.com.cn"],
    ["a.city.kawasaki.jp", "city.kawasaki.jp"],
    ["a.b.ck", "a.b.ck"],
    ["a.www.ck", "www.ck"],
    ["user.github.io", "github.io"],
    ["127.0.0.1", "127.0.0.1"],
    ["[::1]", "[::1]"],
    ["localhost", "localhost"],
    ["constructor", "constructor"],
    ["__proto__", "__proto__"],
  ])
    assert.equal(core.mainDomain(host), expected, host);
});

test("PSL exception domains beginning with www survive backup validation", () => {
  const data = core.freshData(),
    tracker = new core.Tracker(data);
  tracker.update(["a.www.ck", "b.www.ck"], start);
  tracker.update([], start + 20000);
  assert.equal(data.groups["www.ck"].totalSeconds, 20);
  assert.deepEqual(core.validateBackup(JSON.parse(JSON.stringify(data))), data);
});

test("concurrent subdomains keep child time but count the main domain and browser once", () => {
  const data = core.freshData(),
    tracker = new core.Tracker(data);
  const hosts = [
    "bilibili.com",
    "space.bilibili.com",
    "google.com",
    "mail.google.com",
  ];
  tracker.update(hosts, start);
  for (let i = 1; i <= 60; i++) tracker.update(hosts, start + i * 20000);
  const days = [day, core.dayKey(start + 1200000)];
  const summary = core.summarize(data, days);
  assert.equal(summary.sites.length, 2);
  assert.equal(summary.total, 1200);
  assert.equal(summary.websiteTotal, 2400);
  assert.equal(summary.sessions, 2);
  assert.equal(data.domains["space.bilibili.com"].totalSeconds, 1200);
  assert.equal(core.summarize(data, days, "bilibili.com").total, 1200);
  assert.equal(core.summarize(data, days, "space.bilibili.com").total, 1200);
  assert.equal(data.groups["bilibili.com"].daily[day], 10);
  assert.equal(data.groups["bilibili.com"].hourly[days[1]][0], 1190);
  assert.equal(tracker.current.domains.length, 2);
  assert.deepEqual(core.validateBackup(JSON.parse(JSON.stringify(data))), data);
});

test("changing or closing a subdomain keeps the group session through worker recovery", () => {
  const data = core.freshData(),
    tracker = new core.Tracker(data);
  tracker.update(["google.com", "mail.google.com"], start);
  tracker.update(["mail.google.com"], start + 20000);
  const resumed = new core.Tracker(data, structuredClone(tracker.current));
  resumed.update(["docs.google.com"], start + 40000);
  resumed.update([], start + 60000);
  const summary = core.summarize(data, [day, core.dayKey(start + 60000)]);
  assert.equal(summary.total, 60);
  assert.equal(summary.sites[0].seconds, 60);
  assert.equal(summary.sessions, 1);
  assert.equal(data.domains["google.com"].totalSeconds, 20);
  assert.equal(data.domains["mail.google.com"].totalSeconds, 40);
  assert.equal(data.domains["docs.google.com"].totalSeconds, 20);
  resumed.update(["google.com"], start + 80000);
  resumed.update([], start + 100000);
  assert.equal(
    core.summarize(data, [day, core.dayKey(start + 100000)]).sessions,
    2,
  );
});

function legacyBackup() {
  const record = (seconds) => ({
    title: "old",
    totalSeconds: seconds,
    daily: { [day]: seconds },
    hourly: { [day]: { 23: seconds } },
    sessions: { [day]: 1 },
    lastVisited: start,
  });
  return {
    version: 2,
    settings: { ...core.DEFAULT_SETTINGS },
    domains: { "bilibili.com": record(10), "space.bilibili.com": record(10) },
    activity: {
      totalSeconds: 10,
      daily: { [day]: 10 },
      hourly: { [day]: { 23: 10 } },
    },
  };
}

test("version-two migration preserves history, labels possible old overlaps and deduplicates new time", () => {
  const legacy = legacyBackup(),
    migrated = core.validateBackup(legacy);
  assert.equal(migrated.version, 3);
  assert.deepEqual(migrated.activity, legacy.activity);
  assert.equal(migrated.groups["bilibili.com"].totalSeconds, 20);
  assert.equal(migrated.groups["bilibili.com"].legacyDaily[day], 20);
  const tracker = new core.Tracker(migrated, {
    domain: "bilibili.com",
    started: start,
    at: start,
    domains: [
      { domain: "bilibili.com", started: start, counted: true },
      { domain: "space.bilibili.com", started: start, counted: true },
    ],
  });
  tracker.update(["bilibili.com", "space.bilibili.com"], start + 20000);
  assert.equal(migrated.groups["bilibili.com"].totalSeconds, 40);
  assert.equal(migrated.activity.totalSeconds, 30);
  assert.deepEqual(
    core.validateBackup(JSON.parse(JSON.stringify(migrated))),
    migrated,
  );
});

test("group backups reject missing, forged and inconsistent group records", () => {
  const data = core.validateBackup(legacyBackup());
  for (const mutate of [
    (d) => {
      delete d.groups["bilibili.com"];
    },
    (d) => {
      d.groups["space.bilibili.com"] = d.groups["bilibili.com"];
    },
    (d) => {
      d.groups["bilibili.com"].totalSeconds = 999;
    },
    (d) => {
      d.groups["bilibili.com"].legacyDaily[day] = 21;
    },
    (d) => {
      d.groups["bilibili.com"].hourly[day][23] = 9;
      d.groups["bilibili.com"].daily[day] = 9;
      d.groups["bilibili.com"].totalSeconds = 9;
      d.groups["bilibili.com"].legacyDaily = {};
    },
  ]) {
    const bad = structuredClone(data);
    mutate(bad);
    assert.throws(() => core.validateBackup(bad));
  }
});

test("backward clock changes preserve exportable group and child last-visit metadata", () => {
  const data = core.freshData(),
    tracker = new core.Tracker(data);
  tracker.update(["google.com", "mail.google.com"], 100000);
  tracker.update(["google.com", "mail.google.com"], 120000);
  tracker.update(["google.com"], 90000);
  tracker.update([], 110000);
  assert.equal(data.groups["google.com"].totalSeconds, 40);
  assert.deepEqual(core.validateBackup(JSON.parse(JSON.stringify(data))), data);
});

test("version-one exclusive subdomain history merges exactly without an overlap label", () => {
  const legacy = legacyBackup();
  legacy.version = 1;
  delete legacy.activity;
  const data = core.validateBackup(legacy);
  assert.equal(data.activity.totalSeconds, 20);
  assert.equal(data.groups["bilibili.com"].totalSeconds, 20);
  assert.equal(data.groups["bilibili.com"].legacyDaily, undefined);
  assert.deepEqual(core.validateBackup(JSON.parse(JSON.stringify(data))), data);
});
