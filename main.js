require('electron-reload')(__dirname, { ignored: /db|[\/\\]\./, argv: [] })
const delay = ms => new Promise(res => setTimeout(res, ms))
const { app, BrowserWindow, dialog } = require('electron')
const { execSync } = require('child_process')
const ipc = require('electron').ipcMain
const puppeteer = require('puppeteer-extra')
const path = require('path')
const { autoUpdater } = require('electron-updater')
const { createWriteStream } = require("fs")
const request = require('request')
const progress = require('request-progress')

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
      enableRemoteModule: true
    }
  });
  mainWindow.loadFile(path.join(__dirname, './assets/html/index.html'));

  mainWindow.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });

  autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update_available');
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update_downloaded');
  });

  window = mainWindow;
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
  let browser;
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
    if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet')
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
    .filter(href => href.includes('https://download.asrock.com/Drivers/'))
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
    .filter(href => href.includes('https://download.gigabyte.com/FileList/Driver/'))
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
  await delay(2000)
  const hrefs = await page.$$eval('a', as => as.map(a => a.href)
    .filter(href => href.includes('https://dlcdnets.asus.com/pub/'))
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
    var parsed;
    var parts = mb.split(' ')
    parsed = parts.join('-')
    parsed.replaceAll('/', '')
  } else {
    parsed = mb.replaceAll('/', '')
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
      window.webContents.send('DOWNLOAD_STATUS', state);
      //create a div based on total, then edit it if the total matches div id
    })
    .on('error', err => console.log(err))
    .on('end', () => { })
    .pipe(createWriteStream(directory))

  //var file = createWriteStream(directory);
  //https.get(url, function (response) {
  //  response.pipe(file);
  //});

}

async function selectDirectory() {
  //defining type of selection and title
  let options = {
    title: "Where would you like to download your drivers?",
    properties: ["openDirectory"]
  }
  //opening dialog and executing a function
  const result = await dialog.showOpenDialog(window, options)
  if (result) {
    return result.filePaths[0]
  }
}

function print(a) {
  window.webContents.send('LOG_REQUEST', a);
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



ipc.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

ipc.on('RESIZE_REQUEST', (evt, data) => {
  var width = parseInt(data[0])
  var height = parseInt(data[1])
  console.log(data)
  window.setSize(width, height)
});