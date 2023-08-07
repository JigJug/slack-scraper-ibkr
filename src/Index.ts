import { runScraper } from "./Run";
import events from "events"
//import { startIbkr, positionTracker } from "./IbkrTws";
//import { startIbkr } from "./IbkrTws1.mjs";
//import { startIbkr} from "./test.mjs";
import * as fs from 'fs'
import * as path from 'path'


const event = new events();

async function loadConfigs () {
  try {
    const rootDir = path.resolve(__dirname);
    const configsRaw = fs.readFileSync(`${rootDir}\\config.json`);
    console.log(configsRaw)
    const configs = JSON.parse(configsRaw.toString());
    console.log(configs)
    return configs
  } catch (err) {
    throw err;
  }
}

async function startProgram (event: events) {
  try {
    const mibkc = await import("./IbkrTwsClass.mjs")
    const configs = await loadConfigs();
    const ibkr = new mibkc.IbkrTws(event, configs.ibkrConfig);
    await ibkr.connect();
    ibkr.startListener();
    await Promise.all(
      [
        runScraper(event, configs.scraperConfig)
      ]
    );
  } catch (err) {
    console.log(err);
  }
}

startProgram(event);

//start scraping
//runScraper(event, configs);

//listen for alerts
//startIbkr(event, configs);