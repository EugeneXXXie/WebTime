import test from "node:test";
import assert from "node:assert/strict";
import {
  isLocalDomain,
  normalizeDomain,
  freshData,
  validateSettings,
  validateBackup,
} from "../tracking/core.js";

test("local address ranges, IPv6 and public boundary addresses", () => {
  for (const host of [
    "192.168.0.6",
    "192.168.1.1",
    "10.0.0.1",
    "10.10.20.30",
    "172.16.0.1",
    "172.31.255.255",
    "127.0.0.1",
    "127.0.0.2",
    "localhost",
    "[::1]",
    "[fc00::1]",
    "[fdff::1]",
    "[fe80::1]",
    "[febf::1]",
    "[::ffff:192.168.0.6]",
    "169.254.1.1",
  ])
    assert.equal(isLocalDomain(normalizeDomain(`http://${host}/`)), true, host);
  for (const host of [
    "youtube.com",
    "github.com",
    "bilibili.com",
    "localhost.example.com",
    "192.168.0.6.example.com",
    "172.15.255.255",
    "172.32.0.0",
    "192.169.0.1",
    "126.255.255.255",
    "11.0.0.1",
    "8.8.8.8",
    "[2001:4860:4860::8888]",
    "[fbff::1]",
    "[fec0::1]",
    "[::ffff:8.8.8.8]",
  ])
    assert.equal(
      isLocalDomain(normalizeDomain(`https://${host}/`)),
      false,
      host,
    );
});
test("local blocking defaults off, validates boolean, and survives backups", () => {
  assert.equal(freshData().settings.blockLocalIPs, false);
  assert.equal(
    validateSettings({ theme: "dark", animation: "full" }).blockLocalIPs,
    false,
  );
  assert.throws(() =>
    validateSettings({ ...freshData().settings, blockLocalIPs: "false" }),
  );
  const data = freshData();
  data.settings.blockLocalIPs = true;
  assert.equal(validateBackup(data).settings.blockLocalIPs, true);
});
