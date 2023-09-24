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
exports.getFeed = void 0;
const Delay_1 = require("../Utils/Delay");
function getFeed(event, page, lastMessage, start, count) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //need a delay on start
            if (start)
                yield (0, Delay_1.delay)(10000);
            count = yield makeHumanAndKickIdle(page, count, lastMessage);
            //get all our elements that we want to inspect and work with
            const ge = yield loadHtml(page);
            //general program delay
            yield (0, Delay_1.delay)(1000);
            const blockQuote = ge.blockQuotes.pop();
            //block quotes on startup
            if (blockQuote == undefined) {
                lastMessage = blockQuote;
                count.refresh += 1;
                return getFeed(event, page, lastMessage, true, count);
            }
            if (start)
                lastMessage = blockQuote;
            //check if we have a new block quote come through
            if (blockQuote != lastMessage) {
                if (blockQuote.includes("ALERT")) {
                    console.log("FOUND ALERT::: ", blockQuote);
                    event.emit("alert", blockQuote);
                }
            }
            lastMessage = blockQuote;
            count.mouse += 1;
            count.refresh += 1;
            getFeed(event, page, lastMessage, false, count);
        }
        catch (err) {
            throw err;
        }
    });
}
exports.getFeed = getFeed;
const loadHtml = (page) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const blockQuotes = yield page.$$eval("blockquote", (chdv) => {
            const elesa = Array.from(chdv);
            return elesa.map((v) => {
                return v.textContent;
            });
        });
        const mesgWindow = yield page.$eval(".c-virtual_list__scroll_container", (ele) => {
            return ele;
        });
        return { blockQuotes, mesgWindow };
    }
    catch (err) {
        throw err;
    }
});
/**
 * makeHumanAndKickIdle
 * - Refresh page after a random amount of minutes between 2 and 5 minutes
 * - move mouse wheel up then down at random intervals
 * @param page
 * @param count
 * @param lastMessage
 */
function makeHumanAndKickIdle(page, count, lastMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //page load every ~5 mins.. need to make this random or ip will get blocked for a little while
            const timeRandRefresh = Math.random() * (600 - 240) + 240;
            if (count.refresh > timeRandRefresh) {
                console.log("program working... ");
                console.log("Previous ALERT recieved: ", lastMessage);
                count.refresh = 0;
            }
            const randMouseTime = Math.random() * (50 - 30) + 30;
            const randMouseClickX = Math.random() * (330 - 230) + 230;
            const randMouseClickY = Math.random() * (500 - 400) + 400;
            const randMouseWheelUp = Math.random() * (99 - 30) + 30;
            if (count.mouse > randMouseTime) {
                const ts = timeStamp();
                console.log(ts);
                console.log(count);
                yield page.mouse.move(randMouseClickX, randMouseClickY);
                yield (0, Delay_1.delay)(Math.random() * 500);
                yield page.mouse.wheel({ deltaY: -randMouseWheelUp });
                yield (0, Delay_1.delay)(Math.random() * 500);
                yield page.mouse.wheel({ deltaY: 300 });
                count.mouse = 0;
            }
            return count;
        }
        catch (err) {
            throw err;
        }
    });
}
function timeStamp() {
    const az = (dig) => {
        return dig.toString().length === 1 ? `0${dig}` : dig;
    };
    const date = new Date();
    const hour = az(date.getHours());
    const minutes = az(date.getMinutes());
    const seconds = az(date.getSeconds());
    const milis = az(date.getMilliseconds());
    return `${hour}:${minutes}:${seconds}.${milis}`;
}
