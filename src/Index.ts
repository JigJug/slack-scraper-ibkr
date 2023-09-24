import { runScraper } from "./Run";
import events from "events";
import * as fs from "fs";
import * as path from "path";

const event = new events();

async function loadConfigs() {
  try {
    const rootDir = path.resolve(__dirname);
    const configsRaw = fs.readFileSync(`${rootDir}/config.json`);
    const configs = JSON.parse(configsRaw.toString());
    return configs;
  } catch (err) {
    throw err;
  }
}

async function startProgram(event: events) {
  try {
    const sibk = await import("./IbkrTws.mjs");
    const configs = await loadConfigs();
    await Promise.all([
      runScraper(event, configs.scraperConfig),
      sibk.startIbkr(event, configs.ibkrConfig),
    ]);
  } catch (err) {
    console.log(err);
  }
}

startProgram(event);
