export const MAX_GAP_MS = 45000;
export const DEFAULT_SETTINGS = {
  theme: "dark",
  animation: "full",
  idleThreshold: 60,
};
export const freshData = () => ({
  version: 1,
  settings: { ...DEFAULT_SETTINGS },
  domains: {},
});
export function normalizeDomain(url) {
  try {
    const u = new URL(url);
    return ["http:", "https:"].includes(u.protocol)
      ? u.hostname
          .toLowerCase()
          .replace(/^www\./, "")
          .replace(/\.$/, "") || null
      : null;
  } catch {
    return null;
  }
}
export function dayKey(time = Date.now()) {
  const d = new Date(time);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function dates(count, offset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - offset - count + 1 + i);
    return dayKey(d);
  });
}
export function siteName(domain) {
  const known = {
    "youtube.com": "YouTube",
    "github.com": "GitHub",
    "google.com": "Google",
    "discord.com": "Discord",
    "reddit.com": "Reddit",
    "stackoverflow.com": "Stack Overflow",
  };
  return Object.hasOwn(known, domain) ? known[domain] : domain;
}
export function addInterval(data, domain, start, end, newSession = false) {
  if (end <= start) return;
  if (!Object.hasOwn(data.domains, domain))
    Object.defineProperty(data.domains, domain, {
      value: {
        title: siteName(domain),
        totalSeconds: 0,
        daily: {},
        hourly: {},
        sessions: {},
        lastVisited: 0,
      },
      enumerable: true,
      writable: true,
      configurable: true,
    });
  const site = data.domains[domain];
  if (newSession)
    site.sessions[dayKey(start)] = (site.sessions[dayKey(start)] || 0) + 1;
  // Split at local hour boundaries, including midnight and DST changes.
  let cursor = start;
  while (cursor < end) {
    const d = new Date(cursor),
      day = dayKey(d),
      hour = d.getHours();
    const next = new Date(cursor);
    next.setMinutes(60, 0, 0);
    const stop = Math.min(end, next.getTime());
    const seconds = (stop - cursor) / 1000;
    site.totalSeconds += seconds;
    site.daily[day] = (site.daily[day] || 0) + seconds;
    site.hourly[day] ||= {};
    site.hourly[day][hour] = (site.hourly[day][hour] || 0) + seconds;
    cursor = stop;
  }
  site.lastVisited = end;
}
export class Tracker {
  constructor(data, current = null) {
    this.data = data;
    this.current = current;
    this.status = current?.domain ? "live" : "inactive";
  }
  update(domain, now = Date.now(), status = "inactive") {
    const previous = this.current,
      gap = previous ? now - previous.at : 0;
    const continuous = previous && gap >= 0 && gap <= MAX_GAP_MS;
    if (continuous && previous.domain)
      addInterval(
        this.data,
        previous.domain,
        previous.at,
        now,
        !previous.counted,
      );
    this.current = domain
      ? {
          domain,
          at: now,
          started:
            continuous && previous.domain === domain ? previous.started : now,
          counted: !!(
            continuous &&
            previous.domain === domain &&
            (previous.counted || gap > 0)
          ),
        }
      : null;
    this.status = domain ? "live" : status;
  }
}
export function summarize(data, days, domain = null) {
  const sites = Object.entries(data.domains)
    .filter(([key]) => !domain || key === domain)
    .map(([key, s]) => ({
      domain: key,
      ...s,
      seconds: days.reduce((n, d) => n + (s.daily[d] || 0), 0),
    }))
    .filter((s) => s.seconds > 0)
    .sort((a, b) => b.seconds - a.seconds);
  const total = sites.reduce((n, s) => n + s.seconds, 0);
  const sessions = sites.reduce(
    (n, s) => n + days.reduce((v, d) => v + (s.sessions[d] || 0), 0),
    0,
  );
  const daily = days.map((day) =>
    sites.reduce((n, s) => n + (s.daily[day] || 0), 0),
  );
  const hourly = Array.from({ length: 24 }, (_, h) =>
    sites.reduce(
      (n, s) => n + days.reduce((v, d) => v + (s.hourly[d]?.[h] || 0), 0),
      0,
    ),
  );
  return { sites, total, sessions, daily, hourly };
}
export function validateSettings(s) {
  if (
    !s ||
    !["dark", "light", "system"].includes(s.theme) ||
    !["full", "reduced", "off"].includes(s.animation) ||
    ![30, 60, 120, 300].includes(s.idleThreshold)
  )
    throw Error("Invalid settings.");
  return {
    theme: s.theme,
    animation: s.animation,
    idleThreshold: s.idleThreshold,
  };
}
export function validateBackup(input) {
  const fail = () => {
    throw Error(
      "Invalid or incompatible WebTime backup. Your data has not been changed.",
    );
  };
  const record = (v) => v && typeof v === "object" && !Array.isArray(v);
  const number = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;
  const date = (k) =>
    /^\d{4}-\d{2}-\d{2}$/.test(k) && dayKey(new Date(k + "T12:00:00")) === k;
  if (!record(input) || input.version !== 1 || !record(input.domains)) fail();
  const result = {
    version: 1,
    settings: validateSettings(input.settings),
    domains: {},
  };
  if (Object.keys(input.domains).length > 20000) fail();
  for (const [domain, s] of Object.entries(input.domains)) {
    if (
      domain.length > 253 ||
      normalizeDomain("https://" + domain) !== domain ||
      /[/?#@\s]/.test(domain) ||
      !record(s)
    )
      fail();
    if (
      !number(s.totalSeconds) ||
      !number(s.lastVisited) ||
      !record(s.daily) ||
      !record(s.hourly) ||
      !record(s.sessions)
    )
      fail();
    const clean = {
      title: siteName(domain),
      totalSeconds: s.totalSeconds,
      daily: {},
      hourly: {},
      sessions: {},
      lastVisited: s.lastVisited,
    };
    let sum = 0;
    for (const [day, seconds] of Object.entries(s.daily)) {
      if (
        !date(day) ||
        !number(seconds) ||
        seconds > 90000 ||
        !record(s.hourly[day])
      )
        fail();
      clean.daily[day] = seconds;
      clean.hourly[day] = {};
      sum += seconds;
      let hours = 0;
      for (const [hour, value] of Object.entries(s.hourly[day])) {
        if (
          !/^(?:[0-9]|1[0-9]|2[0-3])$/.test(hour) ||
          !number(value) ||
          value > 7200
        )
          fail();
        clean.hourly[day][hour] = value;
        hours += value;
      }
      if (Math.abs(hours - seconds) > 0.01) fail();
    }
    if (
      Object.keys(s.hourly).some((d) => !(d in clean.daily)) ||
      Math.abs(sum - s.totalSeconds) > 0.01
    )
      fail();
    for (const [day, count] of Object.entries(s.sessions)) {
      if (
        !date(day) ||
        !Number.isSafeInteger(count) ||
        count < 0 ||
        !(day in clean.daily)
      )
        fail();
      clean.sessions[day] = count;
    }
    Object.defineProperty(result.domains, domain, {
      value: clean,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
  // A single focused tab cannot account for more than a full local day.
  const totals = {};
  for (const s of Object.values(result.domains))
    for (const [d, v] of Object.entries(s.daily)) {
      totals[d] = (totals[d] || 0) + v;
      if (totals[d] > 90000) fail();
    }
  return result;
}
