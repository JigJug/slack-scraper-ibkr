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
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScraper = void 0;
const ScrapePage_1 = require("./SlackScraper/ScrapePage");
const LaunchBrowser_1 = require("./SlackScraper/LaunchBrowser");
const Login_1 = require("./SlackScraper/Login");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const HEADLESS_MODE = process.env.HEADLESS_MODE;
let mode;
if (HEADLESS_MODE == "true")
    mode = true;
else
    mode = false;
//looks like we need to do last message seen. so record the last message on first scrape
//then keep passing it to the recursive function .. when it changes then check if its an alert.
//maybe need this for mac?... softwareupdate --install-rosetta
function runScraper(event) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const lb = yield (0, LaunchBrowser_1.launchBrowser)(mode);
            yield (0, Login_1.loginToSlack)(lb.page, 200000);
            console.log('logged in, started scrape...');
            yield (0, ScrapePage_1.getFeed)(event, lb.page, '', true, { mouse: 0, refresh: 0 });
        }
        catch (err) {
            console.log(err);
        }
    });
}
exports.runScraper = runScraper;
