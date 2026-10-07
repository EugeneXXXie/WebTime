import test from "node:test";
import assert from "node:assert/strict";
import {
  freshData,
  Tracker,
  summarize,
  dayKey,
  validateBackup,
} from "../tracking/core.js";

test("twenty minutes of concurrent domains counts both, with one wall-clock total", () => {
  const data = freshData(),
    tracker = new Tracker(data),
    start = new Date(2026, 8, 30, 12).getTime();
  tracker.update(["youtube.com", "github.com", "youtube.com"], start);
  for (let i = 1; i <= 60; i++)
    tracker.update(["youtube.com", "github.com"], start + i * 20000);
  const summary = summarize(data, [dayKey(start)]);
  assert.equal(data.domains["youtube.com"]?.totalSeconds, 1200);
  assert.equal(data.domains["github.com"]?.totalSeconds, 1200);
  assert.equal(summary.total, 1200);
  assert.equal(summary.websiteTotal, 2400);
  assert.equal(summary.hourly[12], 1200);
  assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(data))), data);
});

test("overlap accounting survives midnight, session recovery and one domain stopping", () => {
  const data = freshData(),
    start = new Date(2026, 8, 30, 23, 59, 50).getTime();
  const tracker = new Tracker(data);
  tracker.update(["youtube.com", "github.com"], start);
  tracker.update(["youtube.com"], start + 20000);
  const recovered = new Tracker(data, tracker.current);
  recovered.update([], start + 40000);
  assert.equal(summarize(data, ["2026-09-30"]).total, 10);
  assert.equal(summarize(data, ["2026-10-01"]).total, 30);
  assert.equal(data.domains["github.com"].totalSeconds, 20);
  assert.equal(data.domains["youtube.com"].totalSeconds, 40);
});

test("legacy version-one backups migrate without changing historical time", () => {
  const legacy = {
    version: 1,
    settings: { theme: "dark", animation: "full", idleThreshold: 60 },
    domains: {
      "github.com": {
        title: "GitHub",
        totalSeconds: 30,
        daily: { "2026-09-30": 30 },
        hourly: { "2026-09-30": { 12: 30 } },
        sessions: { "2026-09-30": 1 },
        lastVisited: 1,
      },
    },
  };
  const migrated = validateBackup(legacy);
  assert.equal(migrated.version, 3);
  assert.equal(summarize(migrated, ["2026-09-30"]).total, 30);
  assert.equal(migrated.domains["github.com"].totalSeconds, 30);
});
