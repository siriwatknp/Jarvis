import { sheets_v4 } from "googleapis";
import { JSONObject, launch } from "puppeteer";
import { shuffle, splitByWeight, randomOneItem } from "utils/shuffle";

export interface GrabMenu {
  name: string;
  options: Array<string>;
  note: string;
  quantity: number;
}

export function getColumnDefs() {
  return {
    weight: 0,
    disabled: 1,
    restaurant: 2,
    menu: 3,
  };
}

export function randomOneOrder(
  ordersSheet: sheets_v4.Schema$Sheet | undefined,
  historySheet: sheets_v4.Schema$Sheet | undefined,
  settings: { latestRestaurantsOmitCount?: boolean }
) {
  const columnDefs = getColumnDefs();
  const grid = ordersSheet?.data?.[0].rowData;
  let data: ReturnType<typeof extractOrders> = [];
  let omittedRestaurants: Array<string> = [];

  if (grid) {
    grid.shift(); // remove header
    data = extractOrders(grid);

    omittedRestaurants = settings.latestRestaurantsOmitCount
      ? (historySheet?.data?.[0].rowData || [])
          .slice(-settings.latestRestaurantsOmitCount)
          .map(
            ({ values }) =>
              values?.[columnDefs.restaurant]?.userEnteredValue?.stringValue ||
              ""
          )
          .filter((val) => !!val)
      : [];

    data = data
      .filter(({ disabled }) => !disabled)
      .filter(({ restaurant }) => !omittedRestaurants.includes(restaurant));
  }
  return {
    result: randomOneItem(shuffle(splitByWeight(data))),
    orders: data,
    omittedRestaurants,
  };
}

export function extractOrders(grid: sheets_v4.Schema$RowData[]) {
  const column = getColumnDefs();
  return grid
    .filter(
      ({ values }) =>
        values?.[column.restaurant].userEnteredValue &&
        values?.[column.menu].userEnteredValue
    )
    .map(({ values }) => ({
      weight: values?.[column.weight].userEnteredValue?.numberValue || 1,
      disabled: values?.[column.disabled].userEnteredValue?.boolValue || false,
      restaurant:
        values?.[column.restaurant].userEnteredValue?.stringValue || "",
      menus: values
        ? values
            .slice(column.menu)
            .map((item) =>
              extractMenu(item.userEnteredValue?.stringValue || "")
            )
            .filter((item) => !!item.name)
        : [],
    }));
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
  const browser = await launch({
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

  try {
    await page.waitForXPath(`//h6[contains(., '${options.restaurant}')]`);
    const [restaurant] = await page.$x(
      `//h6[contains(., '${options.restaurant}')]`
    );
    if (restaurant) {
      console.info("Found restaurant:", options.restaurant);
      await page.waitForTimeout(1000);
      await Promise.all([
        page.waitForNavigation({
          waitUntil: ["domcontentloaded", "networkidle0"],
        }),
        restaurant.click(),
      ]);
    } else {
      throw new Error(`Cannot find the restaurant`);
    }

    // check if restaurant open
    await page.waitForTimeout(1000);
    const closed = await page.evaluate(
      () => !!document.querySelector('[class*="openHours"] [class*="closed"]')
    );
    if (closed) {
      await browser.close();
      throw new Error("restaurant is closed");
    }

    console.info("Finding menus...");
    await options.menus.reduce(async (previous, menu, index) => {
      await previous;
      await page.waitForXPath(`//h3[contains(., "${menu.name}")]`);
      const [menuHandle] = await page.$x(`//h3[contains(., "${menu.name}")]`);
      if (menuHandle) {
        if (index > 0) {
          await page.waitForTimeout(300); // Wait for the drawer to fully closed.
        }
        console.info("Found menu:", menu.name);
        await menuHandle.click();
      } else {
        throw new Error(`Cannot find the menu`);
      }

      // Drawer open
      await page.waitForXPath(`//h5[contains(., "${menu.name}")]`, {
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
      }, menu as unknown as JSONObject);

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
    }, Promise.resolve());

    await page.waitForTimeout(300); // Wait for the drawer to fully closed.
    await page.click('a[class*="FoodCartBtn"]');

    await page.waitForXPath(
      '//div[contains(@class, "ant-drawer-open")]//button[contains(., "Review Order")]',
      { visible: true }
    );
    const [reviewOrder] = await page.$x(
      '//div[contains(@class, "ant-drawer-open")]//button[contains(., "Review Order")]'
    );
    if (reviewOrder) {
      await page.waitForTimeout(300); // Wait for the drawer to fully open.
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
        await page.waitForNavigation();
        console.info("Waiting for driver...");
        await page.waitForTimeout(2000);
      }
    }
    await browser.close();
  } catch (error) {
    await browser.close();
    return Promise.reject(error);
  }
}
