"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Run_1 = require("./Run");
const events_1 = __importDefault(require("events"));
const IbkrTws_1 = require("./IbkrTws");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const CONTRACT_DATE = process.env.CONTRACT_DATE;
console.log('contract date: ', CONTRACT_DATE);
const REAL_TIME_DATA = process.env.REAL_TIME_DATA;
let mode;
if (REAL_TIME_DATA == "true")
    mode = true;
else
    mode = false;
console.log('mode: realtime: ', mode);
const event = new events_1.default();
//start scraping
(0, Run_1.runScraper)(event);
//listen for alerts
(0, IbkrTws_1.startIbkr)(event, CONTRACT_DATE, mode);
