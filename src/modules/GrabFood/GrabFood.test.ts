import { extractMenu, extractOrders } from "./GrabFood";

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

  it("extract orders from google sheet", () => {
    expect(
      extractOrders([
        {
          values: [
            {
              userEnteredValue: {
                numberValue: 1,
              },
            },
            {
              userEnteredValue: {
                stringValue: "เจ๊เกียง - บรรทัดทอง",
              },
            },
            {
              userEnteredValue: {
                stringValue: "แกงจืดต้มบ๊วย",
              },
            },
            {
              userEnteredValue: {
                stringValue: "เต้าหู้ผัดพริกเกลือ",
              },
            },
            {
              userEnteredValue: {
                stringValue: "คอหมูแซ่บ",
              },
            },
            {
              userEnteredValue: {
                stringValue: "ข้าว",
              },
            },
          ],
        },
        {
          // no user entered info
          values: [{}],
        },
      ])
    ).toEqual([
      {
        weight: 1,
        restaurant: "เจ๊เกียง - บรรทัดทอง",
        menus: [
          { name: "แกงจืดต้มบ๊วย", options: [], note: "", quantity: 1 },
          { name: "เต้าหู้ผัดพริกเกลือ", options: [], note: "", quantity: 1 },
          { name: "คอหมูแซ่บ", options: [], note: "", quantity: 1 },
          { name: "ข้าว", options: [], note: "", quantity: 1 },
        ],
      },
    ]);
  });
});
