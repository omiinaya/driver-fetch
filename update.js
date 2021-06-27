const puppeteer = require('puppeteer-extra')

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
    await page.goto(url/*, {
        waitUntil: "networkidle2"
    }*/);

    scrapeReleases(page)
}

async function scrapeReleases(page) {
    const hrefs = await page.$$eval('a', as => as.map(a => a.href)
        .filter(href => href.includes('driver-fetch'))
    );
    console.log(hrefs);
}

function test() {
    console.log('test')
}

module.exports = {
    check,
    test
}