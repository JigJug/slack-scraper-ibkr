import { runScraper } from "./Run";
import events from "events"
import { startIbkr, positionTracker } from "./IbkrTws";
import * as fs from 'fs'
import * as path from 'path'

const event = new events();

async function loadConfigs () {
  try {
    const rootDir = path.resolve(__dirname);
    const configsRaw = fs.openSync(`${rootDir}/config.json`);
    const configs = JSON.parse(configsRaw);
    return configs
  } catch (err) {
    throw err;
  }
}

async function startProgram (event) {
  try {
    const configs = await loadConfigs();
    await Promise.all(
      [
        runScraper(event, configs.scraperConfig),
        startIbkr(event, configs.ibkrConfig)
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