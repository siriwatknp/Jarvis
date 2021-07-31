import * as puppeteer from "puppeteer";

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1024, height: 600 },
    });
    const page = await browser.newPage();
    await page.setCookie(
      {
        domain: "food.grab.com",
        name: "gfc_session",
        // outdated token will get 401 when access specific restaurant.
        value:
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJub25jZSI6ImxQSjgyeWo5QXNiV1pUc3AiLCJzdGF0ZSI6ImhWVEpEZHoiLCJjb2RlVmVyaWZpZXIiOiJzb0x3bWJnbTVYUzA2Y0dRQ0k0NW80UE5WYU55WklyYnpWekVqdXZ0ME9WTjM0SGE1eTFRcmlDSzNPbVRLNGZCIiwiYWNjZXNzVG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0ltdHBaQ0k2SWw5a1pXWmhkV3gwSWl3aWRIbHdJam9pU2xkVUluMC5leUpoZFdRaU9pSTBaR1JtTnpoaFpHVTRNekkwTkRZeU9UZzRabVZqTldKbVl6VTROelJqTWlJc0ltRjFkR2hmZEdsdFpTSTZNVFl5TnpZNU9EazBOeXdpWlhod0lqb3hOakkzTnpNME9UVXdMQ0pwWVhRaU9qRTJNamMyT1RnNU5UQXNJbWx6Y3lJNkltaDBkSEJ6T2k4dmFXUndMbWR5WVdJdVkyOXRJaXdpYW5ScElqb2lPVzVMTlY5SkxXdFNVVFpyZFhsd2JHTkNiMFp3VVNJc0ltNWlaaUk2TVRZeU56WTVPRGMzTUN3aWNHbGtJam9pTlRWbFlqYzBOMkV0T1dOa1pTMDBZVEE1TFdFMk1tTXROVGN4TWpaa01HRTVZamRoSWl3aWMyTndJam9pVzF3aWIzQmxibWxrWENJc1hDSndjbTltYVd4bExuSmxZV1JjSWl4Y0lqazFNREkxWmprM1ltTmxNalJsWlRWaVpXSXpaakV4TnpobE9URmtZelJsWENJc1hDSmhaRGRpTkRnMlpXSTRaamcwTkRKaFltWTFPRFpsTUdRMFl6TmtaV1l3TUZ3aUxGd2lNREZpTUdOaU5qZzFNMkUwTkRWallUbGhaV1ptWWprNE9UVTVZbVZtTldaY0lsMGlMQ0p6ZFdJaU9pSXhNMkkwT1RCa1l5MHhOMll6TFRSaE9HTXRPVEJrWVMwME5HWTNNbVUyWlRBelkyRWlMQ0p6ZG1NaU9pSlFRVk5UUlU1SFJWSWlMQ0owYTE5MGVYQmxJam9pWVdOalpYTnpJbjAuc3luOExQNWdzU0tmelZYMjdFQkEydG1aQUhSNGdWNjdmOVFvcUtBRWxFTFpWTXZiUFlqc2QyR2JPcDlBazVEcnlBVnJLbXZNb003TEp3Yk9TbjdWeVdSV0VHQ0xvRjVvWkVPeHh3NzNRRkxoNGNBdDNkdEo0cDFObU5xMDdjcTRFZkJQVUdSRmhXSGhWNmVOLVBWT3psQ0N4cS1YMHlibi00NzRua3ZLbEZXdTIxemRBNDNVSXBUbjlrQTVDSDdIUXRldm9CTnlBVkZLVkFiYlhCV1Q2TEtYdllOQ0RnVUVyZjBJclFxUm9OSjVsRENQLWRWWFVfOWJOWnlXTEdrX3VORFRUVmxVUjBmUXhHbVRiQ2QxZnFHN2NXLXlneFo1VVZUM2RfYW9DWXpYdkE1OEEwQ2ZDNjNxSFpMakJZYmJmamN1d3lMOXF4d2puNFI1WVp3Z0xnIiwiaWRUb2tlbiI6ImV5SmhiR2NpT2lKU1V6STFOaUlzSW10cFpDSTZJbDlrWldaaGRXeDBJaXdpZEhsd0lqb2lTbGRVSW4wLmV5SmhZM0lpT2lKYlhDSnpaWEoyYVdObE9sQkJVMU5GVGtkRlVsd2lYU0lzSW1GMFgyaGhjMmdpT2lKbE5tZGFOMFZHTTBOTGRWVklTRVIxY0ZSUVFUQm5JaXdpWVhWa0lqb2lOR1JrWmpjNFlXUmxPRE15TkRRMk1qazRPR1psWXpWaVptTTFPRGMwWXpJaUxDSmhkWFJvWDNScGJXVWlPakUyTWpjMk9UZzVORGNzSW1WNGNDSTZNVFl5TnprMU9ERTFNQ3dpYVdGMElqb3hOakkzTmprNE9UVXdMQ0pwYzNNaU9pSm9kSFJ3Y3pvdkwybGtjQzVuY21GaUxtTnZiU0lzSW1wMGFTSTZJbFUwWldGalQwZHdVbkpwYW5SYVdFVTVOMXBmWVhjaUxDSnVZbVlpT2pFMk1qYzJPVGc1TlRBc0ltNXZibU5sSWpvaWJGQktPREo1YWpsQmMySlhXbFJ6Y0NJc0luQnBaQ0k2SWpVMVpXSTNORGRoTFRsalpHVXROR0V3T1MxaE5qSmpMVFUzTVRJMlpEQmhPV0kzWVNJc0luTjFZaUk2SWpFellqUTVNR1JqTFRFM1pqTXROR0U0WXkwNU1HUmhMVFEwWmpjeVpUWmxNRE5qWVNJc0luTjJZeUk2SWxCQlUxTkZUa2RGVWlJc0luUnJYM1I1Y0dVaU9pSnBaQ0o5Lnl1ZWVXdUNNbkZBZlZPVWhhRVVyZnF6UE9yU04wU3pqZ3VXcloxN0Z1R0dkOWU4cEllaTNBN3R6MXotbVh6ZDJrcUdFemd1SHk3ZVJlMUtwbzc2Y2JIaTJXZUtRVUsxaUU0ckFvZFN2NEViZnNJVEJJWm1lWjVCTDkzaGRQUFlYV3RjUzVtQ1RTZG9WdjhISjhaQWRaUWZ0NUxsR2VTc0EyZXVRNENKQ2dONUUyUzcyaTdJWl9ib0hyMUVqbnJDamdubVhESm9ocU53RExCUmd3bWJqSlNFUjk3aW52dVI2dWx3cHE5UUZrd012VDR0SFh0WkRGemhWYVV0MzVSbGRnS2dmVGMzSVlXaUNNVFRXY2dYeHlGUkExZ2FpdnVqd3ZyajFuMUwwV2lpWkNtRkd1Z0JXT3hUVTdSdnNJcC16Q1BnVDViTXZYU3A5UFl6WDAyM0NpdyIsInN1Y2Nlc3NSZWRpcmVjdCI6Imh0dHBzOi8vZm9vZC5ncmFiLmNvbS90aC9lbi9yZXN0YXVyYW50cyIsImZhaWx1cmVSZWRpcmVjdCI6Imh0dHBzOi8vZm9vZC5ncmFiLmNvbS90aC9lbi9yZXN0YXVyYW50cyIsIm5hbWUiOiLguKjguLTguKPguLTguKfguLHguIrguKPguYwg4LiE4Li44LiT4Liy4Lie4LijIiwic2FmZUlkIjoiZjc5ZTgxODQtMTE4YS00ZmIzLTlhYjMtNDgyMzlmZDM0YzNiIiwic2Vzc2lvbktleSI6IjRiODc4NjhkYTU2YTIzN2UxZWRhNjA3ZjE0NTlhZDU3In0.y2MUcDy-_ITQOWq6bDrlgWS_TNp6er29i12rUyXagzE",
      },
      {
        domain: "food.grab.com",
        name: "location",
        value:
          "%7B%22id%22%3A%22IT.0188U54SKD7C4%22%2C%22latitude%22%3A13.748782%2C%22longitude%22%3A100.562916%2C%22address%22%3A%22Q%20Asoke%20-%20Phetchaburi%20Rd%2C%20Bangkok%2C%20Ratchathewi%2C%20Makkasan%2C%20Bangkok%2C%20Thailand%2C%2010400%2C%20Thailand%22%2C%22countryCode%22%3A%22TH%22%2C%22isAccurate%22%3Atrue%2C%22addressDetail%22%3A%22%22%2C%22noteToDriver%22%3A%22%22%2C%22city%22%3A%22Bangkok%22%2C%22cityID%22%3A5%7D",
      }
    );
    await page.goto(
      "https://food.grab.com/th/en/restaurants?search=เล็กใหญ่-ก๋วยเตี๋ยวต้มยำโบราณ-grabkitchen-ทองหล่อ"
    );

    await page.waitForXPath(
      "//h6[contains(., 'เล็กใหญ่ ก๋วยเตี๋ยวต้มยำโบราณ')]"
    );
    const [restaurant] = await page.$x(
      "//h6[contains(., 'เล็กใหญ่ ก๋วยเตี๋ยวต้มยำโบราณ')]"
    );
    if (restaurant) {
      await restaurant.click();
    } else {
      throw new Error(`Cannot find the restaurant`);
    }

    await page.waitForXPath("//h3[contains(., 'เกี๊ยวอวบทอดต้มยำแห้ง')]");
    const [menu] = await page.$x("//h3[contains(., 'เกี๊ยวอวบทอดต้มยำแห้ง')]");
    if (menu) {
      await menu.click();
    } else {
      throw new Error(`Cannot find the menu`);
    }

    await page.waitForXPath("//a[contains(@class, 'quantityButton')]");
    await page.evaluate(() => {
      const buttons = document.querySelectorAll(
        'div[class*="ant-drawer-open"] a[class*="quantityButton"]'
      );
      const increase = buttons[1] as HTMLButtonElement;
      if (increase) {
        increase.click();
        increase.click();
        increase.click();
      }
    });

    const [addToBaseket] = await page.$x(
      "//button[contains(., 'Add to Basket')]"
    );
    if (addToBaseket) {
      await page.waitForTimeout(300);
      await addToBaseket.click();
      await page.waitForSelector(".ant-drawer-open", { hidden: true });
    }

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
      reviewOrder.click();
    } else {
      throw new Error("Cannot find `Review Order` button");
    }

    await page.waitForNavigation();

    // checkout
    await page.waitForSelector("#payment");
    await page.evaluate(() => window.scroll(0, 800));
    await page.evaluate(() => {
      const payment = document.getElementById("payment");
      (payment?.firstChild as HTMLElement).click();
    });
    await page.evaluate(() => {
      const list = document.querySelector("ul.ant-select-dropdown-menu");
      list?.childNodes.forEach((node) => {
        if (node && node.textContent === "6712") {
          (node as HTMLElement).click();
        }
      });
    });
    await page.evaluate(() => window.scroll(0, 800));

    await page.waitForTimeout(2000);

    await page.waitForXPath('//button[contains(., "Place Order")]', {
      visible: true,
    });
    const [checkoutButton] = await page.$x(
      '//button[contains(., "Place Order")]'
    );
    await page.evaluate(() => window.scroll(0, 800));
    if (checkoutButton) {
      await page.evaluate(() => window.alert("🍽 Congrat! Enjoy your food."));
      console.log("🍽 Congrat! Enjoy your food.");
    }

    await page.waitForTimeout(10000);
    await browser.close();
  } catch (error) {
    console.log(error);
  }
})();
