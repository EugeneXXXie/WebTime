# tldts 7.4.16

Vendored, unchanged standalone ESM bundle from the MIT-licensed [tldts package](https://github.com/remusao/tldts), published as `tldts@7.4.16` (upstream commit `b9519e00ba47ad557cc9fc0416ea0cf5f89a4a12`). The adjacent LICENSE applies to this library. No network requests or build step are needed in the extension.

The bundle embeds the [Public Suffix List](https://publicsuffix.org/), © Mozilla Foundation and contributors, whose source is available under the [Mozilla Public License 2.0](https://mozilla.org/MPL/2.0/) at the [official source repository](https://github.com/publicsuffix/list). WebTime uses ICANN rules (`allowPrivateDomains: false`) to merge every subdomain of a registrable domain, including shared hosting domains. IP addresses and single-label hosts remain unchanged.

To update, download the exact desired npm package with `npm pack tldts@VERSION`, copy `package/dist/index.esm.min.js` and `package/LICENSE`, update this notice and run the grouping tests, including PSL wildcard and exception rules.
