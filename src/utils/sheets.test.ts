import { getKeyValueMap } from "./sheets";

describe("Utils", () => {
  it("getKeyValueMap", () => {
    expect(
      getKeyValueMap([
        {
          values: [
            {
              userEnteredValue: {
                stringValue: "key",
              },
            },
            {
              userEnteredValue: {
                stringValue: "value",
              },
            },
          ],
        },
        {
          values: [
            {
              userEnteredValue: {
                stringValue: "placeOrderEnabled",
              },
            },
            {
              userEnteredValue: {
                boolValue: false,
              },
            },
          ],
        },
        {
          values: [
            {
              userEnteredValue: {
                stringValue: "session",
              },
            },
            {
              userEnteredValue: {
                stringValue: "abc123",
              },
            },
          ],
        },
        {
          values: [
            {
              userEnteredValue: {
                stringValue: "location",
              },
            },
            {
              userEnteredValue: {
                stringValue: "bangkok",
              },
            },
          ],
        },
        {
          values: [
            {
              userEnteredValue: {
                stringValue: "count",
              },
            },
            {
              userEnteredValue: {
                numberValue: 0,
              },
            },
          ],
        },
      ])
    ).toEqual({
      key: "value",
      placeOrderEnabled: false,
      session: "abc123",
      location: "bangkok",
      count: 0,
    });
  });
});
