import { launch } from "puppeteer";

const NPM_BASE_URL = "https://www.npmjs.com/package";

export const getNpmVersionDownload = async (
  pkg: string,
  options?: { headless?: boolean }
) => {
  const browser = await launch({
    headless: options?.headless ?? true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  await page.goto(`${NPM_BASE_URL}/${pkg}`);

  await page.click("#package-tab-versions");

  try {
    await page.click("#fake_showDeprecated");
  } catch (err) {
    console.log("#fake_showDeprecated not found.");
  }

  const data = await page.evaluate(() => {
    const headings = Array.from(document.getElementsByTagName("h3"));

    let versionHistory: HTMLHeadingElement | undefined;
    headings.forEach((node) => {
      if (node.innerText.match(/version history/i)) {
        versionHistory = node;
      }
    });

    if (versionHistory) {
      let node = versionHistory.nextElementSibling;
      while (node && node.tagName !== "UL") {
        node = node.nextElementSibling;
      }
      if (node) {
        // node is <ul>
        const list = Array.from(node.childNodes).filter(
          (node) => node.firstChild && "href" in node.firstChild
        );

        return list.map((elm) => {
          const download = (elm as Element).querySelector(
            ".downloads"
          )?.textContent;
          return {
            version: elm.firstChild?.textContent,
            download: download ? Number(download.replace(/,/g, "")) : null,
          };
        });
      }
    }
    return undefined;
  });

  await browser.close();

  return data;
};
