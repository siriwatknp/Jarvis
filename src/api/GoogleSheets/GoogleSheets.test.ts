import { COL } from "./GoogleSheets";

describe("GoogleSheets", () => {
  it("COL should have [A, ..., ZZ]", () => {
    expect(COL[0]).toEqual("A");
    expect(COL.slice(-1)[0]).toEqual("ZZ");
  });
});
