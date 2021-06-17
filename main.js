require('electron-reload')(__dirname, { ignored: /db|[\/\\]\./, argv: [] });
const { app, BrowserWindow } = require('electron');
const { execSync } = require('child_process')
const ipc = require('electron').ipcMain
const puppeteer = require('puppeteer');
const path = require('path');

//globals
let manufacturer;

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
    await page.waitForSelector('.hvr-bob');
    const hrefs = await page.$$eval('a', as => as.map(a => a.href)
      .filter(href => href.includes('https://download.msi.com/dvr_exe/'))
    );
    console.log(hrefs);

    //ASROCK
    //GIGABYTE
    //ASUS
  }
}

app.on('ready', createWindow);

ipc.on('TESTING_1', function () {
  main()
  console.log(getMBInfo())
  console.log(parseMSIInfo())
  console.log(getPCName())
  console.log(getCPUInfo())
  console.log(setManufacturer())
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
  let url = craftURL()

  //pass browser instance and url to the scraper
  scrapeAll(browserInstance, url)
}

function craftURL() {
  var url;
  if (setManufacturer() === 'MSI') {
    url = getMSIURL()
  }
  else if (getManufacturer() === 'ASUS') {
    //url = getASUSURL()
  }
  else if (getManufacturer() === 'AORUS') {
    //url = getAORUSURL()
  }
  else if (getManufacturer() === 'ASROCK') {
    //url = getAORUSURL()
  }
  return url
}

function getMBInfo() {
  var x = execSync('wmic baseboard get product').toString().replace("Product", "").trim()
  var y = x.lastIndexOf(' ')
  var z = x.substring(0, y + 1)
  return z
}

function parseMSIInfo() {
  var mb = getMBInfo()
  var parts = mb.split(" ")
  parts.splice(parts.indexOf(' '))
  var parsed = parts.join('-')
  return parsed
}

function getPCName() {
  var name = execSync('echo %computername%').toString().trim()
  return name
}

function getMSIURL() {
  var motherboard = parseMSIInfo()
  var msi = 'https://www.msi.com/Motherboard/support/' + motherboard + '#down-driver&Win10%2064'
  return msi
}

/*
function getASUSURL() {
  var motherboard = parseASUSInfo()
  var asus = 'https://www.msi.com/Motherboard/support/'+motherboard+'#down-driver&Win10%2064'
  return asus
}
*/

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
  return execSync('wmic baseboard get manufacturer').toString().replace("Manufacturer", "").trim()
}

function setManufacturer() {
  if (getManufacturer().includes('Micro-Star')) {
    return 'MSI'
  }
  else if (getManufacturer().includes('ASUSTeK')) {
    return 'ASUS'
  }
  /*
  else if (getManufacturer().includes('x')) {
    return 'ASROCK'
  }
  else if (getManufacturer().includes('x')) {
    return 'AORUS'
  }
  */
}