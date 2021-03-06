import * as functions from "firebase-functions";
import { google } from "googleapis";
import admin from "firebase-admin";
import { launch } from "puppeteer";
import * as Line from "api/Line";
import { createSpreadsheetUtils } from "utils/sheets";
import { waitFor } from "utils/waitFor";

const sheets = google.sheets("v4");

const auth = new google.auth.GoogleAuth({
  scopes: "https://www.googleapis.com/auth/spreadsheets",
});

async function getOTP(): Promise<string> {
  const snapshot = await admin
    .database()
    .ref(`/GrabOTP/${functions.config().line.siriwatkuid}`)
    .once("value");
  const result = snapshot.val();
  if (!result) {
    throw new Error("result is empty");
  } else {
    return result;
  }
}

async function clearDB() {
  await Promise.all([
    admin
      .database()
      .ref(`/GrabOTP/${functions.config().line.siriwatkuid}`)
      .remove(),
    admin
      .database()
      .ref(`/GrabFoodStatus/${functions.config().line.siriwatkuid}`)
      .remove(),
  ]);
}

export const stayLoginGrabFood = functions
  .region("asia-southeast1")
  .runWith({ memory: "1GB", timeoutSeconds: 180 })
  .https.onRequest(async (request, response) => {
    const { headers } = request;
    if (
      headers.authorization !==
      `Basic ${functions.config().authorization.staylogingrabfood}`
    ) {
      response.status(401).send("❌ Unauthorized!");
      return;
    }
    const myUid = functions.config().line.siriwatkuid;
    const { ggSheetId, sheetTitle = "Settings" } = request.query as {
      ggSheetId?: string;
      sheetTitle?: string;
    };
    const authClient = await auth.getClient();
    if (ggSheetId) {
      try {
        const startTime = Date.now();
        const browser = await launch({
          headless: process.env.NODE_ENV !== "development",
          defaultViewport: { width: 1024, height: 600 },
        });
        await admin
          .database()
          .ref(`/GrabFoodStatus/${myUid}`)
          .set("signing-in");
        const page = await browser.newPage();
        await page.goto("https://food.grab.com/th/en/");
        await page.waitForXPath('//a[contains(., "Login")]');
        const [loginBtn] = await page.$x('//a[contains(., "Login")]');
        loginBtn.click();

        await Promise.all([
          page.waitForNavigation({
            waitUntil: ["domcontentloaded", "networkidle0"],
          }),
          loginBtn.click(),
        ]);

        await page.waitForSelector("input#phoneNo");
        await page.type("input#phoneNo", "632259940");
        await page.click("input#consent");
        await page.waitForSelector(
          'button[class*="VerifyPhone"]:not([disabled])'
        );
        await page.waitForTimeout(200);
        await page.click('button[class*="VerifyPhone"]');
        await Line.sendMessage(
          [functions.config().line.siriwatkuid],
          "👋 Hello, I'm trying to login to your Grab account. Please reply with the OTP code from your registered phone number."
        );
        const otp = await waitFor(getOTP, { interval: 3000, retryCount: 40 });
        if (!otp) {
          await browser.close();
          throw new Error("Does not receive any OTP");
        }
        console.log("otp", otp);

        await page.type("input#otp", otp);
        await page.waitForXPath('//button[contains(.,"Next")]');
        const [nextBtn] = await page.$x('//button[contains(.,"Next")]');
        nextBtn.click();

        await page.waitForXPath(`//p[contains(., "Enter your Grab PIN")]`);

        const grabPin = functions.config().grab.siriwatkpin.split("");

        await page.keyboard.type(grabPin[0]);
        await page.keyboard.type(grabPin[1]);
        await page.keyboard.type(grabPin[2]);
        await page.keyboard.type(grabPin[3]);
        await page.keyboard.type(grabPin[4]);
        await page.keyboard.type(grabPin[5]);
        await page.waitForSelector(
          'button[class*="ChallengeForm"]:not([disabled])'
        );
        await Promise.all([
          page.waitForNavigation({
            waitUntil: ["domcontentloaded", "networkidle0"],
          }),
          page.click('button[class*="ChallengeForm"]'),
        ]);

        const cookies = await page.cookies();
        await browser.close();

        const session = cookies.find((item) => item.name === "gfc_session");

        const { data: spreadsheet } = await sheets.spreadsheets.get({
          auth: authClient,
          spreadsheetId: ggSheetId,
          includeGridData: true,
        });

        const spreadsheetUtils = createSpreadsheetUtils(spreadsheet);

        const settingsSheet = spreadsheetUtils.findSheetByTitle(sheetTitle);

        const rowIndex = settingsSheet?.data?.[0].rowData?.findIndex(
          ({ values }) =>
            values?.[0].userEnteredValue?.stringValue === "session"
        );

        if (rowIndex !== undefined) {
          await sheets.spreadsheets.values.update({
            auth: authClient,
            spreadsheetId: ggSheetId,
            range: `${sheetTitle}!B${rowIndex + 1}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [[session?.value]],
            },
          });
        }

        await clearDB();

        const endTime = Date.now();
        console.info(
          "The process is done in",
          (endTime - startTime) / 1000,
          "seconds"
        );

        response.status(200).send("Done!");
      } catch (error: unknown) {
        await clearDB();
        response.status(400).send((error as Error)?.message || "Unknown error");
      }
    } else {
      response.status(400).send("`ggSheetId` query param is required.");
    }
  });
