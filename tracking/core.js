export const MAX_GAP_MS = 45000;
export const DEFAULT_SETTINGS = {
  theme: "dark",
  animation: "full",
  language: "system",
  blockLocalIPs: false,
};
export const freshData = () => ({
  version: 2,
  settings: { ...DEFAULT_SETTINGS },
  domains: {},
  activity: { totalSeconds: 0, daily: {}, hourly: {} },
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
// Receives the URL parser's normalized hostname; never resolves DNS names.
export function isLocalDomain(domain) {
  if (domain === "localhost") return true;
  if (!domain) return false;
  const host = domain.replace(/^\[|\]$/g, "");
  if (host === "::1") return true;
  if (host.includes(":")) {
    const first = parseInt(host.split(":")[0], 16);
    if ((first & 0xfe00) === 0xfc00 || (first & 0xffc0) === 0xfe80) return true;
    // URL canonicalizes IPv4-mapped IPv6 to two hexadecimal groups.
    const mapped = host.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
    if (!mapped) return false;
    const high = parseInt(mapped[1], 16),
      low = parseInt(mapped[2], 16);
    return isLocalDomain(
      `${high >>> 8}.${high & 255}.${low >>> 8}.${low & 255}`,
    );
  }
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;
  const octets = host.split(".").map(Number);
  if (octets.some((n) => n > 255)) return false;
  const [a, b] = octets;
  return (
    a === 127 ||
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
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
export function addInterval(
  data,
  domain,
  start,
  end,
  newSession = false,
  countTotal = true,
) {
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
  addBuckets(site, start, end);
  site.lastVisited = end;
  if (countTotal) addBuckets(data.activity, start, end);
}
function addBuckets(bucket, start, end) {
  let cursor = start;
  while (cursor < end) {
    const d = new Date(cursor),
      day = dayKey(d),
      hour = d.getHours();
    const next = new Date(cursor);
    next.setMinutes(60, 0, 0);
    const stop = Math.min(end, next.getTime()),
      seconds = (stop - cursor) / 1000;
    bucket.totalSeconds += seconds;
    bucket.daily[day] = (bucket.daily[day] || 0) + seconds;
    bucket.hourly[day] ||= {};
    bucket.hourly[day][hour] = (bucket.hourly[day][hour] || 0) + seconds;
    cursor = stop;
  }
}
export class Tracker {
  constructor(data, current = null) {
    this.data = data;
    // Accept a version-one in-flight checkpoint after a code reload.
    this.current =
      current?.domain && !current.domains
        ? {
            ...current,
            domains: [
              {
                domain: current.domain,
                started: current.started,
                counted: current.counted,
              },
            ],
          }
        : current;
    this.status = this.current?.domains?.length ? "live" : "inactive";
  }
  update(input, now = Date.now(), status = "inactive") {
    const domains = [
      ...new Set((Array.isArray(input) ? input : [input]).filter(Boolean)),
    ];
    const previous = this.current,
      gap = previous ? now - previous.at : 0;
    const continuous = previous && gap >= 0 && gap <= MAX_GAP_MS;
    if (continuous && previous.domains.length && gap > 0) {
      for (const item of previous.domains)
        addInterval(
          this.data,
          item.domain,
          previous.at,
          now,
          !item.counted,
          false,
        );
      // Union of concurrent domains: one elapsed interval, never N times.
      addBuckets(this.data.activity, previous.at, now);
    }
    const items = domains.map((domain) => {
      const old =
        continuous && previous.domains.find((item) => item.domain === domain);
      return {
        domain,
        started: old ? old.started : now,
        counted: !!(old && (old.counted || gap > 0)),
      };
    });
    this.current = items.length
      ? {
          domains: items,
          domain: items[0].domain,
          started: items[0].started,
          at: now,
        }
      : null;
    this.status = items.length ? "live" : status;
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
  const websiteTotal = sites.reduce((n, s) => n + s.seconds, 0);
  const total = domain
    ? websiteTotal
    : days.reduce((n, d) => n + (data.activity.daily[d] || 0), 0);
  const sessions = sites.reduce(
    (n, s) => n + days.reduce((v, d) => v + (s.sessions[d] || 0), 0),
    0,
  );
  const daily = days.map((day) =>
    domain
      ? sites.reduce((n, s) => n + (s.daily[day] || 0), 0)
      : data.activity.daily[day] || 0,
  );
  const hourly = Array.from({ length: 24 }, (_, h) =>
    domain
      ? sites.reduce(
          (n, s) => n + days.reduce((v, d) => v + (s.hourly[d]?.[h] || 0), 0),
          0,
        )
      : days.reduce((n, d) => n + (data.activity.hourly[d]?.[h] || 0), 0),
  );
  return { sites, total, websiteTotal, sessions, daily, hourly };
}
export function validateSettings(s) {
  if (
    !s ||
    !["dark", "light", "system"].includes(s.theme) ||
    !["full", "reduced", "off"].includes(s.animation) ||
    (s.blockLocalIPs !== undefined && typeof s.blockLocalIPs !== "boolean") ||
    (s.language !== undefined &&
      !["system", "en", "zh", "ja", "ko", "de", "it", "ru", "es"].includes(
        s.language,
      ))
  )
    throw Error("Invalid settings.");
  return {
    theme: s.theme,
    animation: s.animation,
    language: s.language ?? "system",
    blockLocalIPs: s.blockLocalIPs ?? false,
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
  if (
    !record(input) ||
    ![1, 2].includes(input.version) ||
    !record(input.domains)
  )
    fail();
  const result = {
    version: 2,
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
  const summed = { totalSeconds: 0, daily: {}, hourly: {} };
  for (const site of Object.values(result.domains)) {
    summed.totalSeconds += site.totalSeconds;
    for (const [day, value] of Object.entries(site.daily)) {
      summed.daily[day] = (summed.daily[day] || 0) + value;
      summed.hourly[day] ||= {};
      for (const [hour, seconds] of Object.entries(site.hourly[day]))
        summed.hourly[day][hour] = (summed.hourly[day][hour] || 0) + seconds;
    }
  }
  if (input.version === 1) {
    if (Object.values(summed.daily).some((v) => v > 90000)) fail();
    result.activity = summed;
  } else {
    const activity = input.activity;
    if (
      !record(activity) ||
      !number(activity.totalSeconds) ||
      !record(activity.daily) ||
      !record(activity.hourly)
    )
      fail();
    const clean = {
      totalSeconds: activity.totalSeconds,
      daily: {},
      hourly: {},
    };
    let total = 0;
    const days = new Set([
      ...Object.keys(summed.daily),
      ...Object.keys(activity.daily),
      ...Object.keys(activity.hourly),
    ]);
    for (const day of days) {
      const value = activity.daily[day];
      if (
        !date(day) ||
        !number(value) ||
        value > 90000 ||
        !record(activity.hourly[day])
      )
        fail();
      clean.daily[day] = value;
      clean.hourly[day] = {};
      let daily = 0;
      const hours = new Set([
        ...Object.keys(summed.hourly[day] || {}),
        ...Object.keys(activity.hourly[day]),
      ]);
      for (const hour of hours) {
        const seconds = activity.hourly[day][hour];
        const upper = summed.hourly[day]?.[hour] || 0;
        const lower = Math.max(
          0,
          ...Object.values(result.domains).map(
            (site) => site.hourly[day]?.[hour] || 0,
          ),
        );
        if (
          !/^(?:[0-9]|1[0-9]|2[0-3])$/.test(hour) ||
          !number(seconds) ||
          seconds > 7200 ||
          seconds > upper + 0.01 ||
          seconds + 0.01 < lower
        )
          fail();
        clean.hourly[day][hour] = seconds;
        daily += seconds;
      }
      if (Math.abs(daily - value) > 0.01) fail();
      total += value;
    }
    if (Math.abs(total - activity.totalSeconds) > 0.01) fail();
    result.activity = clean;
  }
  return result;
}
