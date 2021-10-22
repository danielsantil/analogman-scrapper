const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');

const productUrl = 'https://www.buyanalogman.com/ProductDetails.asp?ProductCode=';
const cartUrl = 'https://www.buyanalogman.com/AjaxCart.asp';
const clearCartUrl = 'https://www.buyanalogman.com/ShoppingCart.asp?ax=1&remove=1';

/**
 * Navigates to URL
 * @param {puppeteer.Page} page 
 * @param {string} url 
 * @returns puppetter.HTTPResponse
 */
async function goTo(page, url) {
    const response = await page.goto(url, { waitUntil: 'networkidle2' });
    return response;
}

/**
 * Notifies product availability
 * @param {string} email
 * @param {any} cart Cart response
 * @param {productUrl} cart Link to product
 */
async function notify(email, cart, productUrl) {
    const total = cart.Totals[0].CartTotal;
    const productName = cart.Products[0]?.ProductName;

    const plainText = 
    `${productName} is available!!\n
    Total: ${total},\n\n
    Order it now at: ${productUrl}`;

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: 'analogmanbot@gmail.com', pass: 'analogmanbot_1' }
    });

    let message = await transporter.sendMail({
        from: '"AnalogMan Bot" <analogmanbot@gmail.com>',
        to: email,
        subject: `${productName} AVAILABLE!`.toUpperCase(),
        text: plainText,
        html: `<pre>${plainText}</pre>`
    });

    if (message.messageId)
        console.log('Message sent successfully to ' + email);
}

/**
 * Inits browser and page for scrapper
 * @returns Object with browser and page
 */
async function init() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);

    return { browser, page };
}

/**
 * Checks product availability
 * @param {string} productCode
 * @param {string} email
 * @param {puppeteer.Browser} browser
 * @param {puppeteer.Page} page
 * @returns true if product is in stock, false otherwise
 */
async function checkProduct(productCode, email, browser, page) {
    console.log("--In process...");

    // opening page and adding product to cart
    const fullUrl = productUrl + productCode;
    await goTo(page, fullUrl);
    await page.click('#btn_addtocart');
    await new Promise(_ => setTimeout(_, 3000));

    // reading cart information
    const cartPage = await goTo(page, cartUrl);
    const cartReponseStr = await cartPage.text();
    const cart = JSON.parse(cartReponseStr);

    const isInStock = (+cart.Totals[0].Quantity) > 0;

    if (isInStock) {
        // clearing cart
        await goTo(page, clearCartUrl);
        await new Promise(_ => setTimeout(_, 2000));
        await browser.close();

        await notify(email, cart, fullUrl);
    }

    return isInStock;
}

try {
    (async () => {
        const args = process.argv.slice(2);
        const productCode = args[0];
        const snoozeInMin = args[1];
        const email = args[2];

        if (!productCode || !snoozeInMin || !email) {
            console.log('Missing arguments. Check list of arguments in readme.txt.\n...Exiting');
            return;
        }

        const scrapper = await init();
        let productInStock = false;
        let checkCount = 0;

        console.log('---Started checking for product availability. Product code ' + productCode);
        console.log('If product is in stock, an email will be sent to ' + email);
        while (!productInStock) {
            checkCount++;
            productInStock = await checkProduct(productCode, email, scrapper.browser, scrapper.page);
            if (!productInStock) {
                console.log(`-#${checkCount}: ${productCode} not in stock. Checking again in ${snoozeInMin} minute(s)`);
                await new Promise(_ => setTimeout(_, snoozeInMin * 60000));
            }
        }
        console.log('---Finished loop');
    })();
} catch (err) {
    console.error(err);
}