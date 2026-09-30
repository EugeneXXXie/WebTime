import test from "node:test";
import assert from "node:assert/strict";
import { resolveLanguage, setLanguage, t, languages } from "../shared/i18n.js";
import { messages } from "../shared/messages.js";
import {
  validateSettings,
  freshData,
  validateBackup,
} from "../tracking/core.js";

test("system locale matching and explicit language override", () => {
  assert.equal(resolveLanguage("system", ["zh-CN", "en-US"]), "zh");
  assert.equal(resolveLanguage("system", ["fr-FR", "ja-JP"]), "ja");
  assert.equal(resolveLanguage("system", ["fr-FR"]), "en");
  assert.equal(resolveLanguage("de", ["zh-CN"]), "de");
  assert.equal(resolveLanguage("system", ["pt-BR", "es-MX"]), "es");
});
test("every message has all seven translations and matching placeholders", () => {
  for (const [key, entries] of Object.entries(messages)) {
    for (const lang of languages.filter((l) => l !== "en")) {
      assert(entries[lang]?.trim(), `${lang}: ${key}`);
      assert.deepEqual(
        (entries[lang].match(/\{\w+\}/g) || []).sort(),
        (key.match(/\{\w+\}/g) || []).sort(),
      );
    }
  }
  setLanguage("zh");
  assert.equal(t("LAST 7 DAYS"), "最近 7 天");
  assert.equal(
    t("2 websites · github.com + youtube.com"),
    "2 个网站 · github.com + youtube.com",
  );
  setLanguage("de");
  assert.equal(t("Settings"), "Einstellungen");
  setLanguage("en");
  assert.equal(t("Settings"), "Settings");
});
test("old settings default to system and language survives backup validation", () => {
  assert.equal(
    validateSettings({ theme: "dark", animation: "full" }).language,
    "system",
  );
  const data = freshData();
  data.settings.language = "ja";
  assert.equal(validateBackup(data).settings.language, "ja");
  assert.throws(() =>
    validateSettings({ ...data.settings, language: "invalid" }),
  );
});
