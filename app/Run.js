"use strict";
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
//looks like we need to do last message seen. so record the last message on first scrape
//then keep passing it to the recursive function .. when it changes then check if its an alert.
//maybe need this for mac?... softwareupdate --install-rosetta
function runScraper(event, configs) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const lb = yield (0, LaunchBrowser_1.launchBrowser)(configs.headlessMode);
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
