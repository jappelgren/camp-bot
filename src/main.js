import puppeteer from "puppeteer";
import * as schedule from "node-schedule";
import dotenv from 'dotenv';

dotenv.config();
const cronExpression = process.env.CRON_EXPRESSION;

const createBrowser = async () => {
  const campGroundId = process.env.CAMP_GROUND_ID;
  const userName = process.env.USER_NAME;
  const pwd = process.env.PASSWORD;

  const browser = await puppeteer.launch({ headless: false, });
  const incognito = await browser.createIncognitoBrowserContext();
  const page = await incognito.newPage();
  await page.setViewport({ width: 1920, height: 1080 })

  await page.goto(`https://www.recreation.gov/camping/campgrounds/${campGroundId}`);
  // Login
  const loginBtn = '#ga-global-nav-log-in-link';
  await page.waitForSelector(loginBtn);
  await page.click(loginBtn);

  const emailInput = '#email';
  const pwdInput = '#rec-acct-sign-in-password';
  const loginSubmitBtn = '.rec-acct-sign-in-btn'

  await page.waitForSelector(emailInput);
  await page.type(emailInput, userName);
  await page.type(pwdInput, pwd);
  await page.click(loginSubmitBtn);

  schedule.scheduleJob('reserveCampsite', cronExpression, () => reserveCampSite(browser, page));
}

const reserveCampSite = async (browser, page) => {
  const checkInDate = process.env.CHECK_IN_DATE;
  const checkOutDate = process.env.CHECK_OUT_DATE;

  await page.reload()

  // Filter sites
  const listViewButton = '.campsite-list-button-toggle'
  const checkInFilterInput = '#startDate';
  const checkOutFilterInput = '#endDate';

  await page.waitForSelector(listViewButton);
  await page.click(listViewButton);

  await page.waitForSelector(checkInFilterInput);
  await page.type(checkInFilterInput, checkInDate);
  await page.type(checkOutFilterInput, checkOutDate);

  //Find available camp sites
  const paginationList = '.rec-pagination'

  await page.waitForSelector(paginationList);
  const pages = await page.$$(`${paginationList} > li`);
  const pageNumbers = [];

  for (const [i, el] of pages.entries()) {
    const pgNum = await el.$eval('li > button', el => el.textContent);
    if (i > 0 && i < pages.length - 1) {
      pageNumbers.push(+pgNum);
    }
  }

  const nextPageButton = 'button[aria-label="Go to next page"]';

  let curPage = pageNumbers[0];
  const lastPage = pageNumbers[pageNumbers.length - 1];
  let addedToCart = false;

  while (curPage < lastPage) {
    // Create array of available sites on current page
    const availableSites = await page.$$('.campsite-search-card-column')
    for (const site of availableSites) {
      if (site.$eval('span', el => el.textContent) !== 'Accessible') {
        const addToCartButton = (await site.$eval('button', el => el.className)).includes('list-map-book-now-button-tracker')
          ? await site.$('.list-map-book-now-button-tracker')
          : ''
        if (addToCartButton) {
          await addToCartButton.click();
          await page.waitForSelector('.rec-order-detail-page-title')
          addedToCart = true;
          console.log('Camp site added to cart.')
          break;
        }
      }
    }

    if (addedToCart) {
      break;
    }

    await page.click(nextPageButton)
    curPage++
    await page.waitForSelector(`button[aria-label="Current page, page ${curPage}"]`);
  }

  if (!addedToCart) {
    console.log('No camp sites found today, will try again tomorrow.');
    await browser.close();
    return;
  }

  await browser.disconnect();
  console.log('If this site works for you make sure to stop the application AFTER checking out to avoid adding additional campsites to your cart tomorrow.');
  console.log('Stopping the application before you checkout will close the browser. But the site should still be in your cart if you reopen the page in a regular browser.');
}

console.log('Application started')

const subtractMinuteFromCron = (cronExpression) => {
  const splitExpression = cronExpression.split(' ')
  if (+splitExpression[0] === 0) {
    splitExpression[0] = 59
    splitExpression[1] = +splitExpression[1] - 1
  } else {
    splitExpression[0] = +splitExpression[0] - 1
  }
  return `${splitExpression[0]} ${splitExpression[1]} ${splitExpression[2]} ${splitExpression[3]} ${splitExpression[4]}`
}

schedule.scheduleJob('openBrowser', subtractMinuteFromCron(cronExpression), createBrowser);