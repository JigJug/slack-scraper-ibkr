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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Run_1 = require("./Run");
const events_1 = __importDefault(require("events"));
const https_1 = require("./Utils/https");
const event = new events_1.default();
//start scraping
(0, Run_1.runScraper)(event);
//listen for alerts
event.on('alert', (message) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('EVENTS NEW ALERT: ', message);
    let body = {
        "conids": [
            603369152
        ]
    };
    //const options = makeOptions(RM.POST, ApiEndpoints.ORDER, body);
    const options = makeOptions(RM.POST, ApiEndpoints.AUTH);
    try {
        const retDat = yield (0, https_1.req)(options, false);
        console.log('REPLY FROM IBKR: ', retDat);
    }
    catch (err) {
        console.error(err);
    }
}));
//send tickle to ibkr server every 5 mins to keep open connection
setInterval(() => {
    const options = makeOptions(RM.POST, ApiEndpoints.TICKLE);
    (0, https_1.req)(options, false)
        .then((data) => {
        console.log('tickled server... ', data);
    })
        .catch((err) => {
        console.error(err);
    });
}, 60000 * 5);
function makeOptions(method, endPoint, body) {
    let options = {
        host: 'localhost',
        port: '5000',
        path: `/v1/api/${endPoint}`,
        method: method,
        rejectUnauthorized: false,
        headers: null
    };
    if (body) {
        let buf = Buffer.from(JSON.stringify(body));
        let buflen = buf.byteLength;
        options.headers = { "User-Agent": "Console", 'content-type': 'application/json', 'Content-Length': `${buflen}` };
        return options;
    }
    options.headers = { "User-Agent": "Console", 'content-type': 'application/json' };
    return options;
}
var RM;
(function (RM) {
    RM["GET"] = "GET";
    RM["POST"] = "POST";
})(RM || (RM = {}));
var ApiEndpoints;
(function (ApiEndpoints) {
    ApiEndpoints["TICKLE"] = "tickle";
    ApiEndpoints["AUTH"] = "iserver/auth/status";
    ApiEndpoints["VALIDATE"] = "sso/validate";
    ApiEndpoints["PNL"] = "iserver/account/pnl/partitioned";
    ApiEndpoints["CHANGE_ACCOUNT"] = "iserver/account";
    ApiEndpoints["GET_ACCOUNTS"] = "portfolio/accounts";
    ApiEndpoints["GET_SUBACCOUNTS"] = "portfolio/subaccounts";
    ApiEndpoints["SCHEDULETSLA"] = "trsrv/secdef/schedule?assetClass=OPT&symbol=TSLA";
    ApiEndpoints["SECDEF"] = "trsrv/secdef";
    ApiEndpoints["ORDER"] = "";
})(ApiEndpoints || (ApiEndpoints = {}));
