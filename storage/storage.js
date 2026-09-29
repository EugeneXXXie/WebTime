import { freshData } from "../tracking/core.js";
export async function load() {
  const { store } = await chrome.storage.local.get("store");
  return store || { data: freshData(), checkpoint: null };
}
// One atomic key prevents totals and their checkpoint diverging after termination.
export async function save(data, checkpoint) {
  await chrome.storage.local.set({ store: { data, checkpoint } });
}
