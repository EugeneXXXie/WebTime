import { languages, messages } from "./messages.js";
export { languages };
export function resolveLanguage(
  preference = "system",
  accepted = globalThis.navigator?.languages || ["en"],
) {
  if (languages.includes(preference)) return preference;
  for (const tag of accepted) {
    const base = tag.toLowerCase().split(/[-_]/)[0];
    if (languages.includes(base)) return base;
  }
  return "en";
}
let preference = "system";
export let locale = resolveLanguage();
export function setLanguage(value = "system") {
  preference = value;
  locale = resolveLanguage(value);
  if (globalThis.document) document.documentElement.lang = locale;
}
const exact = new Map(
  Object.keys(messages).map((key) => [key.toLowerCase(), key]),
);
const patterns = Object.keys(messages)
  .filter((key) => key.includes("{"))
  .sort((a, b) => b.length - a.length)
  .map((key) => {
    const names = [];
    const expression = key
      .split(/(\{\w+\})/)
      .map((part) => {
        if (part.startsWith("{")) {
          names.push(part.slice(1, -1));
          return "(.+?)";
        }
        return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("");
    return { key, names, regex: new RegExp("^" + expression + "$", "i") };
  });
export function t(source) {
  const normalized = source.trim().replace(/\s+/g, " ");
  if (locale === "en") return source;
  const key = exact.get(normalized.toLowerCase());
  if (key) return messages[key][locale];
  for (const pattern of patterns) {
    const match = normalized.match(pattern.regex);
    if (match)
      return messages[pattern.key][locale].replace(
        /\{(\w+)\}/g,
        (_, name) => match[pattern.names.indexOf(name) + 1],
      );
  }
  // The arrow is presentation, not part of the average-time message.
  if (normalized.endsWith(" ↗")) return t(normalized.slice(0, -2)) + " ↗";
  return source;
}
// Keep the source on each node so switching languages is reversible without
// replacing controls, focus, event handlers or interpolated website names.
const sources = new WeakMap();
function translateValue(node, field, value) {
  const saved = sources.get(node) || {};
  const prior = saved[field];
  const source = prior && prior.result === value ? prior.source : value;
  const result = t(source);
  saved[field] = { source, result };
  sources.set(node, saved);
  return result;
}
export function localize(root = document) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (
      !node.textContent.trim() ||
      node.parentElement?.closest(
        "script,style,[translate=no],[data-domain] .site-info,[data-domain] .favicon,.detail-title,.popup-row > span:nth-child(2),.legend button[data-detail] > span",
      )
    )
      continue;
    node.textContent = translateValue(node, "text", node.textContent);
  }
  for (const node of root.querySelectorAll(
    "[aria-label],[title],[placeholder]",
  ))
    for (const attr of ["aria-label", "title", "placeholder"])
      if (node.hasAttribute(attr))
        node.setAttribute(
          attr,
          translateValue(node, attr, node.getAttribute(attr)),
        );
}
globalThis.addEventListener?.("languagechange", () => {
  if (preference === "system") {
    setLanguage();
    globalThis.dispatchEvent(new Event("webtime-languagechange"));
  }
});
