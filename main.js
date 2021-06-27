require('electron-reload')(__dirname, { ignored: /db|[\/\\]\./, argv: [] })
const delay = ms => new Promise(res => setTimeout(res, ms))
const { app, BrowserWindow, dialog } = require('electron')
const { execSync } = require('child_process')
const ipc = require('electron').ipcMain
const puppeteer = require('puppeteer-extra')
const path = require('path')
const { createWriteStream } = require("fs")
const request = require('request')
const progress = require('request-progress')
const update = require('./update')

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
puppeteer.use(AdblockerPlugin({ blockTrackers: true }))

let window;

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 200,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'update.js')
    }
  });
  mainWindow.loadFile(path.join(__dirname, './assets/html/index.html'));

  window = mainWindow;
};

let a, b, c, browser;

app.on('ready', function () {
  createWindow()
});

ipc.on('START_REQUEST', function () {
  main(a, b, c)
})

ipc.on('UPDATE_REQUEST', function () {
  update.check('https://github.com/omiinaya/driver-fetch/releases')
})

ipc.on('DEFAULT_REQUEST', function () {
  setVars()
  window.webContents.send('HTML_RESPONSE', [getMBInfo(), getManufacturer(), getCPUInfo()]);
})

ipc.on('MANUAL_REQUEST', function (evt, data) {
  setVars(data[0], data[1], data[2])
  window.webContents.send('HTML_RESPONSE', [data[0], data[1], data[2]]);
})

function setVars(x, y, z) {
  if (!x) {
    a = '' //testing mb name
    b = '' //testing mb brand
    c = '' //testing cpu brand
  } else {
    a = x
    b = y
    c = z
  }
}

function main(a, b, c) {
  //start the browser and create a browser instance
  let browserInstance = startBrowser();

  let brand = getManufacturer(b);
  //testing mb name
  //defining url and passing test vars
  let url = craftURL(a, b, c)
  //logging vars for testing

  print(getMBInfo(a))
  print(parseDash(a))
  print(parsePercent(a))
  print(getCPUInfo(c))
  print(getManufacturer(b))
  print(parseRog(a))
  print(parseAorus(a))

  //pass browser instance and url to the scraper
  scrapeAll(browserInstance, url, brand, a, b, c)
}

async function startBrowser() {
  try {
    print("Opening the browser......");
    browser = await puppeteer.launch({
      headless: false,
      args: ["--disable-setuid-sandbox"],
      'ignoreHTTPSErrors': true
    });
  } catch (err) {
    print("Could not create a browser instance => : ", err);
  }
  return browser;
}

async function scraper(browser, url, brand, a, b, c) {
  const [page] = await browser.pages()
  await page.setRequestInterception(true)
  page.on('request', request => {
    if (request.resourceType() === 'image' /*|| request.resourceType() === 'stylesheet'*/)
      request.abort();
    else
      request.continue();
  })
  print(`Navigating to ` + url + `...`);
  await page.goto(url, {
    waitUntil: "networkidle2"
  });

  if (brand === 'MSI') {
    scrapeMSI(page, a, b, c)
  } else if (brand === 'ASROCK') {
    scrapeASROCK(page, a, b, c)
  } else if (brand === 'AORUS') {
    scrapeAORUS(page, a, b, c)
  } else if (brand === 'ASUS') {
    scrapeASUS(page, a, b, c)
  }
}

async function scrapeAll(browserInstance, url, brand, a, b, c) {
  let browser;
  try {
    browser = await browserInstance;
    await scraper(browser, url, brand, a, b, c);
  }
  catch (err) {
    print("Could not resolve the browser instance => ", err);
  }
}

async function scrapeMSI(page, a, b, c) {
  await page.waitForSelector('.hvr-bob');
  const hrefs = await page.$$eval('a', as => as.map(a => a.href)
    .filter(href => href.includes('https://download.msi.com/dvr_exe/'))
  );
  print(hrefs);
  selectDirectory().then((directory) => {
    if (directory) {
      hrefs.forEach(url => {
        dl(url, getFilePath(url, directory, a, b, c), a, b, c)
      })
    } else {
      return
    }
  })
}

