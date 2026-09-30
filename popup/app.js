import { dates, summarize } from "../tracking/core.js";
import {
  $,
  escape,
  duration,
  request,
  applyAppearance,
  icon,
  liveMarkup,
  countUp,
  errorMessage,
  isExtension,
  isDemo,
  localize,
  onSettingsChanged,
} from "../shared/ui.js";
let snapshot;
function openDashboard(hash = "today") {
  const path = "dashboard/index.html" + (isDemo ? "?demo" : "") + "#" + hash;
  if (isExtension) chrome.tabs.create({ url: chrome.runtime.getURL(path) });
  else window.open("../" + path, "_blank", "noopener");
}
async function refresh(initial = false) {
  try {
    snapshot = await request("snapshot");
    applyAppearance(snapshot.data.settings);
    $("#theme").value = snapshot.data.settings.theme;
    const sum = summarize(snapshot.data, dates(1));
    $("#total").textContent = duration(sum.total);
    if (initial) countUp($("#total"), sum.total);
    $("#live").innerHTML = liveMarkup(snapshot.live);
    $("#sites").innerHTML =
      sum.sites
        .slice(0, 4)
        .map(
          (s) =>
            `<button class="popup-row" data-domain="${escape(s.domain)}">${icon(s.domain)}<span>${escape(s.title)}</span><span>${duration(s.seconds)}</span></button>`,
        )
        .join("") ||
      '<p class="empty">Your first session starts when you browse.<br>Everything stays on this device.</p>';
    localize();
  } catch (error) {
    errorMessage(error);
  }
}
$("#open").addEventListener("click", () => openDashboard());
$("#sites").addEventListener("click", (e) => {
  const row = e.target.closest("[data-domain]");
  if (row) openDashboard("detail/" + encodeURIComponent(row.dataset.domain));
});
$("#theme").addEventListener("change", async (e) => {
  try {
    await request("settings", {
      settings: { ...snapshot.data.settings, theme: e.target.value },
    });
    await refresh();
  } catch (error) {
    errorMessage(error);
  }
});
await refresh(true);
setInterval(() => refresh(), 5000);
setInterval(() => {
  if (snapshot) {
    $("#live").innerHTML = liveMarkup(snapshot.live);
    localize($("#live"));
  }
}, 1000);
addEventListener("webtime-languagechange", () => refresh());
onSettingsChanged(() => refresh());
