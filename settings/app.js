import { validateBackup, dayKey } from "../tracking/core.js";
import {
  $,
  request,
  applyAppearance,
  errorMessage,
  isDemo,
  localize,
  onSettingsChanged,
} from "../shared/ui.js";
const preferenceKeys = ["theme", "animation", "language", "blockLocalIPs"];
let settings,
  pending = null;
function setPreferencesDisabled(disabled) {
  for (const key of preferenceKeys) $("#" + key).disabled = disabled;
}
function showSettings(s) {
  settings = s;
  applyAppearance(s);
  $("#blockLocalIPs").checked = s.blockLocalIPs ?? false;
  for (const key of ["theme", "animation", "language"])
    $("#" + key).value = s[key] ?? "system";
}
function notice(text) {
  $("#notice").textContent = text;
  localize();
}
async function initialize() {
  try {
    showSettings((await request("snapshot")).data.settings);
    setPreferencesDisabled(false);
  } catch (error) {
    errorMessage(error);
  }
}
for (const key of preferenceKeys)
  $("#" + key).addEventListener("change", async (e) => {
    // Each save sends all preferences, so another control must wait until
    // the latest saved settings arrive before building its next request.
    setPreferencesDisabled(true);
    try {
      const next = {
        ...settings,
        [key]: key === "blockLocalIPs" ? e.target.checked : e.target.value,
      };
      const snap = await request("settings", { settings: next });
      showSettings(snap.data.settings);
      notice("Settings saved.");
    } catch (error) {
      showSettings(settings);
      errorMessage(error);
    } finally {
      setPreferencesDisabled(false);
    }
  });
$("#export").addEventListener("click", async () => {
  try {
    const data = await request("export");
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `webtime-backup-${dayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notice("Backup exported.");
  } catch (error) {
    errorMessage(error);
  }
});
function confirm(action, data) {
  pending = { action, data };
  $("#confirm-title").textContent =
    action === "clear" ? "Clear all data?" : "Replace your current data?";
  $("#confirm-copy").textContent =
    action === "clear"
      ? "This permanently removes your browsing statistics from this device. Your appearance settings will stay. Export a backup first if you want to keep a copy."
      : "This backup passed validation. Importing will replace your current statistics and settings. Export a backup first if you want to keep them.";
  $("#confirm-action").textContent =
    action === "clear" ? "Clear data" : "Replace data";
  $("#confirm").returnValue = "";
  $("#confirm").showModal();
  localize();
}
$("#clear").addEventListener("click", () => confirm("clear"));
$("#import").addEventListener("click", () => $("#file").click());
$("#file").addEventListener("change", async (e) => {
  try {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024)
      throw Error("Backup exceeds the 8 MB import limit.");
    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      throw Error(
        "Unable to read backup. Check that it is a valid WebTime JSON file.",
      );
    }
    // Preflight here, but keep the original schema on the wire. An already
    // running older worker may outlive newly opened UI modules after an update.
    validateBackup(parsed);
    confirm("import", parsed);
  } catch (error) {
    notice(error.message);
  } finally {
    e.target.value = "";
  }
});
$("#confirm").addEventListener("close", async () => {
  const selected = pending;
  pending = null;
  if ($("#confirm").returnValue !== "confirm" || !selected) return;
  try {
    const snap = await request(selected.action, { data: selected.data });
    showSettings(snap.data.settings);
    notice(
      selected.action === "clear"
        ? "All recorded data cleared."
        : "Backup restored.",
    );
  } catch (error) {
    errorMessage(error);
  }
});
if (isDemo) {
  document.querySelectorAll("header a").forEach((a) => (a.href += "?demo"));
  notice("Demo preview. Changes here do not affect extension data.");
}
await initialize();
addEventListener("webtime-languagechange", () => showSettings(settings));
onSettingsChanged(showSettings);
