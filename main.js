require('electron-reload')(__dirname, { ignored: /db|[\/\\]\./, argv: [] });
const { app, BrowserWindow } = require('electron');
const { execSync } = require('child_process')
const ipc = require('electron').ipcMain
const puppeteer = require('puppeteer');
const path = require('path');
const https = require('https')
const fs = require("fs");

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

  let a = ''
  //testing mb brand
  let b = ''
  //testing cpu brand
  let c = ''

  let brand = getManufacturer(b);
  //testing mb name
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
  console.log(parseAorus(a))
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

  if (brand === 'MSI') {
    scrapeMSI(page)
  } else if (brand === 'ASROCK') {
    scrapeASROCK(page)
  } else if (brand === 'AORUS') {
    scrapeAORUS(page)
  } else if (brand === 'ASUS') {
    scrapeASUS(page)
  }
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
  hrefs.forEach(href => {
    dl(href, getFileName(href))
  })
}

async function scrapeASROCK(page) {
  const hrefs = await page.$$eval('a', as => as.map(a => a.href)
    .filter(href => href.includes('https://download.asrock.com/Drivers/'))
  );
  console.log(hrefs);
}

async function scrapeAORUS(page) {
  const hrefs = await page.$$eval('a', as => as.map(a => a.href)
    .filter(href => href.includes('https://download.gigabyte.com/FileList/Driver/'))
  );
  console.log(hrefs);
}

async function scrapeASUS(page) {
  const selectElem = await page.$('select[class="ProductSupportDriverBIOS__select__37dSG"]');
  await selectElem.type('Windows 10 64-bit');
  const hrefs = await page.$$eval('a', as => as.map(a => a.href)
    .filter(href => href.includes('https://dlcdnets.asus.com/pub/'))
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
    url = 'https://www.gigabyte.com/Motherboard/' + parseAorus(a) + '/support#support-dl-driver'
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
      url = 'https://rog.asus.com/motherboards/rog-strix/' + parseRog(a) + '/helpdesk_download'
    } else if (mb.includes('Maximus') || mb.includes('MAXIMUS')) {
      url = 'https://rog.asus.com/motherboards/rog-maximus/' + parseRog(a) + '/helpdesk_download'
    } else if (mb.includes('Crosshair') || mb.includes('CROSSHAIR')) {
      url = 'https://rog.asus.com/motherboards/rog-crosshair/' + parseRog(a) + '/helpdesk_download'
    } else if (mb.includes('Zenith') || mb.includes('ZENITH')) {
      url = 'https://rog.asus.com/motherboards/rog-zenith/' + parseRog(a) + '/helpdesk_download'
    } else if (mb.includes('Rampage') || mb.includes('RAMPAGE')) {
      url = 'https://rog.asus.com/motherboards/rog-rampage/' + parseRog(a) + '/helpdesk_download'
    } else {
      url = 'https://www.asus.com/Motherboards-Components/Motherboards/All-series/' + parseDash(a) + '/HelpDesk_Download/'
    }
  }
  return url
}

function getMBInfo(a) {
  if (!a) {
    var x, y, z;
    if (getManufacturer() === 'MSI') {
      x = execSync('wmic baseboard get product')
      y = x.toString().replace("Product", "").trim()
      z = y.substring(0, y.indexOf('(')).trim()
    } else {
      z = execSync('wmic baseboard get product').toString().replace("Product", "").trim()
    }
  } else {
    z = a
  }
  return z
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

function parseAorus(a) {
  var mb;
  if (!a) {
    mb = getMBInfo()
  } else {
    mb = getMBInfo(a)
  }
  if (mb.lastIndexOf(' ') != -1) {
    var parsed;
    var parts = mb
      .replaceAll('(', '')
      .replaceAll(')', '')
      .replaceAll('.', '')
      .split(' ')
    parsed = parts.join('-')
  } else {
    parsed = mb
  }
  return parsed
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

function getFileName(a) {
  return a.substring(a.lastIndexOf('/') + 1, a.length)
}

async function ifNotExistCreateDir(directory, filename) {
  try {
    return execSync('dir ' + directory).toString().trim()
  } catch (error) {
    var condition = error.stderr.toString()
    if (condition.includes('cannot find')) {
      return execSync('mkdir ' + directory).toString().trim()
    }
  }
}

function dl(url, filename) {
  var mb = getMBInfo()
  var dir = __dirname + "\\drivers\\" + mb + "\\"
  var directory = parseDash(dir)
  var path = directory + "\\" + filename
  ifNotExistCreateDir(directory, filename)
  
  var file = fs.createWriteStream(path);
  https.get(url, function (response) {
    response.pipe(file);
  });
  
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
//Z490-A PRO
//Z590 AORUS XTREME (rev. 1.0)
//Z590 GAMING X (rev. 1.0)
//X570S AERO G (rev. 1.0)

//wmic startup