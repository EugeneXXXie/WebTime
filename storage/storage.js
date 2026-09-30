import { freshData, validateBackup } from "../tracking/core.js";
export async function load() {
  const { store } = await chrome.storage.local.get("store");
  if (store?.data.version === 1) store.data = validateBackup(store.data);
  if (store) store.data.settings.language ??= "system";
  return store || { data: freshData(), checkpoint: null };
}
// One atomic key prevents totals and their checkpoint diverging after termination.
export async function save(data, checkpoint) {
  await chrome.storage.local.set({ store: { data, checkpoint } });
}
