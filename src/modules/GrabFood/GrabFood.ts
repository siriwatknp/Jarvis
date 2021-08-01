import * as puppeteer from "puppeteer";

export interface GrabMenu {
  name: string;
  options: Array<string>;
  note: string;
  quantity: number;
}

export function extractOrders(
  grid: any
): Array<{ weight: number; restaurant: string; menus: Array<GrabMenu> }> {
  return grid
    .filter(
      ({ values }: { values: any }) =>
        values[1]?.userEnteredValue && values[2]?.userEnteredValue
    )
    .map(({ values }: { values: any }) => {
      return {
        weight: values?.[0].userEnteredValue?.numberValue,
        restaurant: values?.[1].userEnteredValue?.stringValue || "",
        menus: values
          ? values
              .slice(2)
              .map((item: any) =>
                extractMenu(item.userEnteredValue?.stringValue || "")
              )
          : [],
      };
    });
}

export function extractMenu(menu: string): GrabMenu {
  const lines = menu.split("\n").filter((str) => !!str);
  const name = lines.shift() || "";
  const options: Array<string> = [];
  const note: Array<string> = [];
  let quantity = 1;
  lines.forEach((l) => {
    if (l.startsWith("-")) {
      options.push(l.replace("-", "").trim());
    }
    if (l.startsWith("//")) {
      note.push(l.replace("//", "").trim());
    }
    if (l.startsWith("=")) {
      quantity = Number(l.replace("=", "").trim()) || 1;
    }
  });
  return { name, options, note: note.join(" "), quantity };
}

export interface PlaceOrderOptions {
  headleass: boolean;
  dryrun: boolean;
  session: string;
  location: string;
  restaurant: string;
  menus: Array<GrabMenu>;
}

export async function placeOrder(options: PlaceOrderOptions): Promise<void> {
  const browser = await puppeteer.launch({
    headless: options.headleass || false,
    defaultViewport: { width: 1024, height: 600 },
  });
  const page = await browser.newPage();
  await page.setCookie(
    {
      domain: "food.grab.com",
      name: "gfc_session",
      // outdated token will get 401 when access specific restaurant.
      value: options.session,
    },
    {
      domain: "food.grab.com",
      name: "location",
      value: options.location,
    }
  );
  await page.goto(
    `https://food.grab.com/th/en/restaurants?search=${options.restaurant}`
  );

  await page.waitForXPath(`//h6[contains(., '${options.restaurant}')]`);
  const [restaurant] = await page.$x(
    `//h6[contains(., '${options.restaurant}')]`
  );
  if (restaurant) {
    console.info("Found restaurant:", options.restaurant);
    await page.waitForTimeout(500); // prevent not found, may be the page needs to load something first.
    await restaurant.click();
  } else {
    throw new Error(`Cannot find the restaurant`);
  }

  console.info("Finding menus...");
  await Promise.all(
    options.menus.map(async (menu) => {
      await page.waitForXPath(`//h3[contains(., '${menu.name}')]`);
      const [menuHandle] = await page.$x(`//h3[contains(., '${menu.name}')]`);
      if (menuHandle) {
        console.info("Found menu:", menu.name);
        await menuHandle.click();
      } else {
        throw new Error(`Cannot find the menu`);
      }

      // Drawer open
      await page.waitForXPath(`//h5[contains(., '${menu.name}')]`, {
        visible: true,
      });
      // Choose options
      await Promise.all(
        menu.options.map(async (opt) => {
          console.info("Picking option:", opt);
          return await page.evaluate((optEval) => {
            const labels = document.querySelectorAll(
              'label[class*="inputItem"]'
            );
            labels.forEach((label) => {
              if (label.textContent?.startsWith(optEval)) {
                (label as HTMLElement).click();
              }
            });
          }, opt);
        })
      );

      // Note
      if (menu.note) {
        console.info("Filling note...");
        await page.type(".ant-drawer-open textarea", menu.note);
      }

      // Quantity
      await page.waitForXPath("//a[contains(@class, 'quantityButton')]");
      console.info("Adjusting quantity to:", menu.quantity);
      await page.evaluate((menuEval) => {
        const buttons = document.querySelectorAll(
          'div[class*="ant-drawer-open"] a[class*="quantityButton"]'
        );
        const increase = buttons[1] as HTMLButtonElement;
        if (increase && menuEval.quantity > 1) {
          [...Array(menuEval.quantity - 1)].forEach(() => {
            increase.click();
          });
        }
      }, menu as unknown as puppeteer.JSONObject);

      const [addToBaseket] = await page.$x(
        "//button[contains(., 'Add to Basket')]"
      );
      if (addToBaseket) {
        console.info("Adding to Basket...");
        await page.waitForTimeout(300);
        await addToBaseket.click();
        await page.waitForSelector(".ant-drawer-open", { hidden: true });
      }
      return Promise.resolve();
    })
  );

  await page.waitForTimeout(300);
  await page.click('a[class*="FoodCartBtn"]');

  await page.waitForXPath(
    '//div[contains(@class, "ant-drawer-open")]//button[contains(., "Review Order")]',
    { visible: true }
  );
  const [reviewOrder] = await page.$x(
    '//div[contains(@class, "ant-drawer-open")]//button[contains(., "Review Order")]'
  );
  if (reviewOrder) {
    await page.waitForTimeout(300);
    await reviewOrder.click();
  } else {
    throw new Error("Cannot find `Review Order` button");
  }

  await page.waitForNavigation();
  console.info("Checking out...");

  // checkout
  await page.waitForSelector("#payment");
  await page.evaluate(() => {
    const payment = document.getElementById("payment");
    (payment?.firstChild as HTMLElement).click();
  });
  console.info("Changing payment method to Credit Card...");
  await page.evaluate(() => {
    const list = document.querySelector("ul.ant-select-dropdown-menu");
    list?.childNodes.forEach((node) => {
      if (node && node.textContent === "6712") {
        (node as HTMLElement).click();
      }
    });
  });

  await page.waitForTimeout(2000);

  await page.waitForXPath('//button[contains(., "Place Order")]', {
    visible: true,
  });
  const [checkoutButton] = await page.$x(
    '//button[contains(., "Place Order")]'
  );
  await page.evaluate(() => window.scroll(0, 800));
  if (checkoutButton) {
    console.info("Placing order...");
    if (options.dryrun) {
      console.log("🍽 Congrat! Enjoy your food.");
    } else {
      await checkoutButton.click();
    }
  }

  await browser.close();
}
