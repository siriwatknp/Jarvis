---
to: node_modules/puppeteer-extra/dist/puppeteer.d.ts
inject: true
before: FetcherOptions
skip_if: FetcherOptions-fixed
---
// FetcherOptions-fixed
// @ts-expect-error