import * as functions from "firebase-functions";
import { google } from "googleapis";
import * as Slack from "api/Slack";
import { extractOrders, placeOrder } from "modules/GrabFood";
import { getKeyValueMap, createSpreadsheetUtils } from "utils/sheets";

const sheets = google.sheets("v4");

const auth = new google.auth.GoogleAuth({
  scopes: "https://www.googleapis.com/auth/spreadsheets",
});

export const pickAMealE2E_mVAfm = functions
  .region("asia-southeast2")
  .runWith({ memory: "1GB", timeoutSeconds: 540 }) // max 540
  .https.onRequest(async (request, response) => {
    const { headers } = request;
    if (
      headers.authorization !==
      `Basic ${functions.config().authorization.pickameal}`
    ) {
      response.status(401).send("❌ Unauthorized!");
      return;
    }
    const { ggSheetId, sheetTitle = "Food" } = request.query as {
      ggSheetId?: string;
      sheetTitle?: string;
    };
    const authClient = await auth.getClient();
    if (ggSheetId) {
      const startTime = Date.now();
      const { data: spreadsheet } = await sheets.spreadsheets.get({
        auth: authClient,
        spreadsheetId: ggSheetId,
        includeGridData: true,
      });
      const spreadsheetUtils = createSpreadsheetUtils(spreadsheet);

      const ordersSheet = spreadsheetUtils.findSheetByTitle(sheetTitle);
      const settingsSheet = spreadsheetUtils.findSheetByTitle("Settings");

      const grid = ordersSheet?.data?.[0].rowData || [];

      grid.shift(); // remove header
      let data = extractOrders(grid);
      data = data.filter(({ disabled }) => !disabled);

      await data.reduce(async (promise, item) => {
        await promise;
        const settings = getKeyValueMap<{
          session: string;
          location: string;
        }>(settingsSheet?.data?.[0].rowData);
        try {
          await placeOrder({
            headless: process.env.NODE_ENV !== "development",
            dryrun: true,
            session: settings.session,
            location: settings.location,
            restaurant: item.restaurant,
            menus: item.menus,
          });
          const message = `😋 \`[Test] Place order successful!\`\n📍 ${
            item.restaurant
          }\n🍽 ${item.menus.map(({ name }) => name).join(", ")}`;
          await Slack.sendMessage(message);
        } catch (error) {
          const errMessage = error.message || "Unknown Error";
          await Slack.sendMessage(
            `❌ \`[Test] Place order failed!\`\n📍 ${
              item.restaurant
            }\n🍽 ${item.menus
              .map(({ name }) => name)
              .join(", ")}\n🔎 ${errMessage}`
          );
        }
        return Promise.resolve();
      }, Promise.resolve());
      const endTime = Date.now();
      console.info(
        "All tests are done in",
        (endTime - startTime) / 1000,
        "seconds"
      );
      response.status(200).send("All the tests are done!");
    } else {
      response.status(400).send("`ggSheetId` query param is required.");
    }
  });
