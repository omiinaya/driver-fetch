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
  console.log(parseDash())
  console.log(parsePercent())
  console.log(getPCName())
  console.log(getCPUInfo())
  console.log(getManufacturer())
  console.log(getMSIURL())
  console.log(getASROCKURL())
  console.log(getAORUSURL())
  console.log(getASUSURL())
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
  if (getManufacturer() === 'MSI') {
    url = getMSIURL()
  }
  else if (getManufacturer() === 'ASUS') {
    url = getASUSURL()
  }
  else if (getManufacturer() === 'AORUS') {
    url = getAORUSURL()
  }
  else if (getManufacturer() === 'ASROCK') {
    url = getASROCKURL()
  }
  return url
}

function getMBInfo() {
  var x = execSync('wmic baseboard get product').toString().replace("Product", "").trim()
  var y = x.lastIndexOf(' ')
  var z = x.substring(0, y + 1)
  return z
}

function getPCName() {
  var name = execSync('echo %computername%').toString().trim()
  return name
}

function getMSIURL() {
  var motherboard = parseDash()
  var msi = 'https://www.msi.com/Motherboard/support/' + motherboard + '#down-driver&Win10%2064'
  return msi
}

function getASROCKURL() {
  var motherboard = parsePercent()
  var cpu = getCPUInfo()
  var asrock = 'https://www.asrock.com/mb/' + cpu + '/' + motherboard + '/index.us.asp#Download'
  return asrock
}

function getAORUSURL() {
  var motherboard = parseDash()
  var asrock = 'https://www.gigabyte.com/Motherboard/' + motherboard + '/support#support-dl-driver'
  return asrock
}

function getASUSURL() {
  var motherboard = parseDash()
  var asrock = 'https://www.asus.com/us/Motherboards-Components/Motherboards/All-series/' + motherboard + '/HelpDesk_Download/'
  return asrock
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

function parsePercent() {
  var mb = getMBInfo()
  var parts = mb.split(" ")
  parts.splice(parts.indexOf(''))
  var parsed = parts.join('%')
  return parsed
}

function parseDash() {
  var mb = getMBInfo()
  var parts = mb.split(" ")
  parts.splice(parts.indexOf(''))
  var parsed = parts.join('-')
  return parsed
}