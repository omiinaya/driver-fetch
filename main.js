require('electron-reload')(__dirname, { ignored: /db|[\/\\]\./, argv: [] });
const { app, BrowserWindow } = require('electron');
const { execSync } = require('child_process')
const ipc = require('electron').ipcMain
const puppeteer = require('puppeteer');
const path = require('path');

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 200,
    webPreferences: {
      nodeIntegration: true
    }
  });
  mainWindow.loadFile(path.join(__dirname, './assets/html/index.html'));
};

const pageScraper = {
  async scraper(browser, url) {
    let page = await browser.newPage();
    console.log(`Navigating to ` + url + `...`);
    await page.goto(url);
    //MSI
    scrapeMSI(page)
    //ASROCK
    //scrapeASROCK(page)
    //GIGABYTE
    //scrapeGIGABYTE(page)
    //ASUS
    //scrapeASUS(page)
  }
}

async function scrapeMSI(page) {
  await page.waitForSelector('.hvr-bob');
  const hrefs = await page.$$eval('a', as => as.map(a => a.href)
    .filter(href => href.includes('https://download.msi.com/dvr_exe/'))
  );
  console.log(hrefs);
}

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
  //start the browser and create a browser instance
  let browserInstance = startBrowser();
  let a = 'MPG-Z590-GAMING-CARBON-WIFI' //testing variable.
  let url = craftURL(a)
  
  console.log(getMBInfo(a))
  console.log(parseDash(a))
  console.log(parsePercent(a))
  console.log(getCPUInfo())
  console.log(getManufacturer())
  console.log(getMSIURL(a))
  console.log(getASROCKURL(a))
  console.log(getAORUSURL(a))
  console.log(getASUSURL(a))

  //pass browser instance and url to the scraper
  scrapeAll(browserInstance, url)
}

function craftURL(a) {
  var url;
  if (getManufacturer() === 'MSI') {
    url = getMSIURL(a)
  }
  else if (getManufacturer() === 'ASUS') {
    url = getASUSURL(a)
  }
  else if (getManufacturer() === 'AORUS') {
    url = getAORUSURL(a)
  }
  else if (getManufacturer() === 'ASROCK') {
    url = getASROCKURL(a)
  }
  return url
}

function getMBInfo() {
  var x = execSync('wmic baseboard get product').toString().replace("Product", "").trim()
  var y = x.lastIndexOf(' ')
  var z;
  if (y != -1) {
    z = x.substring(0, y + 1)
  } else {
    z = x
  }
  return z
}

function parsePercent(a) {
  var mb = getMBInfo()
  if (a === "") {
    if (mb.lastIndexOf(' ') != -1) {
      var parsed;
      var parts = mb.split(" ")
      parts.splice(parts.indexOf(''))
      parsed = parts.join('%')
    } else {
      parsed = mb
    }
    return parsed
  } else {
    return a
  }
}

function parseDash(a) {
  var mb = getMBInfo()
  if (a === "") {
    if (mb.lastIndexOf(' ') != -1) {
      var parsed;
      var parts = mb.split(" ")
      parts.splice(parts.indexOf(''))
      parsed = parts.join('-')
    } else {
      parsed = mb
    }
    return parsed
  } else {
    return a
  }
}

function getMSIURL(a) {
  return 'https://www.msi.com/Motherboard/support/' + parseDash(a) + '#down-driver&Win10%2064'
}

function getASROCKURL(a) {
  return 'https://www.asrock.com/mb/' + getCPUInfo() + '/' + parsePercent(a) + '/index.us.asp#Download'
}

function getAORUSURL(a) {
  return 'https://www.gigabyte.com/Motherboard/' + parseDash(a) + '/support#support-dl-driver'
}

function getASUSURL(a) {
  return 'https://www.asus.com/us/Motherboards-Components/Motherboards/All-series/' + parseDash(a) + '/HelpDesk_Download/'
}

function getCPUInfo() {
  var cpu
  var x = execSync('wmic cpu get name').toString().replace("Name", "").trim()
  var y = x.split(' ')
  z = y[0]
  if (z.includes('Intel')) {
    cpu = 'Intel'
  } else {
    cpu = 'AMD'
  }
  return cpu
}

function getManufacturer() {
  var output = execSync('wmic baseboard get manufacturer').toString()
  var parsed = output.replace("Manufacturer", "").trim()
  if (parsed.includes('Micro-Star')) {
    return 'MSI'
  }
  else if (parsed.includes('ASUSTeK')) {
    return 'ASUS'
  }
  /*
  else if (parsed.includes('AORUS')) {
    return 'AORUS'
  }
  else if (parsed.includes('ASROCK')) {
    return 'ASROCK'
  }
  */
}