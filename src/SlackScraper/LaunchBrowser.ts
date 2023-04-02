import puppeteer, {PuppeteerLaunchOptions} from "puppeteer"


export async function launchBrowser(mode: boolean) {

    let options: PuppeteerLaunchOptions

    if (mode) {
        options = {
        headless: true,
        defaultViewport: { height: 6000, width: 1463 }
    }
    }
    else {
        options = {
        headless: false,
        defaultViewport: null,
        }
    }

    const browser = await puppeteer.launch(options);

    if (mode) console.log('Headless browser launched successfully');

    const page = await browser.newPage();

    return { page, browser }
}