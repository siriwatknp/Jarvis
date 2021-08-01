import * as functions from "firebase-functions";
import { toDate } from "date-fns-tz";
import { google } from "googleapis";
import * as Slack from "api/Slack";
import { placeOrder, extractOrders } from "modules/GrabFood";
import { shuffle, splitByWeight, randomOneItem } from "utils/shuffle";
import { getKeyValueMap } from "utils/sheets";

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
      history: "History",
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
        const historySheet = spreadsheet.data.sheets?.find(
          (s) => s.properties?.title === sheetNames.history
        );
        const settingsSheet = spreadsheet.data.sheets?.find(
          (s) => s.properties?.title === sheetNames.settings
        );
        const settings = getKeyValueMap<{
          session: string;
          location: string;
          placeOrderEnabled: boolean;
          noRepeatRestaurant: boolean;
        }>(settingsSheet?.data?.[0].rowData);

        const grid = ordersSheet?.data?.[0].rowData;

        if (grid) {
          grid.shift(); // remove header
          let data = extractOrders(grid);

          if (settings.noRepeatRestaurant) {
            data = data.filter(
              ({ restaurant }) =>
                restaurant !==
                (historySheet?.data?.[0].rowData || []).slice(-1)[0].values?.[1]
                  ?.userEnteredValue?.stringValue
            );
          }

          // take weight into account
          const selectedItem = randomOneItem(shuffle(splitByWeight(data)));

          // send message to slack
          Slack.sendMessage(
            `📍 ${selectedItem.restaurant}\n🍽 ${selectedItem.menus
              .map(({ name }) => name)
              .join(", ")}`
          );

          await placeOrder({
            headleass: true,
            dryrun: !settings.placeOrderEnabled,
            session: settings.session,
            location: settings.location,
            restaurant: selectedItem.restaurant,
            menus: selectedItem.menus,
          });

          // Update History sheet
          const now = toDate(new Date(), {
            timeZone: "Asia/Bangkok",
          });
          const formattedNow = `=DATE(${now.getFullYear()}, ${
            now.getMonth() + 1
          }, ${now.getDate()}) + TIME(${now.getHours()}, ${now.getMinutes()}, ${now.getSeconds()})`;
          const nextRowIndex =
            (historySheet?.data?.[0].rowData?.length || 0) + 1;
          await sheets.spreadsheets.values.update({
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
