import { escape, duration, shortDay, fullDate } from "../shared/ui.js";
export const palette = ["#9a8cff", "#718eb9", "#77aaa4", "#b4a18a", "#77798c"];
export function bars(values, labels, { compact = false, hourly = false } = {}) {
  const max = Math.max(...values, 1),
    width = 1000,
    height = compact ? 78 : 120,
    step = width / values.length;
  return `<div class="bar-chart ${compact ? "compact" : ""}"><svg viewBox="0 0 ${width} ${height + 5}" preserveAspectRatio="none" role="group" aria-label="${hourly ? "Hourly" : "Daily"} activity chart"><path d="M0 ${height}H1000 M0 ${height / 2}H1000 M0 0H1000" class="gridline"/>${values
    .map((v, i) => {
      const h = Math.max(v ? 3 : 1, (v / max) * (height - 8));
      const label = hourly
        ? `${String(i).padStart(2, "0")}:00 – ${String(i + 1).padStart(2, "0")}:00`
        : fullDate(labels[i]);
      return `<g tabindex="0" role="img" aria-label="${escape(label)}, ${duration(v, true)}" data-tip="${escape(label)}\n${duration(v, true)}"><rect class="hit" x="${i * step}" width="${step}" height="${height}"/><rect class="bar" x="${i * step + step * 0.21}" y="${height - h}" width="${step * 0.58}" height="${h}" rx="${Math.min(4, step * 0.12)}" style="--bar-opacity:${v ? 0.45 + (v / max) * 0.55 : 0.12}"/></g>`;
    })
    .join(
      "",
    )}</svg><div class="axis ${values.length > 7 ? "dense" : ""}">${labels.map((d, i) => `<span>${hourly ? (i % 4 === 0 ? String(i).padStart(2, "0") : "") : values.length <= 7 ? `${shortDay(d)}<b>${duration(values[i])}</b>` : i % 5 === 0 ? new Date(d + "T12:00:00").getDate() : ""}</span>`).join("")}</div></div>`;
}
export function ring(sites, total) {
  const items = sites.slice(0, 4).map((s) => ({ ...s, label: s.title }));
  const rest = sites.slice(4).reduce((n, s) => n + s.seconds, 0);
  if (rest) items.push({ domain: "other", label: "Other", seconds: rest });
  let offset = 0;
  const circumference = 2 * Math.PI * 78;
  return `<div class="breakdown-body"><div class="ring"><svg viewBox="0 0 200 200" role="group" aria-label="Website usage breakdown"><circle cx="100" cy="100" r="78" class="ring-track"/>${items
    .map((s, i) => {
      const length = (s.seconds / (total || 1)) * circumference,
        start = offset;
      offset += length;
      return `<circle tabindex="0" role="img" aria-label="${escape(s.label)} ${Math.round((s.seconds / (total || 1)) * 100)} percent" data-domain="${escape(s.domain)}" data-tip="${escape(s.label)} · ${duration(s.seconds)}" class="segment" cx="100" cy="100" r="78" stroke="${palette[i]}" stroke-dasharray="${Math.max(0, length - 4)} ${circumference - Math.max(0, length - 4)}" stroke-dashoffset="${-start}"/>`;
    })
    .join(
      "",
    )}</svg><div class="ring-label"><strong>${duration(total)}</strong><span>TOTAL TIME</span></div></div><div class="legend">${items.map((s, i) => `<button data-domain="${escape(s.domain)}" data-tip="${duration(s.seconds)}" ${s.domain !== "other" ? `data-detail="${escape(s.domain)}"` : ""}><i style="background:${palette[i]}"></i><span>${escape(s.label)}</span><b>${Math.round((s.seconds / (total || 1)) * 100)}%</b></button>`).join("") || '<span class="muted">Your browsing mix will appear here.</span>'}</div></div>`;
}
export function rhythm(data, days) {
  const cells = days.map((day) =>
    Array.from({ length: 24 }, (_, h) =>
      Object.values(data.domains).reduce(
        (n, s) => n + (s.hourly[day]?.[h] || 0),
        0,
      ),
    ),
  );
  const max = Math.max(1, ...cells.flat());
  return `<div class="rhythm"><div class="rhythm-labels"><span></span>${Array.from({ length: 24 }, (_, h) => `<span>${h % 4 === 0 ? String(h).padStart(2, "0") : ""}</span>`).join("")}</div>${days.map((day, i) => `<div class="rhythm-day"><span>${shortDay(day)}</span>${cells[i].map((v, h) => `<span tabindex="0" role="img" aria-label="${fullDate(day)}, ${h}:00, ${duration(v, true)}" data-tip="${shortDay(day)} ${h}:00 – ${h + 1}:00\n${duration(v, true)}" class="heat" style="--intensity:${v ? Math.max(0.2, v / max) : 0.06}"></span>`).join("")}</div>`).join("")}</div>`;
}
