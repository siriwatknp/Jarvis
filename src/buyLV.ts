import admin from "firebase-admin";
import * as functions from "firebase-functions";
import * as Line from "api/Line";
import { Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { waitFor } from "utils/waitFor";

puppeteer.use(StealthPlugin());

const LOGIN_URL = "https://secure.louisvuitton.com/tha-th/mylv/overview";
const CART_URL = "https://secure.louisvuitton.com/tha-th/cart";
const PAYMENT_URL = "https://secure.louisvuitton.com/tha-th/checkout/payment";

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

export const buyLV = functions
  .region("asia-southeast1")
  .runWith({ memory: "1GB", timeoutSeconds: 180 })
  .https.onRequest(async (request, response) => {
    const { delay = 0 } = request.query as { delay?: number };
    const { headers } = request;
    if (
      headers.authorization !==
      `Basic ${functions.config().authorization.buylv}`
    ) {
      response.status(401).send("❌ Unauthorized!");
      return;
    }
    const browser = await puppeteer.launch({
      // @ts-expect-error typing issues https://github.com/berstend/puppeteer-extra/issues/428
      headless: process.env.NODE_ENV !== "development",
      defaultViewport: { width: 1024, height: 600 },
      args: [
        // needed to fill credit card in iframe, lol
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
    });

    const page = await browser.newPage();
    await page.waitForTimeout(Number(delay) || 0);
    await page.goto(LOGIN_URL, {
      waitUntil: ["domcontentloaded", "networkidle0"],
    });

    await page.waitForSelector("input#loginloginForm");
    await page.type(
      "input#loginloginForm",
      functions.config().louisvuitton.username
    );
    await page.type(
      "input#passwordloginForm",
      functions.config().louisvuitton.password
    );
    await page.click("input#loginSubmit_");

    await page.waitForNavigation({
      waitUntil: ["domcontentloaded", "networkidle0"],
    });

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
    // const products = [
    //   // local testing
    //   {
    //     name: "น้ำหอม SPELL ON YOU",
    //     url: "https://th.louisvuitton.com/tha-th/products/spell-on-you-nvprod3170150v",
    //   },
    // ];
    const lineReceivers = (
      functions.config().louisvuitton.line_receivers || ""
    ).split(",");

    async function typeInIframe(id: string, value: string) {
      const frameHandle = await page.$(`${id.replace("#", ".")} iframe`);
      if (frameHandle) {
        const frame = await frameHandle?.contentFrame();
        console.log("frame", frame);
        if (frame) {
          await frame.type(id, value);
        }
      }
    }

    await products.reduce(async (resolve, aProduct) => {
      await resolve;
      await page.goto(aProduct.url, {
        waitUntil: ["domcontentloaded", "networkidle0"],
      });
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
      await saveScreenShot(page, `${aProduct.name}.png`);
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
        // await page.click("button.lv-product-purchase-button");

        // await page.goto(CART_URL, {
        //   waitUntil: ["domcontentloaded", "networkidle0"],
        // });
        // await Promise.all([
        //   page.waitForNavigation(),
        //   page.click("#proceedToCheckoutButtonTop"), // then wait for navigation
        // ]);

        // await Promise.all([
        //   page.waitForNavigation({
        //     waitUntil: ["domcontentloaded", "networkidle0"],
        //   }),
        //   page.click("#globalSubmit"),
        // ]); // then wait for navigation

        // // Enters https://secure.louisvuitton.com/tha-th/checkout/payment
        // await typeInIframe("#encryptedCardNumber", "4242424242424242");
        // await page.type("#creditCardHoldersName", "SIRIWAT KUNAPORN");
        // await typeInIframe("#encryptedExpiryMonth", "07");
        // await typeInIframe("#encryptedExpiryYear", "24");
        // await typeInIframe("#encryptedSecurityCode", "473");
        // await page.click("#saveCreditCard");
        // await Promise.all([
        //   page.waitForNavigation({
        //     waitUntil: ["domcontentloaded", "networkidle0"],
        //   }),
        //   page.click("#globalSubmit"),
        // ]); // then wait for navigation

        // await page.click("#acceptTermsTop");
        // await Promise.all([
        //   page.waitForNavigation({
        //     waitUntil: ["domcontentloaded", "networkidle0"],
        //   }),
        //   page.click("#globalSubmitTop"),
        // ]); // then wait for navigation
      }
      return Promise.resolve();
    }, Promise.resolve());

    await browser.close();
    response.send("Done.");
  });
