const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeBook(url) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url);
    const [element] = await page.$x('/html/body/div[1]/div[1]/div/table/tbody/tr[1]/td[1]/a/img');
    const src = await element.getProperty('src');
    const imageURL = await src.jsonValue();
    browser.close();
    return { imageURL }
}

async function screenshotPage(url) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url);
    await page.screenshot({ path: 'test.png', fullPage: true });
    browser.close();
}
async function getBookByISBN(url, isbn) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url);
    await page.focus('#search_form > table > tbody > tr > td > table > tbody > tr:nth-child(5) > td > input[type=text]');
    await page.keyboard.type(isbn)
    await page.click('#submitBtn')
    await page.waitForSelector('#header-section-context > span')
    await page.screenshot({ path: 'test.png', fullPage: true });
    browser.close();
}

async function getBookByTitleAndAuthor(title, author) {
    const url = 'https://www.bookfinder.com/';
    const browser = await puppeteer.launch({ headless: false });
    let results;
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(url);
        await page.focus('#author');
        await page.keyboard.type(author);
        await page.focus('#title');
        await page.keyboard.type(title);
        await page.click('#submitBtn');
        await page.waitForSelector('#bd > div.search-heading-box')
        const firstResultUrl = await page.evaluate(()=> {
            return document.querySelector("ul.select-titlenames > li > span > a").href;
        });
        await page.goto(firstResultUrl);
        await page.waitForSelector("#bd > div.search-heading-box")
        await page.screenshot({ path: `./screenshots/${createFileName(title)}-${createFileName(author)}.png`, fullPage: true });
        await browser.close();
    } catch(err) {
        console.log(err)
        await browser.close();
    }
}

const readFile = (...args) => {
    return new Promise((resolve, reject) => {
        fs.readFile(...args, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data);
        });
    });
}

const createFileName = str => {
    const noSpecialChar = str.replace(/[^a-zA-Z]/g,"");
    return noSpecialChar;
}

(async () => {
    const rawBookData = await readFile('./test.tsv', 'utf8').catch(err => console.log(err));
    const books = rawBookData.split('\n').splice(1, rawBookData.length - 1).map(item => {
        const row = item.split('\t');
        return {
            description: row[2],
            title: row[3],
            author: row[4]
        };
    });

    // for (const book of books) {
    //     await getBookByTitleAndAuthor(book.title, book.author).catch(err => browser.close());
    // }
    await getBookByTitleAndAuthor(books[4].title, books[4].author).catch(err => console.log(err))
})()