---
to: node_modules/puppeteer-extra/dist/puppeteer.d.ts
inject: true
before: ChromeArgOptions
skip_if: ChromeArgOptions-fixed
---
// ChromeArgOptions-fixed
// @ts-expect-error