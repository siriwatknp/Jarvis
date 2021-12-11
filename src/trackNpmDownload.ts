import * as functions from "firebase-functions";
import { google } from "googleapis";
import { COL } from "api/GoogleSheets";
import { getNpmVersionDownload } from "modules/npm/NpmVersionDownload";

const sheets = google.sheets("v4");

const auth = new google.auth.GoogleAuth({
  scopes: "https://www.googleapis.com/auth/spreadsheets",
});

export const trackNpmDownload = functions
  .region("asia-southeast1")
  .runWith({ memory: "1GB" })
  .https.onRequest(async (request, response) => {
    const { pkg, ggSheetId } = request.query as {
      pkg?: string;
      ggSheetId?: string;
    };

    try {
      if (!pkg) {
        throw new Error("Missing query param `pkg`");
      }

      const packages = pkg.split(",");
      const result = await Promise.all(
        packages.map((pkg) =>
          getNpmVersionDownload(
            pkg
            // { headless: false }
          )
        )
      );
      const validResult = result.filter((value) => !!value) as Required<
        typeof result
      >;
      const sortedData = validResult.reduce(
        (result, curr) => [...result, ...curr.reverse()],
        []
      );

      if (ggSheetId) {
        const authClient = await auth.getClient();
        const now = new Date();
        const sheetNames = {
          tracker: "NPM Download Tracker",
          summary: "NPM Download Summary",
        };

        const formattedNow = `=DATE(${now.getFullYear()}, ${
          now.getMonth() + 1
        }, ${now.getDate()})`;

        const spreadsheet = await sheets.spreadsheets.get({
          auth: authClient,
          spreadsheetId: ggSheetId,
        });

        let trackerSheet = spreadsheet.data.sheets?.find(
          (s) => s.properties?.title === sheetNames.tracker
        )?.properties;

        let summarySheet = spreadsheet.data.sheets?.find(
          (s) => s.properties?.title === sheetNames.summary
        )?.properties;

        if (!trackerSheet) {
          const result = await sheets.spreadsheets.batchUpdate({
            auth: authClient,
            spreadsheetId: ggSheetId,
            requestBody: {
              requests: [
                {
                  addSheet: {
                    properties: {
                      title: sheetNames.tracker,
                    },
                  },
                },
              ],
            },
          });

          trackerSheet = result.data.replies?.[0]?.addSheet?.properties;
        }

        if (!summarySheet) {
          const result = await sheets.spreadsheets.batchUpdate({
            auth: authClient,
            spreadsheetId: ggSheetId,
            requestBody: {
              requests: [
                {
                  addSheet: {
                    properties: {
                      title: sheetNames.summary,
                    },
                  },
                },
              ],
            },
          });

          summarySheet = result.data.replies?.[0]?.addSheet?.properties;

          await sheets.spreadsheets.values.append({
            auth: authClient,
            spreadsheetId: ggSheetId,
            range: `${sheetNames.summary}!B1:B`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [["Version"], [`=UNIQUE('${sheetNames.tracker}'!A2:A)`]],
            },
          });

          await sheets.spreadsheets.batchUpdate({
            auth: authClient,
            spreadsheetId: ggSheetId,
            requestBody: {
              requests: [
                {
                  addChart: {
                    chart: {
                      spec: {
                        title: "NPM Download Versions",
                        basicChart: {
                          chartType: "LINE",
                          axis: [
                            {
                              position: "BOTTOM_AXIS",
                              viewWindowOptions: {},
                            },
                            {
                              position: "LEFT_AXIS",
                              viewWindowOptions: {},
                            },
                          ],
                          domains: [
                            {
                              domain: {
                                sourceRange: {
                                  sources: [
                                    {
                                      sheetId: summarySheet?.sheetId,
                                      startRowIndex: 0,
                                      endRowIndex: 1,
                                      startColumnIndex: 1,
                                      endColumnIndex: 26,
                                    },
                                  ],
                                },
                              },
                            },
                          ],
                          series: [
                            {
                              series: {
                                sourceRange: {
                                  sources: [
                                    {
                                      sheetId: summarySheet?.sheetId,
                                      startRowIndex: 1,
                                      endRowIndex: 2,
                                      startColumnIndex: 1,
                                      endColumnIndex: 26,
                                    },
                                  ],
                                },
                              },
                              targetAxis: "LEFT_AXIS",
                              dataLabel: {
                                type: "NONE",
                                textFormat: {
                                  fontFamily: "Roboto",
                                },
                              },
                            },
                            {
                              series: {
                                sourceRange: {
                                  sources: [
                                    {
                                      sheetId: summarySheet?.sheetId,
                                      startRowIndex: 2,
                                      endRowIndex: 3,
                                      startColumnIndex: 1,
                                      endColumnIndex: 26,
                                    },
                                  ],
                                },
                              },
                              targetAxis: "LEFT_AXIS",
                              dataLabel: {
                                type: "NONE",
                                textFormat: {
                                  fontFamily: "Roboto",
                                },
                              },
                            },
                            {
                              series: {
                                sourceRange: {
                                  sources: [
                                    {
                                      sheetId: summarySheet?.sheetId,
                                      startRowIndex: 3,
                                      endRowIndex: 4,
                                      startColumnIndex: 1,
                                      endColumnIndex: 26,
                                    },
                                  ],
                                },
                              },
                              targetAxis: "LEFT_AXIS",
                              dataLabel: {
                                type: "NONE",
                                textFormat: {
                                  fontFamily: "Roboto",
                                },
                              },
                            },
                            {
                              series: {
                                sourceRange: {
                                  sources: [
                                    {
                                      sheetId: summarySheet?.sheetId,
                                      startRowIndex: 4,
                                      endRowIndex: 5,
                                      startColumnIndex: 1,
                                      endColumnIndex: 26,
                                    },
                                  ],
                                },
                              },
                              targetAxis: "LEFT_AXIS",
                              dataLabel: {
                                type: "NONE",
                                textFormat: {
                                  fontFamily: "Roboto",
                                },
                              },
                            },
                          ],
                          headerCount: 1,
                        },
                        hiddenDimensionStrategy: "SKIP_HIDDEN_ROWS_AND_COLUMNS",
                        titleTextFormat: {
                          fontFamily: "Roboto",
                        },
                        fontName: "Roboto",
                      },
                      position: {
                        overlayPosition: {
                          anchorCell: {
                            sheetId: summarySheet?.sheetId,
                            rowIndex: 8,
                          },
                          offsetXPixels: 100,
                          offsetYPixels: 1,
                          widthPixels: 909,
                          heightPixels: 371,
                        },
                      },
                    },
                  },
                },
              ],
            },
          });
        }

        /**
         * Update Row Head
         */
        await sheets.spreadsheets.values.update({
          auth: authClient,
          spreadsheetId: ggSheetId,
          range: `${trackerSheet?.title}!A2:A`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [...Array(1000)].map((_, index) => [
              `=REPLACE(B${index + 2}, 2, 20, "")`,
            ]),
          },
        });

        /**
         * Update Row Head
         */
        await sheets.spreadsheets.values.update({
          auth: authClient,
          spreadsheetId: ggSheetId,
          range: `${trackerSheet?.title}!B1`,
          valueInputOption: "RAW",
          requestBody: {
            values: [
              ["Version"],
              ...(sortedData || []).map(({ version }) => [version]),
            ],
          },
        });

        const nextColumnIndex = (
          await sheets.spreadsheets.values.get({
            auth: authClient,
            spreadsheetId: ggSheetId,
            range: `${sheetNames.tracker}!A1:ZZ1`,
          })
        ).data?.values?.[0]?.length;

        /**
         * Add data next column
         */
        if (nextColumnIndex) {
          const column = COL[nextColumnIndex];
          await sheets.spreadsheets.values.update({
            auth: authClient,
            spreadsheetId: ggSheetId,
            range: `${trackerSheet?.title}!${column}1`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [
                [formattedNow],
                ...(sortedData || []).map(({ download }) => [download]),
              ],
            },
          });

          const nextRowIndex = (
            await sheets.spreadsheets.values.get({
              auth: authClient,
              spreadsheetId: ggSheetId,
              range: `${sheetNames.summary}!B1:B`,
            })
          ).data?.values?.length;
          if (nextRowIndex) {
            await sheets.spreadsheets.values.update({
              auth: authClient,
              spreadsheetId: ggSheetId,
              range: `${summarySheet?.title}!${column}1`,
              valueInputOption: "USER_ENTERED",
              requestBody: {
                values: [
                  [formattedNow],
                  ...[...Array(nextRowIndex - 1)].map((_, index) => [
                    `=SUMIF('${sheetNames.tracker}'!$A$2:$A,$B${index + 2},'${
                      sheetNames.tracker
                    }'!${column}$2:${column})`,
                  ]),
                ],
              },
            });
          }
        }
      }

      response.send(sortedData);
    } catch (error: any) {
      response.status(400).send(error.toString());
    }
  });
