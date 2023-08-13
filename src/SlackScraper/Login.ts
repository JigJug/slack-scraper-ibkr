import { Page, Protocol } from "puppeteer"
import * as fs from "fs/promises"
import * as fss from "fs"
import { delay } from "../Utils/Delay"
import * as dotenv from "dotenv"
dotenv.config();
//NOW SLACK SENDS AN EMAIL TO ENTER A CODE

const SLACKCHANNEL = process.env.SLACK_CLIENT_URL
const WS = process.env.SLACK_WORKSPACE_URL
const EMAIL = process.env.SLACK_EMAIL

const COOKIES_FOLDER_PATH = 'cookies/'
const COOKIES_FILE_NAME = 'slack-session-cookies.json'
const COOKIES_FILE_PATH = COOKIES_FOLDER_PATH + COOKIES_FILE_NAME

export async function loginToSlack(page: Page, delayToLogin: number) {

    try {

        if(fss.existsSync(COOKIES_FILE_PATH)){

            const getCookies = await fs.readFile(COOKIES_FILE_PATH);

            const cookies = JSON.parse(getCookies.toString());

            for (const cookie of cookies.cookies) {
                await page.setCookie(cookie);
            }

            console.log('set cookies');

            await page.goto(SLACKCHANNEL!);
        }
        else{
            await login(page);
            //give some time to login with email code
            await delay(delayToLogin);
            await goToWsAndSaveCookies(page);

        }
        
    }
    catch (err) {
        throw err
    }

  
}


async function login(page: Page) {

    await page.goto(WS!);

    await page.type('#signup_email', EMAIL!);

    //await delay(10000)

    await page.click('#submit_btn');

    await page.waitForNavigation({ waitUntil: 'networkidle0' });

}


async function goToWsAndSaveCookies(page: Page) {

    await page.goto(SLACKCHANNEL!);
  
    const cookies = await page.cookies();

    saveCookies(cookies);
}
  

async function saveCookies(cookies: Protocol.Network.Cookie[]) {

    await createFolderIfDoesntExist(COOKIES_FOLDER_PATH);

    const cks = {
        cookies: cookies
    }

    const cksStr = JSON.stringify(cks, null, 2);

    fs.writeFile(COOKIES_FILE_PATH, cksStr);
}


async function createFolderIfDoesntExist(folderPath: string) {
    try {
        await fs.stat(folderPath);
    }
    catch (error) {
        console.error(`${folderPath} directory doesn't exist.`);

        try {
            await fs.mkdir(folderPath);
            console.log('Created directory:', folderPath);
        }
        catch (error) {
            console.error('Failed to create directory.');
            throw error
        }
    }
}
