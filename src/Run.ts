import { getFeed } from "./SlackScraper/ScrapePage";
import { launchBrowser } from "./SlackScraper/LaunchBrowser";
import { loginToSlack } from "./SlackScraper/Login";
import events from "events"
import { ScraperConfig } from "./typings";


//looks like we need to do last message seen. so record the last message on first scrape
//then keep passing it to the recursive function .. when it changes then check if its an alert.

//maybe need this for mac?... softwareupdate --install-rosetta



export async function runScraper (event: events, configs: ScraperConfig){
    try{
        const lb = await launchBrowser(configs.headlessMode);

        await loginToSlack(lb.page, 200000);

        console.log('logged in, started scrape...');

        await getFeed(event, lb.page, '', true, {mouse: 0, refresh: 0});
        
    }
    catch(err){
        console.log(err)
    }
}






