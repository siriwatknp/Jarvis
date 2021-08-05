import * as functions from "firebase-functions";
import { toDate } from "date-fns-tz";
import { google } from "googleapis";
import * as Slack from "api/Slack";
import * as Line from "modules/Line";
import { placeOrder, randomOneOrder } from "modules/GrabFood";
import { getKeyValueMap, createSpreadsheetUtils } from "utils/sheets";

const sheets = google.sheets("v4");

const auth = new google.auth.GoogleAuth({
  scopes: "https://www.googleapis.com/auth/spreadsheets",
});

export const pickAMeal = functions
  .region("asia-southeast2")
  .runWith({ memory: "1GB", timeoutSeconds: 120 })
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
    try {
      if (ggSheetId) {
        const startTime = Date.now();
        const { data: spreadsheet } = await sheets.spreadsheets.get({
          auth: authClient,
          spreadsheetId: ggSheetId,
          includeGridData: true,
        });
        const spreadsheetUtils = createSpreadsheetUtils(spreadsheet);

        const ordersSheet = spreadsheetUtils.findSheetByTitle(sheetTitle);
        const historySheet = spreadsheetUtils.findSheetByTitle(
          `${sheetTitle} History`
        );
        const settingsSheet = spreadsheetUtils.findSheetByTitle("Settings");
        const settings = getKeyValueMap<{
          session: string;
          location: string;
          placeOrderEnabled: boolean;
          latestRestaurantsOmitCount: boolean;
        }>(settingsSheet?.data?.[0].rowData);

        const { result: selectedItem } = randomOneOrder(
          ordersSheet,
          historySheet,
          settings
        );

        if (selectedItem) {
          await placeOrder({
            headless: process.env.NODE_ENV !== "development",
            // headless: false,
            dryrun: !settings.placeOrderEnabled,
            session: settings.session,
            location: settings.location,
            restaurant: selectedItem.restaurant,
            menus: selectedItem.menus,
          });

          const now = toDate(new Date(), {
            timeZone: "Asia/Bangkok",
          });
          const formattedNow = `=DATE(${now.getFullYear()}, ${
            now.getMonth() + 1
          }, ${now.getDate()}) + TIME(${now.getHours()}, ${now.getMinutes()}, ${now.getSeconds()})`;
          const nextRowIndex =
            (historySheet?.data?.[0].rowData?.length || 0) + 1;

          const message = `😋 \`Place order successful!\`\n📍 ${
            selectedItem.restaurant
          }\n🍽 ${selectedItem.menus.map(({ name }) => name).join(", ")}`;
          await Promise.all([
            Slack.sendMessage(message),
            process.env.NODE_ENV !== "development"
              ? Line.sendMessageToFollowers(message)
              : Promise.resolve(undefined),
            // update History sheet
            sheets.spreadsheets.values.update({
              auth: authClient,
              spreadsheetId: ggSheetId,
              range: `${historySheet?.properties?.title}!A${nextRowIndex}`,
              valueInputOption: "USER_ENTERED",
              requestBody: {
                values: [
                  [
                    formattedNow,
                    selectedItem.restaurant,
                    selectedItem.menus.map(({ name }) => name).join(", "),
                  ],
                ],
              },
            }),
          ]);
          const endTime = Date.now();
          console.info(
            "The process is done in",
            (endTime - startTime) / 1000,
            "seconds"
          );

          // need to wait for puppeteer to finish, otherwise background tasks cannot run in cloud functions.
          // https://github.com/puppeteer/puppeteer/issues/4796#issuecomment-535612842
          response.status(200).send("The ordering process is done.");
        }
      } else {
        throw new Error("`ggSheetId` query param is required.");
      }
    } catch (error) {
      console.error(error);
      const message = `🚨 Fail to place order - ${error.message || "unknown"}`;
      await Promise.all([
        Slack.sendMessage(message),
        process.env.NODE_ENV !== "development"
          ? Line.sendMessageToFollowers(message)
          : Promise.resolve(undefined),
      ]);
      response.status(400).send(error.message);
    }
  });
