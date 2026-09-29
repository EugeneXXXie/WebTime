import { freshData, dates, addInterval } from "../tracking/core.js";
import { locale, setLanguage, localize, t } from "./i18n.js";
export { localize, t };
// Settings-only notifications avoid a snapshot request for every periodic save.
export function onSettingsChanged(callback) {
  globalThis.chrome?.storage?.onChanged.addListener((changes, area) => {
    const change = changes.store;
    if (
      area === "local" &&
      change?.newValue?.data?.settings &&
      JSON.stringify(change.oldValue?.data?.settings) !==
        JSON.stringify(change.newValue.data.settings)
    )
      callback(change.newValue.data.settings);
  });
}
export const $ = (selector, root = document) => root.querySelector(selector);
export const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const unitFormats = new Map();
function formatUnit(value, unit) {
  const key = `${locale}:${unit}`;
  if (!unitFormats.has(key))
    unitFormats.set(
      key,
      new Intl.NumberFormat(locale, {
        style: "unit",
        unit,
        unitDisplay: "narrow",
      }),
    );
  return unitFormats.get(key).format(value);
}
export function duration(seconds, precise = false) {
  const s = Math.max(0, Math.floor(seconds)),
    h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60);
  if (locale !== "en") {
    return h
      ? `${formatUnit(h, "hour")} ${formatUnit(m, "minute")}`
      : precise
        ? `${formatUnit(m, "minute")} ${formatUnit(s % 60, "second")}`
        : formatUnit(m, "minute");
  }
  return h
    ? `${h}h ${String(m).padStart(2, "0")}m`
    : precise
      ? `${m}m ${String(s % 60).padStart(2, "0")}s`
      : `${m}m`;
}
export const fullDate = (day) =>
  new Date(day + "T12:00:00").toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
export const shortDay = (day) =>
  new Date(day + "T12:00:00").toLocaleDateString(locale, { weekday: "short" });
export const isExtension = !!globalThis.chrome?.runtime?.id;
export const isDemo = new URLSearchParams(location.search).has("demo");
let preview = freshData();
if (isDemo) {
  const domains = [
    "youtube.com",
    "github.com",
    "google.com",
    "discord.com",
    "reddit.com",
    "figma.com",
  ];
  dates(30).forEach((day, index) => {
    const start = new Date(day + "T08:00:00").getTime();
    let cursor = start;
    domains.forEach((domain, i) => {
      const seconds = Math.round(
        (5100 - i * 650) * (0.66 + ((index * 7 + i * 3) % 11) / 15),
      );
      addInterval(preview, domain, cursor, cursor + seconds * 1000, true);
      cursor += seconds * 1000 + 600000;
    });
  });
}
export async function request(type, body = {}) {
  if (isDemo || !isExtension) {
    if (type === "settings") preview.settings = body.settings;
    if (type === "export") return structuredClone(preview);
    if (type === "import") preview = body.data;
    if (type === "clear")
      preview = { ...freshData(), settings: preview.settings };
    return {
      data: structuredClone(preview),
      live: { status: "inactive" },
      at: Date.now(),
    };
  }
  const response = await chrome.runtime.sendMessage({ type, ...body });
  if (!response?.ok)
    throw Error(
      response?.error ||
        "The background service is unavailable. Reload the extension.",
    );
  return response.result;
}
export function applyAppearance(settings) {
  setLanguage(settings.language);
  localize();
  document.documentElement.dataset.theme = settings.theme;
  document.documentElement.dataset.motion = settings.animation;
}
export function icon(domain) {
  const fallback = `<span class="favicon-letter" aria-hidden="true">${escape(domain[0].toUpperCase())}</span>`;
  if (!isExtension || isDemo) return `<span class="favicon">${fallback}</span>`;
  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", "https://" + domain);
  url.searchParams.set("size", "32");
  return `<span class="favicon">${fallback}<img src="${escape(url.href)}" alt="" loading="lazy"></span>`;
}
document.addEventListener(
  "error",
  (e) => {
    if (e.target.matches?.(".favicon img")) e.target.remove();
  },
  true,
);
export function liveMarkup(live) {
  return `<span class="status ${live.status}"><i></i>${live.status === "live" ? "LIVE" : live.status === "paused" ? "PAUSED" : "INACTIVE"}</span><span>${live.domain ? escape(live.domains?.length > 1 ? `${live.domains.length} websites · ${live.domains.map((item) => item.domain).join(" + ")}` : live.domain) : "Your time, quietly accounted for."}</span><span class="live-time">${live.domain ? duration((Date.now() - live.started) / 1000, true) : ""}</span>`;
}
export function countUp(element, value) {
  if (!element) return;
  if (
    document.documentElement.dataset.motion !== "full" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    element.textContent = duration(value);
    return;
  }
  const start = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - start) / 650);
    element.textContent = duration(value * (1 - (1 - p) ** 3));
    if (p < 1 && element.isConnected) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
export function errorMessage(error) {
  let el = $("#error");
  if (!el) {
    el = document.createElement("div");
    el.id = "error";
    el.setAttribute("role", "alert");
    document.body.append(el);
  }
  el.textContent = error.message;
  localize(el);
}
// Patch existing nodes so periodic snapshots don't reset focus, hover or animations.
export function updateDOM(current, next) {
  if (
    current.nodeType !== next.nodeType ||
    current.nodeName !== next.nodeName
  ) {
    current.replaceWith(next.cloneNode(true));
    return;
  }
  if (current.nodeType === Node.TEXT_NODE) {
    if (current.textContent !== next.textContent)
      current.textContent = next.textContent;
    return;
  }
  if (current.nodeType !== Node.ELEMENT_NODE) return;
  if (current.matches("input,select")) return;
  for (const attr of [...current.attributes])
    if (!next.hasAttribute(attr.name) && attr.name !== "aria-describedby")
      current.removeAttribute(attr.name);
  for (const attr of next.attributes) {
    let value = attr.value;
    if (attr.name === "class")
      for (const name of ["linked", "dim"])
        if (current.classList.contains(name)) value += " " + name;
    if (current.getAttribute(attr.name) !== value)
      current.setAttribute(attr.name, value);
  }
  const old = [...current.childNodes],
    fresh = [...next.childNodes];
  for (let i = 0; i < Math.max(old.length, fresh.length); i++) {
    if (!fresh[i]) old[i].remove();
    else if (!old[i]) current.append(fresh[i].cloneNode(true));
    else updateDOM(old[i], fresh[i]);
  }
}
export function installTooltip() {
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.id = "chart-tooltip";
  tooltip.setAttribute("role", "tooltip");
  document.body.append(tooltip);
  const show = (e) => {
    const target = e.target.closest?.("[data-tip]");
    if (!target) return;
    tooltip.textContent = target.dataset.tip;
    tooltip.classList.add("visible");
    target.setAttribute("aria-describedby", tooltip.id);
    const r = target.getBoundingClientRect();
    tooltip.style.left =
      Math.max(12, Math.min(innerWidth - 220, r.left + r.width / 2 - 90)) +
      "px";
    tooltip.style.top = Math.max(8, r.top - 62) + "px";
  };
  const hide = () => tooltip.classList.remove("visible");
  document.addEventListener("pointerover", show);
  document.addEventListener("focusin", show);
  document.addEventListener("pointerout", hide);
  document.addEventListener("focusout", hide);
  document.addEventListener("scroll", hide, true);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hide();
  });
}
