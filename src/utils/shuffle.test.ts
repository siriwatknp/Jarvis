import { splitByWeight } from "./shuffle";

describe("Utils", () => {
  it("splitByWeight", () => {
    expect(
      splitByWeight([
        { id: 1, weight: 2 },
        { id: 2, weight: 1 },
        { id: 3, weight: 0 },
      ])
    ).toEqual([
      { id: 1, weight: 2 },
      { id: 1, weight: 2 },
      { id: 2, weight: 1 },
    ]);
  });
});
