const fs = require("fs");
const puppeteer = require("puppeteer");
const ObjectsToCsv = require("objects-to-csv");

const link =
  "https://affiliate-program.amazon.com/home/promohub/promocodes?ac-ms-src=nav&type=mpc&active_date_range=0";

const browserURL =
  "ws://127.0.0.1:9222/devtools/browser/ae582555-1127-4c2c-9183-759f6f76b37b";

(async () => {
  const browser = await puppeteer.connect({ browserWSEndpoint: browserURL });
  const page = await browser.newPage();
  await page.setViewport({ width: 1360, height: 768 });
  console.log("Start");
  await page.goto(link, { timeout: 0 });
  const results = await scrapeInfiniteScrollItems(page, extractItems, 1000);
  const csv = new ObjectsToCsv(results);
  await csv.toDisk("./test.csv");
  console.log("Success");
})();

function extractItems() {
  const extractedElements = document.querySelectorAll(
    '[class*="search-result-item promo-item-display"]'
  );
  let results = [];
  for (let element of extractedElements) {
    const rawData = element.querySelector("a").innerText;
    const promoCode = rawData.match(/code\s[0-9A-Z]*/g)[0].split(" ")[1];
    const link = element.querySelector("a").href;
    results.push({ code: promoCode, link: link });
  }
  return results;
}

async function scrapeInfiniteScrollItems(
  page,
  extractItems,
  itemTargetCount,
  scrollDelay = 1000
) {
  let items = [];
  try {
    let previousHeight;
    while (items.length < itemTargetCount) {
      items = await page.evaluate(extractItems);
      previousHeight = await page.evaluate("document.body.scrollHeight");
      await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
      await page.waitForFunction(
        `document.body.scrollHeight > ${previousHeight}`
      );
      await page.waitForTimeout(scrollDelay);
    }
  } catch (e) {}
  return items;
}
