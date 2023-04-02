import { getFeed } from "./SlackScraper/ScrapePage";
import { launchBrowser } from "./SlackScraper/LaunchBrowser";
import { loginToSlack } from "./SlackScraper/Login";
import * as dotenv from "dotenv"
import events from "events"

dotenv.config();
const HEADLESS_MODE = process.env.HEADLESS_MODE;
let mode: boolean
if(HEADLESS_MODE == "true") mode = true;
else mode = false;

//looks like we need to do last message seen. so record the last message on first scrape
//then keep passing it to the recursive function .. when it changes then check if its an alert.

//maybe need this for mac?... softwareupdate --install-rosetta



export async function runScraper (event: events){
    try{
        const lb = await launchBrowser(mode);

        await loginToSlack(lb.page, 200000);

        console.log('logged in, started scrape...');

        await getFeed(event, lb.page, '', true, {mouse: 0, refresh: 0});
        
    }
    catch(err){
        console.log(err)
    }
}






