//to make a bracket order we need to send an untransmitted parent order first so it will sit on tws but not
//send to the servers. once the parent order is sent, tws returns an order id. the order id is then passed to the 
//limit and stop order so they can be attached to the parent order as child orders...
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
//after the parent order is submitted, we need to send an untransmitted limit sell order for tp. finally send the stop
//order with transmit set to true. when the final orders transmit is set to true, tws will understand this as
//a bracket order and automatiaclly process the parent order and transmit the child limit tp order.
//tws api does not have functionality to access the automated bracket order preset options settings..
//there is also no option to submit the bracket child tp and stop orders placement percentage and requires
//price only. so to access the price we will either need to look at making a bracket order an unconventional
//way by submitting the parent order, wait, get the execttion details from tws and see the fill price, or,
//we can first make a request for delayed market data on the contract, see the last price, then build the 
//bracket order from there.
import { parseAlert } from "./Utils/AlertParser.js";
import { Client, Contract, Order } from "ib-tws-api-jj";
/**
 * Get the contract from twsapi
 * @param {Contract} Contract
 * @param {orderOptions} orderOptions
 * @param {string} contractDate
 * @returns ibkr option contract
 */
function makeContract(Contract, orderOptions, contractDate) {
    return Contract.option({
        symbol: orderOptions.symbol,
        right: orderOptions.right,
        lastTradeDateOrContractMonth: contractDate,
        strike: orderOptions.strikePrice
    });
}
/**
 * Gets the current market price of contract to calc stoploss and limit sell to attach to parent order.
 * If we are running in realtime we need to request the contract details from twsapi and then request a
 * market data snapshot.
 * First set the market data type to 3 which is delayed market data.. tws will automatically switch
 * to realtime data if the user has the data subscription.
 * Call to api for market data snapshot.
 * Check if the returned snapshot is delayed or realtime data by checking the object properties.
 *
 * @param {Client} api
 * @param {Contract} contract
 * @param {Number} price
 * @returns price
 */
function getRealtimePrice(api, contract) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //get contract deets to submit for market data snapshot
            const contractDetails = yield api.getContractDetails(contract);
            yield api.reqMarketDataType(3);
            const marketData = yield api.getMarketDataSnapshot({
                contract: contractDetails[0].contract
            });
            if ('ask' in marketData)
                return marketData.ask;
            if ('delayedAsk' in marketData) {
                if (marketData.delayedAsk !== -1)
                    return marketData.delayedAsk;
            }
            if ('delayedLast' in marketData) {
                if (marketData.delayedLast !== -1)
                    return marketData.delayedLast;
            }
            throw new Error('Could not get price');
        }
        catch (err) {
            throw err;
        }
    });
}
/**
 *
 * @param n floating point number input as number or string
 * @param numOfDec number of decimals to truncate to
 * @returns floating point number
 */
