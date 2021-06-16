require('electron-reload')(__dirname, { ignored: /db|[\/\\]\./, argv: [] });
const { app, BrowserWindow } = require('electron');
const ipc = require('electron').ipcMain
const puppeteer = require('puppeteer');
const path = require('path');

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });
  mainWindow.loadFile(path.join(__dirname, './assets/html/index.html'));
};

app.on('ready', createWindow);

ipc.on('TESTING_1', function () {
  main()
})

async function startBrowser() {
  let browser;
  try {
    console.log("Opening the browser......");
    browser = await puppeteer.launch({
      headless: true,
      args: ["--disable-setuid-sandbox"],
      'ignoreHTTPSErrors': true
    });
  } catch (err) {
    console.log("Could not create a browser instance => : ", err);
  }
  return browser;
}

const pageScraper = {
  async scraper(browser, url) {
    let page = await browser.newPage();
    console.log(`Navigating to `+url+`...`);
    await page.goto(url);
    /*
    await page.waitForSelector('.page_inner');
    // Get the link to all the required books
    let urls = await page.$$eval('section ol > li', links => {
      // Make sure the book to be scraped is in stock
      links = links.filter(link => link.querySelector('.instock.availability > i').textContent !== "In stock")
      // Extract the links from the data
      links = links.map(el => el.querySelector('h3 > a').href)
      return links;
    });
    console.log(urls);
    */
  }
}

async function scrapeAll(browserInstance, url) {
  let browser;
  try {
    browser = await browserInstance;
    await pageScraper.scraper(browser, url);

  }
  catch (err) {
    console.log("Could not resolve the browser instance => ", err);
  }
}

function main() {
  //Start the browser and create a browser instance
  let browserInstance = startBrowser();
  let url = 'https://www.msi.com/Motherboard/support/MPG-Z590-GAMING-CARBON-WIFI#down-driver&Win10%2064'

  // Pass the browser instance to the scraper controller
  scrapeAll(browserInstance, url)
}