async function scrapeASROCK(page, a, b, c) {
  const hrefs = await page.$$eval('a', as => as.map(a => a.href)
    .filter(href => href.includes('asrock.com/Drivers/'))
  );
  print(hrefs);
  selectDirectory().then((directory) => {
    if (directory) {
      hrefs.forEach(url => {
        dl(url, getFilePath(url, directory, a, b, c), a, b, c)
      })
    } else {
      return
    }
  })
}

async function scrapeAORUS(page, a, b, c) {
  const hrefs = await page.$$eval('a', as => as.map(a => a.href)
    .filter(href => href.includes('gigabyte.com/FileList/Driver/'))
  );
  print(hrefs);
  selectDirectory().then((directory) => {
    if (directory) {
      hrefs.forEach(url => {
        dl(url, getFilePath(url, directory, a, b, c), a, b, c)
      })
    } else {
      return
    }
  })
}

async function scrapeASUS(page, a, b, c) {
  const selectElem = await page.$('select[class^="ProductSupportDriverBIOS__select__"]');
  await selectElem.type('Windows 10 64-bit');
  await delay(3000)
  const hrefs = await page.$$eval('a', as => as.map(a => a.href)
    .filter(href => href.includes('dlcdnets.asus.com/pub'))
  );
  print(hrefs);
  selectDirectory().then((directory) => {
    if (directory) {
      hrefs.forEach(url => {
        dl(url, getFilePath(url, directory, a, b, c), a, b, c)
      })
    } else {
      return
    }
  })
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
    parsed.replaceAll('/', '')
  } else {
    parsed = mb.replaceAll('/', '')
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
    var parsed, url;
    var parts = mb.split(' ')
    url = parts.join('-')
    parsed = url.replaceAll('/', '').replaceAll('(', '').replaceAll(')', '')
  } else {
    parsed = mb.replaceAll('/', '').replaceAll('(', '').replaceAll(')', '')
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
    if (mb.includes('rev')) {
      var parts = mb
        .replaceAll('(', '')
        .replaceAll(')', '')
        .replaceAll('.', '')
        .split(' ')
      parsed = parts.join('-')
    } else {
      parts = mb.split(' ')
      parsed = parts.join('-') + '-rev-10'
    }
  } else {
    parsed = mb + '-rev-10'
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

function getFilePath(url, directory, a, b, c) {
  if (!a) {
    var name = url.substring(url.lastIndexOf('/') + 1, url.length)
    var path = directory + '\\drivers\\' + parseDash() + '\\' + name
    return path
  } else {
    var name = url.substring(url.lastIndexOf('/') + 1, url.length)
    var path = directory + '\\drivers\\' + parseDash(a) + '\\' + name
    return path
  }
}

async function ifNotExistCreateDir(url, directory) {
  var name = url.substring(url.lastIndexOf('/') + 1, url.length)
  var path = directory.replace(name, '')
  print(path)
  try {
    return execSync('dir ' + path).toString().trim()
  } catch (error) {
    var condition = error.stderr.toString()
    if (condition.includes('cannot find')) {
      return execSync('mkdir ' + path).toString().trim()
    }
  } finally {
    //code that executes after try only if there was no catch
  }
}

function dl(url, directory, a, b, c) {
  print('url: ' + url)
  print('dir: ' + directory)
  ifNotExistCreateDir(url, directory)

  progress(request(url))
    .on('progress', state => {
      //
    })
    .on('error', err => console.log(err))
    .on('end', () => {
      browser.close()
    })
    .pipe(createWriteStream(directory))
}

async function selectDirectory() {
  //defining type of selection and title
  let options = {
    title: "Where would you like to download your drivers?",
    properties: ["openDirectory"]
  }
  //opening dialog and executing a function
  const result = await dialog.showOpenDialog(window, options)
  if (result.filePaths.length > 0) {
    console.log(result)
    return result.filePaths[0]
  } else {
    browser.close()
  }
}

function print(a) {
  window.webContents.send('LOG_REQUEST', a);
}

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

function scrapeMDB() {
  //get all h4s for mb names
  //find disabled link-page then + 1 to find the last page
  //iterate through every page
  //send motherboard to database on each iteration
  //profit
}