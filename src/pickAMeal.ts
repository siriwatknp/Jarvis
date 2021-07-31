import * as functions from "firebase-functions";
import { google } from "googleapis";
import * as Slack from "api/Slack";
import { extractMenu, placeOrder } from "modules/GrabFood";
import { shuffle, splitByWeight, randomOneItem } from "utils/shuffle";

const sheets = google.sheets("v4");

const auth = new google.auth.GoogleAuth({
  scopes: "https://www.googleapis.com/auth/spreadsheets",
});

export const pickAMeal = functions
  .region("asia-southeast2")
  .runWith({ memory: "1GB" })
  .https.onRequest(async (request, response) => {
    const { ggSheetId } = request.query as {
      ggSheetId?: string;
    };
    const authClient = await auth.getClient();
    const sheetNames = {
      orders: "Orders",
      settings: "Settings",
    };
    try {
      if (ggSheetId) {
        const spreadsheet = await sheets.spreadsheets.get({
          auth: authClient,
          spreadsheetId: ggSheetId,
          includeGridData: true,
        });

        const ordersSheet = spreadsheet.data.sheets?.find(
          (s) => s.properties?.title === sheetNames.orders
        );
        const settingsSheet = spreadsheet.data.sheets?.find(
          (s) => s.properties?.title === sheetNames.settings
        );
        const settings = (
          settingsSheet?.data?.[0].rowData?.slice(1) || []
        ).reduce(
          (result, { values }) => ({
            ...result,
            [values?.[0].userEnteredValue?.stringValue || ""]:
              values?.[1].userEnteredValue?.stringValue,
          }),
          {}
        ) as { session: string; location: string };

        const grid = ordersSheet?.data?.[0].rowData;

        if (grid) {
          grid.shift(); // remove header
          const data = grid.map(({ values }) => {
            return {
              weight: values?.[0].userEnteredValue?.numberValue,
              restaurant: values?.[1].userEnteredValue?.stringValue || "",
              menus: values
                ? values
                    .slice(2)
                    .map((item) =>
                      extractMenu(item.userEnteredValue?.stringValue || "")
                    )
                : [],
            };
          });

          // take weight into account
          const selectedItem = randomOneItem(shuffle(splitByWeight(data)));

          // send message to slack
          Slack.sendMessage(
            `🍽 ${selectedItem.restaurant} - ${selectedItem.menus
              .map(({ name }) => name)
              .join(", ")}`
          );

          await placeOrder({
            headleass: true,
            session: settings.session,
            location: settings.location,
            restaurant: selectedItem.restaurant,
            menus: selectedItem.menus,
          });

          response.status(200).send("successful!");
        }
      } else {
        throw new Error("`ggSheetId` query param is required.");
      }
    } catch (error) {
      console.error(error.message);
      await Slack.sendMessage(
        `🚨 Fail to place order - ${error.message || "unknown"}`
      );
      response.status(400).send(error.message);
    }
  });
