import * as functions from "firebase-functions";
import { google } from "googleapis";
import { extractMenu, placeOrder } from "./modules/GrabFood";

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
    };
    if (ggSheetId) {
      const spreadsheet = await sheets.spreadsheets.get({
        auth: authClient,
        spreadsheetId: ggSheetId,
        includeGridData: true,
      });

      const ordersSheet = spreadsheet.data.sheets?.find(
        (s) => s.properties?.title === sheetNames.orders
      );

      const grid = ordersSheet?.data?.[0].rowData;

      if (grid) {
        grid.shift(); // remove header
        const data = grid.map(({ values }) => {
          return {
            restaurant: values?.[0].userEnteredValue?.stringValue || "",
            menus: values
              ? values.map((item) =>
                  extractMenu(item.userEnteredValue?.stringValue || "")
                )
              : [],
          };
        });

        await placeOrder({
          headleass: true,
          session: "",
          location: "",
          restaurant: data[0].restaurant,
          menus: data[0].menus,
        });
      }
    } else {
      response.status(400).send("`ggSheetId` query param is required.");
    }
  });
