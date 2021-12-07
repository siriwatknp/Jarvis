import { BASE_COL, COL } from "./GoogleSheets";

describe("GoogleSheets", () => {
  it("BASE_COL should have 26 indexes", () => {
    expect(BASE_COL.length).toEqual(26);
  });

  it("COL should have 26 indexes", () => {
    expect(COL.length).toEqual(26 * 26 + 26);
  });

  it("COL should have [A, ..., ZZ]", () => {
    expect(COL[0]).toEqual("A");
    expect(COL.slice(-1)[0]).toEqual("ZZ");
  });
});
