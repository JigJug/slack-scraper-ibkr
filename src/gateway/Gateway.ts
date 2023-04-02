import { runScraper } from "./Run";
import events from "events"
import { req } from "./Utils/https";
const event = new events();


//start scraping
runScraper(event);

//listen for alerts
event.on('alert', async (message) => {

    console.log('EVENTS NEW ALERT: ', message)

    let body = {
        "conids": [
            603369152
        ]
    }
    
    //const options = makeOptions(RM.POST, ApiEndpoints.ORDER, body);

    const options = makeOptions(RM.POST, ApiEndpoints.AUTH);

    try {
        const retDat = await req(options, false);

        console.log('REPLY FROM IBKR: ', retDat);
    } catch (err) {
        console.error(err);
    }

})


//send tickle to ibkr server every 5 mins to keep open connection
setInterval(() => {
    const options = makeOptions(RM.POST, ApiEndpoints.TICKLE);
    req(options, false)
    .then((data) => {
        console.log('tickled server... ', data)
    })
    .catch((err) => {
        console.error(err);
    })
}, 60000*5)



function makeOptions(method: RM, endPoint: ApiEndpoints, body?:any){
    let options: ReqOptions = {
        host: 'localhost',
        port: '5000',
        path: `/v1/api/${endPoint}`,
        method: method,
        rejectUnauthorized: false,
        headers: null
    }
    if(body){
        let buf = Buffer.from(JSON.stringify(body));
        let buflen = buf.byteLength;
        options.headers = {"User-Agent": "Console",'content-type': 'application/json', 'Content-Length': `${buflen}`}
        return options
    }
    options.headers = {"User-Agent": "Console",'content-type': 'application/json'}
    return options
}

interface ReqOptions {
    host: string;
    port: string;
    path: string;
    method: string;
    rejectUnauthorized: boolean;
    headers: HeaderPostBody | HeaderNormal | null;
}

interface HeaderPostBody {
    'User-Agent': string;
    'content-type': string;
    'Content-Length': string;
}

interface HeaderNormal {
    'User-Agent': string;
    'content-type': string;
}


enum RM{
    GET = "GET",
    POST = "POST"
}



enum ApiEndpoints{
    TICKLE = 'tickle',
    AUTH = 'iserver/auth/status',
    VALIDATE = 'sso/validate',
    PNL = 'iserver/account/pnl/partitioned',
    CHANGE_ACCOUNT = 'iserver/account',
    GET_ACCOUNTS = 'portfolio/accounts',
    GET_SUBACCOUNTS = 'portfolio/subaccounts',
    SCHEDULETSLA = 'trsrv/secdef/schedule?assetClass=OPT&symbol=TSLA',
    SECDEF = 'trsrv/secdef',
    ORDER = ''
}

interface order {
    "orders": [
      {
        "acctId": "string",
        "conid": 0,
        "conidex": "conidex = 265598",
        "secType": "secType = 265598:STK",
        "cOID": "string",
        "parentId": "string",
        "orderType": "string",
        "listingExchange": "string",
        "isSingleGroup": true,
        "outsideRTH": true,
        "price": 0,
        "auxPrice": "string",
        "side": "string",
        "ticker": "string",
        "tif": "string",
        "trailingAmt": 0,
        "trailingType": "amt",
        "referrer": "QuickTrade",
        "quantity": 0,
        "cashQty": 0,
        "fxQty": 0,
        "useAdaptive": true,
        "isCcyConv": true,
        "allocationMethod": "string",
        "strategy": "string",
        "strategyParameters": {}
      }
    ]
}