import { dates, dayKey, summarize, siteName } from "../tracking/core.js";
import {
  $,
  escape,
  duration,
  fullDate,
  request,
  applyAppearance,
  icon,
  liveMarkup,
  countUp,
  installTooltip,
  errorMessage,
  isDemo,
  isExtension,
  updateDOM,
  localize,
  onSettingsChanged,
} from "../shared/ui.js";
import { bars, ring, rhythm } from "./charts.js";
const state = {
  snapshot: null,
  page: "today",
  domain: null,
  search: "",
  sort: "time",
};
const app = $("#app");
function rows(sites, total, limit = sites.length) {
  return (
    sites
      .slice(0, limit)
      .map(
        (s, i) =>
          `<button class="site-row" data-domain="${escape(s.domain)}" data-detail="${escape(s.domain)}" data-tip="${escape(s.title)} · ${duration(s.seconds, true)} · ${Math.round((s.seconds / (total || 1)) * 100)}%"><span class="rank">${String(i + 1).padStart(2, "0")}</span>${icon(s.domain)}<span class="site-info"><strong>${escape(s.title)}</strong><small>${escape(s.domain)}</small></span><span class="site-time">${duration(s.seconds)}</span><span class="site-percent">${Math.round((s.seconds / (total || 1)) * 100)}%</span><span class="row-arrow">↗</span><span class="progress"><i style="width:${(s.seconds / (total || 1)) * 100}%"></i></span></button>`,
      )
      .join("") ||
    '<div class="empty">A little perspective starts with a little browsing.<br>Visit a website to start your first session.</div>'
  );
}
function heading(label, subtitle) {
  return `<div class="page-heading enter"><div><h2>${label}</h2><p class="date" style="margin-top:8px">${subtitle}</p></div><div class="live" id="live">${liveMarkup(state.snapshot.live)}</div></div>`;
}
function hero(summary, count) {
  const previous = summarize(state.snapshot.data, dates(count, count)).total;
  const difference = previous
    ? ((summary.total - previous) / previous) * 100
    : null;
  const comparison =
    difference === null
      ? "No previous data yet"
      : `${difference >= 0 ? "↑" : "↓"} ${Math.abs(difference).toFixed(0)}% from ${count === 1 ? "yesterday" : "previous period"}`;
  return `<section class="hero enter" style="--order:1"><div><h1 class="hero-number" id="hero-number">${duration(summary.total)}</h1><div class="hero-caption"><span title="Concurrent websites count once">Total browser time · overlaps counted once</span><span class="comparison">${comparison}</span></div></div><div class="stats"><div class="stat"><strong>${summary.sites.length}</strong><span>Active websites</span></div><div class="stat"><strong>${count === 1 ? summary.sessions : duration(summary.total / count)}</strong><span>${count === 1 ? "Sessions" : "Daily average"}</span></div><div class="stat"><strong>${duration(summary.sessions ? summary.websiteTotal / summary.sessions : 0, true)}</strong><span>Avg. website session</span></div></div></section>`;
}
function overview(count) {
  const days = dates(count),
    summary = summarize(state.snapshot.data, days),
    week = dates(7),
    weekly = summarize(state.snapshot.data, week);
  const peak = summary.hourly.indexOf(Math.max(...summary.hourly));
  return `${heading(count === 1 ? "TODAY" : `LAST ${count} DAYS`, count === 1 ? fullDate(dayKey()) : `${fullDate(days[0])} — ${fullDate(days.at(-1))}`)}${hero(summary, count)}<section class="activity enter" style="--order:2"><div class="section-head"><h2>${count === 1 ? "ACTIVITY TODAY" : "DAILY ACTIVITY"}</h2><span class="activity-note">${summary.total ? (count === 1 ? `Peak activity · ${String(peak).padStart(2, "0")}:00 — ${String(peak + 1).padStart(2, "0")}:00` : `${count} days · ${duration(summary.total / count)} daily average`) : "Your activity will appear as you browse"}</span></div>${bars(count === 1 ? summary.hourly : summary.daily, count === 1 ? Array.from({ length: 24 }, (_, h) => h) : days, { hourly: count === 1 })}</section>${count === 1 ? `<div class="middle"><section class="websites-section enter" style="--order:3"><div class="section-head"><h2>TOP WEBSITES</h2><a class="text-link" href="#websites">View all websites ↗</a></div>${rows(summary.sites, summary.websiteTotal, 5)}</section><section class="breakdown enter" style="--order:4"><div class="section-head"><h2>USAGE BREAKDOWN</h2><span class="muted" style="font-size:11px">Share of website time</span></div>${ring(summary.sites, summary.websiteTotal)}</section></div><section class="week-strip enter" style="--order:5"><div class="section-head"><h2>LAST 7 DAYS</h2><a class="text-link" href="#week">${duration(weekly.total / 7)} daily average ↗</a></div>${bars(weekly.daily, week, { compact: true })}</section>` : `<div class="period-bottom"><section class="websites-section"><div class="section-head"><h2>TOP WEBSITES</h2><a href="#websites" class="text-link">View all ↗</a></div>${rows(summary.sites, summary.websiteTotal, 8)}</section><section class="rhythm-section"><div class="section-head"><h2>BROWSER RHYTHM</h2><span class="muted">Last 7 days</span></div>${rhythm(state.snapshot.data, week)}</section></div>`}`;
}
function directoryRows() {
  const all = Object.entries(state.snapshot.data.domains).map(
    ([domain, s]) => ({ domain, ...s, seconds: s.totalSeconds }),
  );
  const total = all.reduce((n, s) => n + s.seconds, 0);
  let filtered = all.filter((s) =>
    (s.domain + " " + s.title)
      .toLowerCase()
      .includes(state.search.toLowerCase()),
  );
  filtered.sort(
    state.sort === "name"
      ? (a, b) => a.title.localeCompare(b.title)
      : state.sort === "recent"
        ? (a, b) => b.lastVisited - a.lastVisited
        : (a, b) => b.seconds - a.seconds,
  );
  return filtered.length
    ? rows(filtered, total)
    : `<p class="empty">${state.search ? "No websites match your search." : "No websites yet. Your first browsing session will appear here."}</p>`;
}
function directory() {
  return `${heading("YOUR BROWSING, IN FOCUS", "All-time usage · Stored on this device")}<h1 class="page-title">Websites<span class="muted" style="font-size:20px;margin-left:14px">${Object.keys(state.snapshot.data.domains).length}</span></h1><div class="tools"><input id="search" type="search" placeholder="Search websites…" aria-label="Search websites" value="${escape(state.search)}"><select id="sort" aria-label="Sort websites"><option value="time">Most time</option><option value="recent">Last visited</option><option value="name">Alphabetically</option></select></div><div id="directory" class="directory">${directoryRows()}</div>`;
}
function detail() {
  const domain = state.domain,
    site = state.snapshot.data.domains[domain];
  if (!site)
    return '<p class="empty">This website has no recorded data. <a href="#websites">Back to websites</a></p>';
  const month = dates(30),
    summary = summarize(state.snapshot.data, month, domain);
  return `<a class="text-link" href="#websites">← Websites</a><div class="detail-title">${icon(domain)}<div><h1>${escape(site.title)}</h1><p class="muted" style="margin-top:6px">${escape(domain)}</p></div></div><div class="detail-stats">${[1, 7, 30].map((count) => `<div><strong>${duration(summarize(state.snapshot.data, dates(count), domain).total)}</strong><span>${count === 1 ? "Today" : `Last ${count} days`}</span></div>`).join("")}</div><section class="activity"><div class="section-head"><h2>ACTIVITY · LAST 30 DAYS</h2><span class="muted">${duration(summary.total / 30)} daily average</span></div>${bars(summary.daily, month)}</section><section class="rhythm-section"><div class="section-head"><h2>BROWSER RHYTHM</h2><span class="muted">Last 7 days</span></div>${rhythm({ domains: { [domain]: site } }, dates(7))}</section>`;
}
function navigation() {
  const page = state.page === "detail" ? "websites" : state.page;
  document.querySelectorAll("[data-page]").forEach((a) => {
    if (a.dataset.page === page) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  const link = $('[aria-current="page"]'),
    indicator = $(".nav-indicator");
  if (link) {
    indicator.style.width = link.offsetWidth + "px";
    indicator.style.transform = `translateX(${link.offsetLeft}px)`;
  }
}
function render(animate = true) {
  if (!state.snapshot) return;
  applyAppearance(state.snapshot.data.settings);
  const html = `<div class="page-content">${state.page === "websites" ? directory() : state.page === "detail" ? detail() : overview(state.page === "week" ? 7 : state.page === "month" ? 30 : 1)}</div>`;
  if (animate) app.innerHTML = html;
  else {
    const template = document.createElement("template");
    template.innerHTML = html;
    updateDOM(app.firstElementChild, template.content.firstElementChild);
  }
  if ($("#sort")) $("#sort").value = state.sort;
  localize();
  navigation();
  if (animate && $("#hero-number"))
    countUp(
      $("#hero-number"),
      summarize(
        state.snapshot.data,
        dates(state.page === "week" ? 7 : state.page === "month" ? 30 : 1),
      ).total,
    );
}
function route() {
  const [page, domain] = location.hash.slice(1).split("/");
  state.page = ["today", "week", "month", "websites", "detail"].includes(page)
    ? page
    : "today";
  try {
    state.domain = decodeURIComponent(domain || "");
  } catch {
    state.domain = "";
  }
  render();
}
app.addEventListener("click", (e) => {
  const row = e.target.closest("[data-detail]");
  if (row) location.hash = "detail/" + encodeURIComponent(row.dataset.detail);
});
app.addEventListener("input", (e) => {
  if (e.target.id === "search") {
    state.search = e.target.value;
    $("#directory").innerHTML = directoryRows();
    localize();
  }
});
app.addEventListener("change", (e) => {
  if (e.target.id === "sort") {
    state.sort = e.target.value;
    $("#directory").innerHTML = directoryRows();
    localize();
  }
});
function highlight(e) {
  const row = e.target.closest?.("[data-domain]");
  if (!row) return;
  const primary = [...document.querySelectorAll(".segment")]
    .map((el) => el.dataset.domain)
    .filter((d) => d !== "other");
  document.querySelectorAll("[data-domain]").forEach((el) => {
    const a = row.dataset.domain,
      b = el.dataset.domain;
    const match =
      a === b ||
      (b === "other" && !primary.includes(a)) ||
      (a === "other" && !primary.includes(b));
    el.classList.toggle("linked", match);
    el.classList.toggle("dim", !match && el.classList.contains("segment"));
  });
}
function clearHighlight() {
  document
    .querySelectorAll(".linked,.dim")
    .forEach((el) => el.classList.remove("linked", "dim"));
}
app.addEventListener("pointerover", highlight);
app.addEventListener("focusin", highlight);
app.addEventListener("pointerout", clearHighlight);
app.addEventListener("focusout", clearHighlight);
addEventListener("hashchange", route);
addEventListener("resize", navigation);
installTooltip();
if (isDemo || !isExtension) {
  const banner = document.createElement("div");
  banner.className = "demo-banner";
  banner.textContent = isDemo
    ? "DEMO PREVIEW · Synthetic data · Nothing is recorded"
    : "BROWSER PREVIEW · Load the unpacked extension to start tracking";
  document.body.prepend(banner);
  if (isDemo) $(".settings-link").href += "?demo";
}
let refreshing = false;
async function refresh(initial = false) {
  if (refreshing) return;
  refreshing = true;
  try {
    state.snapshot = await request("snapshot");
    if (initial) route();
    else render(false);
  } catch (error) {
    errorMessage(error);
  } finally {
    refreshing = false;
  }
}
await refresh(true);
setInterval(() => {
  if (!document.hidden) refresh();
}, 5000);
setInterval(() => {
  if ($("#live") && state.snapshot) {
    $("#live").innerHTML = liveMarkup(state.snapshot.live);
    localize($("#live"));
  }
}, 1000);
addEventListener("webtime-languagechange", () => render(false));
onSettingsChanged((settings) => {
  if (state.snapshot) {
    state.snapshot.data.settings = settings;
    render(false);
  }
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refresh();
});
