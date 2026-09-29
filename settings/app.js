import { validateBackup, dayKey } from "../tracking/core.js";
import {
  $,
  request,
  applyAppearance,
  errorMessage,
  isDemo,
} from "../shared/ui.js";
let settings,
  pending = null;
function showSettings(s) {
  settings = s;
  applyAppearance(s);
  for (const key of ["theme", "animation", "idleThreshold"])
    $("#" + key).value = s[key];
}
function notice(text) {
  $("#notice").textContent = text;
}
async function initialize() {
  try {
    showSettings((await request("snapshot")).data.settings);
  } catch (error) {
    errorMessage(error);
  }
}
for (const key of ["theme", "animation", "idleThreshold"])
  $("#" + key).addEventListener("change", async (e) => {
    e.target.disabled = true;
    try {
      const next = {
        ...settings,
        [key]:
          key === "idleThreshold" ? Number(e.target.value) : e.target.value,
      };
      const snap = await request("settings", { settings: next });
      showSettings(snap.data.settings);
      notice("Settings saved.");
    } catch (error) {
      showSettings(settings);
      errorMessage(error);
    } finally {
      e.target.disabled = false;
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
}
$("#clear").addEventListener("click", () => confirm("clear"));
$("#import").addEventListener("click", () => $("#file").click());
$("#file").addEventListener("change", async (e) => {
  try {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024)
      throw Error("Backup exceeds the 8 MB import limit.");
    confirm("import", validateBackup(JSON.parse(await file.text())));
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
