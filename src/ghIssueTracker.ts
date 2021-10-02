import * as functions from "firebase-functions";
import { GetResponseDataTypeFromEndpointMethod } from "@octokit/types";
import { Octokit } from "@octokit/rest";
import { google } from "googleapis";

const sheets = google.sheets("v4");

const auth = new google.auth.GoogleAuth({
  scopes: "https://www.googleapis.com/auth/spreadsheets",
});

const octokit = new Octokit({
  auth: functions.config().github.mui,
});

type ListForRepoResponseDataType = GetResponseDataTypeFromEndpointMethod<
  typeof octokit.issues.listForRepo
>;

function createIsLabel(startsWith: string) {
  return function (label: { name?: string } | string) {
    return (typeof label === "string" ? label : label.name ?? "").startsWith(
      startsWith
    );
  };
}

function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function productRecords(data: ListForRepoResponseDataType) {
  return data.reduce(
    (result2, current2) => [
      ...result2,
      ...(current2.closed_at
        ? (() => {
            const dup = { ...current2 }; // create another record to represent creation record
            dup.closed_at = null;
            return [dup, current2];
          })()
        : [current2]),
    ],
    [] as ListForRepoResponseDataType
  );
}

/**
 * query x issues and then order by created_date and build a table
 */
export const ghIssueTracker = functions
  .region("asia-southeast1")
  .https.onRequest(async (request, response) => {
    const { headers } = request;
    if (
      headers.authorization !==
      `Basic ${functions.config().authorization.ghissuetracker}`
    ) {
      response.status(401).send("❌ Unauthorized!");
      return;
    }
    const { initTotalPage, ggSheetId } = request.query as {
      initTotalPage?: number;
      ggSheetId?: string;
    };

    const config = {
      owner: "mui-org",
      repo: "material-ui",
      per_page: 100,
      state: "all",
      sort: "updated",
    } as const;

    let data: ListForRepoResponseDataType = [];

    if (initTotalPage && Number(initTotalPage)) {
      const res = await Promise.all(
        [...Array(Number(initTotalPage))].map((_, index) =>
          octokit.rest.issues.listForRepo({
            ...config,
            page: index + 1,
          })
        )
      );
      data = res.reduce(
        (result, current) => [...result, ...productRecords(current.data)],
        [] as ListForRepoResponseDataType
      );
    } else {
      const res = await octokit.rest.issues.listForRepo(config);
      data = productRecords(
        res.data.filter(({ created_at }) =>
          isSameDay(new Date(created_at), new Date())
        )
      );
    }

    const isStatusLabel = createIsLabel("status:");
    const isComponentLabel = createIsLabel("component:");
    const isPackageLabel = createIsLabel("package:");

    function isTypeLabel(label: { name?: string } | string) {
      return (
        !isStatusLabel(label) &&
        !isComponentLabel(label) &&
        !isPackageLabel(label)
      );
    }

    function getFirstLabel(label: { name?: string } | string | undefined) {
      if (!label) return "";
      return (typeof label === "string" ? label : label.name ?? "").replace(
        /(^status: |^component: |^package: )/,
        ""
      );
    }

    const table = data
      .map(
        ({
          number,
          user,
          title,
          labels,
          state,
          created_at,
          updated_at,
          pull_request,
          closed_at,
          html_url,
        }) => {
          return {
            link: html_url,
            number,
            title,
            username: user?.login || null,
            type: getFirstLabel(labels.find(isTypeLabel)),
            status: getFirstLabel(labels.find(isStatusLabel)),
            component: getFirstLabel(labels.find(isComponentLabel)),
            package: getFirstLabel(labels.find(isPackageLabel)),
            recorded_at: new Date(closed_at || created_at).toDateString(),
            recorded_state: closed_at ? "closed" : "open",
            state,
            created_at: new Date(created_at).toDateString(),
            updated_at: new Date(updated_at).toDateString(),
            closed_at: closed_at ? new Date(closed_at).toDateString() : null,
            pull_request: !!pull_request,
          };
        }
      )
      .sort(
        (a, b) =>
          new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      );

    if (!ggSheetId) {
      throw new Error("Missing query param `ggSheetId`");
    }

    const authClient = await auth.getClient();
    const sheetName = "Github Issues Data";

    const spreadsheet = await sheets.spreadsheets.get({
      auth: authClient,
      spreadsheetId: ggSheetId,
    });

    let sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === sheetName
    )?.properties;

    if (!sheet) {
      const result = await sheets.spreadsheets.batchUpdate({
        auth: authClient,
        spreadsheetId: ggSheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
      });

      sheet = result.data.replies?.[0]?.addSheet?.properties;
    }

    await sheets.spreadsheets.values.append({
      auth: authClient,
      spreadsheetId: ggSheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: table.map((object) =>
          Object.entries(object).map(([_, value]) => value)
        ),
      },
    });

    response.send("Done!");
  });
