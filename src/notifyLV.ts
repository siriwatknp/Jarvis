import admin from "firebase-admin";
import * as functions from "firebase-functions";
import { Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import * as Line from "api/Line";
import { waitFor } from "utils/waitFor";

puppeteer.use(StealthPlugin());

async function saveScreenShot(page: Page, path: string) {
  const imageBuffer = await page.screenshot();

  const bucket = admin.storage().bucket();

  // Create a file object
  const file = bucket.file(path);

  // Save the image
  if (imageBuffer) {
    await file.save(imageBuffer, { gzip: true });
  }
}

export const notifyLV = functions
  .region("asia-southeast1")
  .runWith({ memory: "1GB", timeoutSeconds: 180 })
  .https.onRequest(async (request, response) => {
    const { delay = 0 } = request.query as { delay?: number };
    const { headers } = request;
    if (
      headers.authorization !==
      `Basic ${functions.config().authorization.notifylv}`
    ) {
      response.status(401).send("❌ Unauthorized!");
      return;
    }
    const browser = await puppeteer.launch({
      // @ts-expect-error typing issues https://github.com/berstend/puppeteer-extra/issues/428
      headless: process.env.NODE_ENV !== "development",
      defaultViewport: { width: 1024, height: 728 },
    });

    const page = await browser.newPage();
    await page.waitForTimeout(Number(delay) || 0);

    const snapshot = await admin.database().ref(`/buyLVSettings`).once("value");
    const {
      products: data,
      retryCount,
      live,
    } = snapshot.val() as {
      products: Array<{ name: string; url: string; enabled: boolean }>;
      retryCount: number;
      live: boolean;
    };
    const products = data.filter(({ enabled }) => !!enabled);
    const lineReceivers = (
      functions.config().louisvuitton.line_receivers || ""
    ).split(",");

    await products.reduce(async (resolve, aProduct) => {
      await resolve;
      await page.goto(aProduct.url);
      const result = await waitFor(
        async (retry) => {
          if (retry > 0) {
            await page.reload({
              waitUntil: ["domcontentloaded", "networkidle0"],
            });
          }
          return page.waitForSelector(".lv-stock-indicator.-available", {
            // button.lv-product-purchase-button:not([data-evt-action-ga='qbit_experience_back_in_stock'])
            timeout: 1000,
          });
        },
        { interval: 50, retryCount }
      );
      await saveScreenShot(
        page,
        `notify-lv/${aProduct.name}_${new Date().toTimeString()}.png`
      );
      console.info(
        `send line message to ${
          lineReceivers.length
        } people: ${lineReceivers.join(", ")}`
      );
      if (!result) {
        if (process.env.NODE_ENV === "development") {
          await Line.sendMessage(
            lineReceivers,
            `😢 ${aProduct.name} is not available!`
          );
        }
      } else {
        if (live) {
          await Line.sendMessage(
            lineReceivers,
            `🛍 ${aProduct.name} in stock, SHOP NOW!\n${aProduct.url}`
          );
        } else {
          await Line.sendMessage(
            [functions.config().line.siriwatkuid],
            `🛍 ${aProduct.name} in stock, SHOP NOW!\n${aProduct.url}`
          );
        }
      }
      return Promise.resolve();
    }, Promise.resolve());

    await browser.close();
    response.send("Done.");
  });