function truncate(n, numOfDec) {
    return parseFloat(parseFloat(n.toString()).toFixed(numOfDec));
}
function modSpxProfitLossPrice(price) {
    return Math.round(price * 10) / 10;
}
function getStopPrice(orderOptions, price, configs) {
    const isSpx = orderOptions.symbol === 'SPX' ? true : false;
    const stopDec = isSpx ? configs.stopLossSpx : configs.stopLoss;
    const stopPrice = truncate((price - (price * stopDec)), 2);
    return isSpx ? modSpxProfitLossPrice(stopPrice) : stopPrice;
    //let stopPriceDelta = 0;
    //if(orderOptions.symbol === 'SPX') stopPriceDelta = calcM(price, configs.stopLossSpx);
    //else stopPriceDelta = calcM(price, configs.stopLoss);
    //let stopPrice = truncate((price - stopPriceDelta), 2);
    //let stopPrice2DpStr = parseFloat(stopPriceFloat.toString()).toFixed(2);
    //let stopPrice = parseFloat(stopPrice2DpStr);
    //if(orderOptions.symbol === 'SPX') stopPrice = modSpxProfitLossPrice(stopPrice);
    //console.log('stop price... ', stopPrice);
    //return stopPrice;
}
function getProfitTakerPrice(orderOptions, price, configs) {
    const isSpx = orderOptions.symbol === 'SPX' ? true : false;
    const limDec = isSpx ? configs.proffitTakerSpx : configs.proffitTaker;
    const limitPrice = truncate((price + (price * limDec)), 2);
    return isSpx ? modSpxProfitLossPrice(limitPrice) : limitPrice;
    /*let limitPriceDelta = 0;
    if(orderOptions.symbol === 'SPX') limitPriceDelta = calcM(price, configs.proffitTakerSpx);
    else limitPriceDelta = calcM(price, configs.proffitTaker);

    let limitPrice = truncate((price + limitPriceDelta),2);
    //let limitPrice2DpStr = parseFloat(limitPriceFloat.toString()).toFixed(2);
    //let limitPrice = parseFloat(limitPrice2DpStr);
    if(orderOptions.symbol === 'SPX') limitPrice = modSpxProfitLossPrice(limitPrice);
    console.log('limitSellPrice ... ', limitPrice);
    return limitPrice;*/
}
function alertUser(message, orderOptions) {
    console.log('Received ALERT: ', message, '\nplacing order... ');
    console.log('parsed order orderOptions:::: ', orderOptions);
    //let time = await api.getCurrentTime();
    //console.log('current time: ' + time);
}
/*function delay(time: number){
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve()
        }, time)
    })
}*/
export function startIbkr(event, configs) {
    return __awaiter(this, void 0, void 0, function* () {
        let contractDate = configs.contractDate;
        const isRealTime = configs.realTimeData;
        let orderSize = configs.orderSize;
        const maxOrder = configs.maxOrder;
        try {
            //load in api, parser and position handler
            //const ibkrapi = await import("ib-tws-api-jj");
            //const parseAlert = require("./Utils/AlertParser");
            //const posH = require("./positionHandler");
            //start client
            const api = new Client({
                host: '127.0.0.1',
                port: 7497
            });
            const t = yield api.getCurrentTime();
            console.log(t);
            //alerts events and place order
            event.on('alert', (message) => __awaiter(this, void 0, void 0, function* () {
                try {
                    console.log('slert first event: ', message);
                    //parse alert
                    const orderOptions = parseAlert(message);
                    if (!orderOptions)
                        return;
                    console.log('passed parser');
                    alertUser(message, orderOptions);
                    if (orderOptions.date) {
                        contractDate = `${contractDate.slice(0, contractDate.length - 2)}${orderOptions.date}`;
                        console.log('new contract date found: ', orderOptions.date);
                    }
                    //make contract
                    //----- maybe we need to first check the contrat if its there
                    console.log('making contract');
                    const contract = makeContract(Contract, orderOptions, contractDate);
                    console.log('returned contract: ', contract);
                    let price = null;
                    //get realtime price
                    console.log('get realtime price');
                    if (isRealTime)
                        price = yield getRealtimePrice(api, contract);
                    else
                        price = orderOptions.price;
                    //calc ordersize
                    if ((price * orderSize * 100) > maxOrder)
                        orderSize = 1;
                    //set up bracket order
                    //market order
                    const order = Order.market({
                        action: orderOptions.side,
                        totalQuantity: orderSize
                    }, false);
                    const parentId = yield api.placeOrder({
                        contract: contract,
                        order: order
                    });
                    //make limit sell order
                    const limitPrice = getProfitTakerPrice(orderOptions, price, configs);
                    const orderLimSell = Order.limit({
                        action: "SELL",
                        totalQuantity: orderSize,
                        lmtPrice: limitPrice
                    }, false, parentId);
                    yield api.placeOrder({
                        contract: contract,
                        order: orderLimSell
                    });
                    //make stop order
                    const stopPrice = getStopPrice(orderOptions, price, configs);
                    const orderStop = (() => {
                        if (configs.trailingStop) {
                            return Order.stop({
                                action: "SELL",
                                totalQuantity: orderSize,
                                auxPrice: stopPrice,
                                adjustedStopPrice: 7,
                                triggerPrice: 11.00,
                                adjustedOrderType: "TRAIL",
                                adjustableTrailingUnit: 100,
                                adjustedTrailingAmount: configs.adjustedTrailingAmount
                            }, true, parentId);
                        }
                        else {
                            return Order.stop({
                                action: "SELL",
                                totalQuantity: orderSize,
                                auxPrice: stopPrice
                            }, true, parentId);
                        }
                    })();
                    yield api.placeOrder({
                        contract: contract,
                        order: orderStop
                    });
                    /*const orderStop = ibkrapi.Order.stop({
                        action: "SELL",
                        totalQuantity: orderSize,
                        auxPrice: stopPrice
                    }, true, parentId);
    
                    const orderStopTrail = ibkrapi.Order.trail({
                        action: "SELL",
                        totalQuantity: orderSize,
                        auxPrice: stopPrice,
                        adjustableTrailingUnit: configs.adjustableTrailingUnit
                    }, true, parentId);*/
                    console.log('Orders Sent...');
                }
                catch (err) {
                    console.log(err);
                }
            }));
        }
        catch (err) {
            console.log(err);
        }
    });
}
//export default startIbkr
//module.exports.startIbkr = startIbkr
