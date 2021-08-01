const pickValue = (
  data:
    | {
        userEnteredValue?: {
          stringValue?: string | null;
          boolValue?: boolean | null;
          numberValue?: number | null;
        };
      }
    | undefined,
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
  rowData:
    | Array<{
        values?: Array<{
          userEnteredValue?: {
            stringValue?: string | null;
            boolValue?: boolean | null;
            numberValue?: number | null;
          };
        }>;
      }>
    | undefined
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
