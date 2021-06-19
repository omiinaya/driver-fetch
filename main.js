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

app.on('ready', createWindow);

ipc.on('TESTING_1', function () {
  main()
})

function main() {
  //start the browser and create a browser instance
  let browserInstance = startBrowser();
  let brand = getManufacturer();
  //testing mb name
  let a = 'Z590 OC Formula'
  //testing mb brand
  let b = 'ASROCK'
  //testing cpu brand
  let c = 'Intel'
  //defining url and passing test vars
  let url = craftURL(a, b, c)
  //logging vars for testing
  console.log(getMBInfo(a))
  console.log(parseDash(a))
  console.log(parsePercent(a))
  console.log(getCPUInfo(c))
  console.log(getManufacturer(b))
  //console.log(getDrives())
  console.log(parseRog(a))
  //pass browser instance and url to the scraper
  scrapeAll(browserInstance, url, brand)
}

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

async function scraper(browser, url, brand) {
  let page = await browser.newPage();
  console.log(`Navigating to ` + url + `...`);
  await page.goto(url);
  //MSI
  if (brand === 'MSI') {
    scrapeMSI(page)
  } else if (brand === 'ASROCK') {
    scrapeASROCK(page)
  }
  //ASROCK

  //scrapeASROCK(page)
  //GIGABYTE
  //scrapeGIGABYTE(page)
  //ASUS
  //scrapeASUS(page)
}

async function scrapeAll(browserInstance, url, brand) {
  let browser;
  try {
    browser = await browserInstance;
    await scraper(browser, url, brand);
  }
  catch (err) {
    console.log("Could not resolve the browser instance => ", err);
  }
}

async function scrapeMSI(page) {
  await page.waitForSelector('.hvr-bob');
  const hrefs = await page.$$eval('a', as => as.map(a => a.href)
    .filter(href => href.includes('https://download.msi.com/dvr_exe/'))
  );
  console.log(hrefs);
}

async function scrapeASROCK(page) {
  //await page.waitForSelector('.hvr-bob');
  const hrefs = await page.$$eval('a', as => as.map(a => a.href)
    .filter(href => href.includes('https://download.msi.com/dvr_exe/'))
  );
  console.log(hrefs);
}

function craftURL(a, b, c) {
  var mb = getMBInfo(a)
  var brand = getManufacturer(b)
  var url;
  if (brand === 'MSI') {
    url = 'https://www.msi.com/Motherboard/support/' + parseDash(a).toUpperCase() + '#down-driver&Win10%2064'
  }
  else if (brand === 'AORUS') {
    url = 'https://www.gigabyte.com/Motherboard/' + parseDash(a) + '/support#support-dl-driver'
  }
  else if (brand === 'ASROCK') {
    if (mb.includes('Aqua') || mb.includes('AQUA') || mb.includes('Formula') || mb.includes('FORMULA')) {
      url = 'https://www.asrock.com/mb/' + getCPUInfo(c) + '/' + parsePercent(a).toUpperCase() + '/Specification.asp#Download'
    } else {
      url = 'https://www.asrock.com/mb/' + getCPUInfo(c) + '/' + parsePercent(a).toUpperCase() + '/index.asp#Download'
    }
  }
  else if (brand === 'ASUS') {
    if (mb.includes('Strix') || mb.includes('STRIX')) {
      url = 'https://rog.asus.com/us/motherboards/rog-strix/' + parseRog(a)
    } else if (mb.includes('Maximus') || mb.includes('MAXIMUS')) {
      url = 'https://rog.asus.com/us/motherboards/rog-maximus/' + parseRog(a)
    } else if (mb.includes('Crosshair') || mb.includes('CROSSHAIR')) {
      url = 'https://rog.asus.com/us/motherboards/rog-crosshair/' + parseRog(a)
    } else if (mb.includes('Zenith') || mb.includes('ZENITH')) {
      url = 'https://rog.asus.com/us/motherboards/rog-zenith/' + parseRog(a)
    } else if (mb.includes('Rampage') || mb.includes('RAMPAGE')) {
      url = 'https://rog.asus.com/us/motherboards/rog-rampage/' + parseRog(a)
    } else {
      url = 'https://www.asus.com/us/Motherboards-Components/Motherboards/All-series/' + parseDash(a) + '/HelpDesk_Download/'
    }
  }
  return url
}

function getMBInfo(a) {
  if (!a) {
    var x = execSync('wmic baseboard get product').toString().replace("Product", "").trim()
  } else {
    x = a
  }
  /*
  var y = x.lastIndexOf(' ')
  var z;
  if (y != -1) {
    z = x.substring(0, y + 1)
    console.log(z)
  } else {
    z = x
    console.log(z)
  }
  return z
  */
  return x
}

function parsePercent(a) {
  var mb;
  if (!a) {
    mb = getMBInfo()
  } else {
    mb = getMBInfo(a)
  }
  if (mb.lastIndexOf(' ') != -1) {
    var parsed;
    var parts = mb.split(" ")
    parsed = parts.join('%20')
  } else {
    parsed = mb
  }
  return parsed
}

function parseDash(a) {
  var mb;
  if (!a) {
    mb = getMBInfo()
  } else {
    mb = getMBInfo(a)
  }
  if (mb.lastIndexOf(' ') != -1) {
    var parsed;
    var parts = mb.split(' ')
    parsed = parts.join('-')
  } else {
    parsed = mb
  }
  return parsed
}

function parseRog(a) {
  var rog;
  if (!a) {
    rog = parseDash() + "-model"
  } else {
    rog = parseDash(a) + "-model"
  }
  return rog.toLowerCase();
}

function getCPUInfo(c) {
  if (!c) {
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
  } else {
    return c
  }
}

function getManufacturer(b) {
  if (!b) {
    var output = execSync('wmic baseboard get manufacturer').toString()
    var parsed = output.replace("Manufacturer", "").trim()
    if (parsed.includes('Micro-Star') || parsed.includes('MSI')) {
      return 'MSI'
    }
    else if (parsed.includes('ASUSTeK') || parsed.includes('ASUS')) {
      return 'ASUS'
    }
    else if (parsed.includes('ASRock')) {
      return 'ASROCK'
    }
    else if (parsed.includes('Gigabyte') || parsed.includes('Aorus')) {
      return 'AORUS'
    }
  } else {
    return b
  }
}

function getDrives() {
  var output = execSync('wmic logicaldisk get name, size, volumename, description').toString()
  var drives = output.split('\n').splice(1, output.length - 1)
  return drives
}

//disable onedrive starting up
//initialize drives
//partition drives if needed

//tested: 
//MPG-Z590-GAMING-CARBON-WIFI
//MEG-Z590-UNIFY
//PRIME Z590-P WIFI
//ProArt-B550-CREATOR
//ROG Crosshair VIII Hero
//ROG Strix TRX40-E Gaming
//ROG Zenith II Extreme Alpha
//Z490 AQUA
//B550 Taichi
//TRX40 Creator

//wmic startup