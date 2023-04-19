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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Run_1 = require("./Run");
const events_1 = __importDefault(require("events"));
const IbkrTws_1 = require("./IbkrTws");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const event = new events_1.default();
function loadConfigs() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const rootDir = path.resolve(__dirname);
            const configsRaw = fs.readFileSync(`${rootDir}\\config.json`);
            console.log(configsRaw);
            const configs = JSON.parse(configsRaw.toString());
            console.log(configs);
            return configs;
        }
        catch (err) {
            throw err;
        }
    });
}
function startProgram(event) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const configs = yield loadConfigs();
            yield Promise.all([
                (0, Run_1.runScraper)(event, configs.scraperConfig),
                (0, IbkrTws_1.startIbkr)(event, configs.ibkrConfig)
            ]);
        }
        catch (err) {
            console.log(err);
        }
    });
}
startProgram(event);
//start scraping
//runScraper(event, configs);
//listen for alerts
//startIbkr(event, configs);
