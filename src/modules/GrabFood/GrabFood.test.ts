import { extractMenu } from "./GrabFood";

describe("GrabFood Module", () => {
  it("extract menu name, options, and note", () => {
    expect(
      extractMenu(
        "SMASH DUO (-30% OFF)\n\n- Anchovies\n- Aglio & Olio Spaghetti\n\n// ไม่เอาผัก\n\n= 2"
      )
    ).toEqual({
      name: "SMASH DUO (-30% OFF)",
      options: ["Anchovies", "Aglio & Olio Spaghetti"],
      note: "ไม่เอาผัก",
      quantity: 2,
    });
  });
});
