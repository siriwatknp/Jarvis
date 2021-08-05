import { extractMenu, extractOrders, getValidOrders } from "./GrabFood";

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
                boolValue: false,
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
        disabled: false,
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

  it("getValidOrders", () => {
    const result = getValidOrders(
      {
        data: [
          {
            rowData: [
              {
                values: [
                  {
                    userEnteredValue: {
                      stringValue: "weight",
                    },
                  },
                  {
                    userEnteredValue: {
                      stringValue: "disabled",
                    },
                  },
                  {
                    userEnteredValue: {
                      stringValue: "restaurant",
                    },
                  },
                  {
                    userEnteredValue: {
                      stringValue: "menu1",
                    },
                  },
                  {
                    userEnteredValue: {
                      stringValue: "menu2",
                    },
                  },
                  {
                    userEnteredValue: {
                      stringValue: "menu3",
                    },
                  },
                  {
                    userEnteredValue: {
                      stringValue: "menu4",
                    },
                  },
                ],
              },
              {
                values: [
                  {},
                  {
                    userEnteredValue: {
                      boolValue: false,
                    },
                  },
                  {
                    userEnteredValue: {
                      stringValue: "Ms Maria & Mr Singh - เอกมัย ซอย 6",
                    },
                  },
                  {
                    userEnteredValue: {
                      stringValue:
                        "Chicken Tikka Masala\n\n- Free Bread\n\n// ขอโรตีอย่างเดียว",
                    },
                  },
                  {
                    userEnteredValue: {
                      stringValue:
                        "Gaggan's Crab Curry\n\n- Free Bread\n\n// ขอโรตีอย่างเดียว",
                    },
                  },
                  {
                    userEnteredFormat: {
                      wrapStrategy: "WRAP",
                    },
                  },
                  {
                    userEnteredFormat: {
                      wrapStrategy: "WRAP",
                    },
                  },
                ],
              },
              {
                values: [
                  {},
                  {
                    userEnteredValue: {
                      boolValue: false,
                    },
                  },
                  {
                    userEnteredValue: {
                      stringValue: "Bang Bang Burgers",
                    },
                  },
                  {
                    userEnteredValue: {
                      stringValue:
                        "SMASH DUO (-30% OFF)\n\n- Sprite\n- No Onions for  Both Burgers\n- No Pickles for 1 Burger\n- Beef Patty for Both Burgers",
                    },
                  },
                ],
              },
              {
                values: [
                  {
                    userEnteredFormat: {
                      horizontalAlignment: "LEFT",
                      wrapStrategy: "WRAP",
                    },
                  },
                  {
                    userEnteredValue: {
                      boolValue: false,
                    },
                  },
                  {
                    userEnteredValue: {
                      stringValue:
                        "El Toro House of Meat (เอลโทโรเฮ้าส์ออฟมีท) - ถนนสุขุมวิท",
                    },
                  },
                  {
                    userEnteredValue: {
                      stringValue: "Rib Eye Grass-fed 250g NZ\n\n=2",
                    },
                  },
                ],
              },
              {
                values: [
                  {
                    userEnteredFormat: {
                      horizontalAlignment: "LEFT",
                      wrapStrategy: "WRAP",
                    },
                  },
                  {
                    userEnteredValue: {
                      boolValue: false,
                    },
                  },
                  {
                    userEnteredValue: {
                      stringValue:
                        "Texas Chicken (เท็กซัส ชิคเก้น) - อาคารบีบี อโศก",
                    },
                  },
                  {
                    userEnteredValue: {
                      stringValue: "ชุดอิ่มคุ้ม 2\n\n// น่องและสะโพก",
                    },
                  },
                  {
                    userEnteredValue: {
                      stringValue: "ช็อกโกแล็ตชิพ มินิบิสกิต 5 ชิ้น",
                    },
                  },
                  {
                    userEnteredValue: {
                      stringValue: "ฮันนีบัตเตอร์บิสกิต 1 ชิ้น",
                    },
                  },
                  {
                    userEnteredFormat: {
                      wrapStrategy: "WRAP",
                    },
                  },
                ],
              },
              {
                values: [
                  {},
                  {
                    userEnteredValue: {
                      boolValue: false,
                    },
                  },
                  {
                    userEnteredValue: {
                      stringValue: "KFC (เคเอฟซี) - มิดทาวน์ อโศก",
                    },
                  },
                  {
                    userEnteredValue: {
                      stringValue:
                        "ไก่ได้ใจ\n\n- เฟรนช์ฟรายส์ ปกติ 1 กล่อง\n- ไก่วิงซ์แซ่บ 2 ชิ้น\n\n// ขอน่องกับสะโพก",
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        data: [
          {
            rowData: [
              {
                values: [
                  {},
                  {
                    userEnteredValue: {
                      stringValue: "KFC (เคเอฟซี) - มิดทาวน์ อโศก",
                    },
                  },
                ],
              },
              {
                values: [
                  {},
                  {
                    userEnteredValue: {
                      stringValue: "Bang Bang Burgers",
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      { latestRestaurantsOmitCount: 2 }
    );
    expect(result.omittedRestaurants).toEqual([
      "KFC (เคเอฟซี) - มิดทาวน์ อโศก",
      "Bang Bang Burgers",
    ]);
    expect(result.orders.map(({ restaurant }) => restaurant)).toEqual([
      "Ms Maria & Mr Singh - เอกมัย ซอย 6",
      "El Toro House of Meat (เอลโทโรเฮ้าส์ออฟมีท) - ถนนสุขุมวิท",
      "Texas Chicken (เท็กซัส ชิคเก้น) - อาคารบีบี อโศก",
    ]);
  });
});
