const puppeteer = require('puppeteer-extra')
const progress = require('request-progress')
const { execSync } = require('child_process')
const { createWriteStream, createReadStream } = require("fs")
const request = require('request')
const path = require('path')
const unzipper = require('unzipper')

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
puppeteer.use(AdblockerPlugin({ blockTrackers: true }))

function check() {
    var url = 'https://github.com/omiinaya/driver-fetch/releases'
    let browserInstance = startBrowser();
    scrapeAll(browserInstance, url)
}

async function startBrowser() {
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
        await scraper(browser, url);
    }
    catch (err) {
        console.log("Could not resolve the browser instance => ", err);
    }
}

async function scraper(browser, url) {
    const [page] = await browser.pages()
    await page.setRequestInterception(true)
    page.on('request', request => {
        if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet')
            request.abort();
        else
            request.continue();
    })
    console.log(`Navigating to ` + url + `...`);
    await page.goto(url);

    scrapeReleases(page)
}

async function scrapeReleases(page) {
    const hrefs = await page.$$eval('a', as => as.map(a => a.href)
        .filter(href => (href.includes('driver-fetch-v') && href.includes('.zip')))
    );
    console.log(hrefs);

    var directory = path.join(__dirname, '../')
    hrefs.forEach(url => {
        dl(url, getFilePath(url, directory))
    })

}

async function ifNotExistCreateDir(url, directory) {
    var name = url.substring(url.lastIndexOf('/') + 1, url.length)
    var path = directory.replace(name, '')
    console.log(path)
    try {
        return execSync('dir ' + path).toString().trim()
    } catch (error) {
        var condition = error.stderr.toString()
        if (condition.includes('cannot find')) {
            return execSync('mkdir ' + path).toString().trim()
        }
    }
}

function getFilePath(url, directory) {
    var name = url.substring(url.lastIndexOf('/') + 1, url.length).replace('.zip', '')
    var path = directory + name + '\\' + name + '.zip'
    return path
}

function dl(url, directory) {
    ifNotExistCreateDir(url, directory)

    progress(request(url))
        .on('progress', state => { })
        .on('error', err => console.log(err))
        .on('end', () => {
            browser.close()
            unzip(directory, url)
        })
        .pipe(createWriteStream(directory))
}

function unzip(directory, url) {
    var name = url.substring(url.lastIndexOf('/') + 1, url.length)
    var path = directory.replace(name, '')
    createReadStream(directory)
    .pipe(unzipper.Extract({ path: path }));
}

module.exports = {
    check,
    dl
}