import { sheets_v4 } from "googleapis";

const pickValue = (
  data: sheets_v4.Schema$CellData | undefined,
  defaultValue = undefined
) => {
  if (!data || !data.userEnteredValue) return defaultValue;
  if ("stringValue" in data.userEnteredValue) {
    return data.userEnteredValue.stringValue;
  }
  if ("boolValue" in data.userEnteredValue) {
    return data.userEnteredValue.boolValue;
  }
  if ("numberValue" in data.userEnteredValue) {
    return data.userEnteredValue.numberValue;
  }
  return defaultValue;
};

export const getKeyValueMap = <T>(
  rowData: sheets_v4.Schema$GridData["rowData"]
): T => {
  const object = (rowData || []).reduce((result, { values }) => {
    const key = pickValue(values?.[0]);
    if (!key) return result;
    return {
      ...result,
      [key as string]: pickValue(values?.[1]),
    };
  }, {});
  return object as T;
};

export const findSheetByTitle = (
  spreadsheet: sheets_v4.Schema$Spreadsheet,
  title: string
) => {
  return spreadsheet.sheets?.find((s) => s.properties?.title === title);
};

export const createSpreadsheetUtils = (
  spreadsheet: sheets_v4.Schema$Spreadsheet
) => ({
  findSheetByTitle: function (title: string) {
    return spreadsheet.sheets?.find((s) => s.properties?.title === title);
  },
  findSheetById: function (id: number) {
    return spreadsheet.sheets?.find((s) => s.properties?.sheetId === id);
  },
});
