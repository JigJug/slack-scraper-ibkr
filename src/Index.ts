import { runScraper } from "./Run";
import events from "events"
import { startIbkr, positionTracker } from "./IbkrTws";
import * as dotenv from "dotenv"
dotenv.config();

const CONTRACT_DATE = process.env.CONTRACT_DATE;
console.log('contract date: ', CONTRACT_DATE)

const REAL_TIME_DATA = process.env.REAL_TIME_DATA;
let mode: boolean
if(REAL_TIME_DATA == "true") mode = true;
else mode = false;
console.log('mode: realtime: ',mode)

const event = new events();


//start scraping
runScraper(event);

//listen for alerts
startIbkr(event, CONTRACT_DATE, mode);

