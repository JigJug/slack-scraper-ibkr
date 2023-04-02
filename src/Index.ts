import { runScraper } from "./Run";
import events from "events"
import { startIbkr, positionTracker } from "./IbkrTws";
import * as dotenv from "dotenv"
dotenv.config();

const CONTRACT_DATE = process.env.CONTRACT_DATE;

const event = new events();


//start scraping
runScraper(event);

//listen for alerts
startIbkr(event, CONTRACT_DATE);

