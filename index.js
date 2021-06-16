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
    console.log(`Navigating to ` + url + `...`);
    await page.goto(url);

    await page.waitForSelector('.hvr-bob');
    //finds all links
    const hrefs = await page.$$eval('a', as => as.map(a => a.href)
      .filter(href => href.includes('https://download.msi.com/dvr_exe/'))
    );
    console.log(hrefs);
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

//child exec wmic baseboard get product,Manufacturer for mb
