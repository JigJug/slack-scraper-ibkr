
/*export async function startIbkr(event, con){
    try {

        const ibkrapi = await import("ib-tws-api")


        const api = new ibkrapi.Client({
            host: '127.0.0.1',
            port: 7497
        });

    
        event.on('alert', async (message) => {
        
            console.log('Recieved ALERT: ', message, '\nplacing order... ');

            let time = await api.getCurrentTime();
            console.log('current time: ' + time);

            let order1 = await api.placeOrder({
                contract: ibkrapi.Contract.stock('TSLA'),
                order: ibkrapi.Order.market({
                  action: 'BUY',
                  totalQuantity: 1
                })
            });

            await delay(5000);

            console.log('Open orders: ')

            let tslaCtrt = await api.getAllOpenOrders();
            console.log(tslaCtrt[0].contract);
        });
        
    } catch (err) {
        console.log(err);
    }
}

function delay(time){
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, time)
    })
}

export async function positionTracker(){
    try {
        const pos = await api.getPositions();
        console.log(pos)
    } catch (err) {
        console.log(err)
    }
    
}

module.exports.startIbkr = startIbkr*/

//to make a bracket order we need to send an untransmitted parent order first so it will sit on tws but not
//send to the servers. once the parent order is sent, tws returns an order id. the order id is then passed to the 
//limit and stop order so they can be attached to the parent order as child orders...

//after the parent order is submitted, we need to send an untransmitted limit sell order for tp. finally send the stop
//order with transmit set to true. when the final orders transmit is set to true, tws will understand this as
//a bracket order and automatiaclly process the parent order and transmit the child limit tp order.

//tws api does not have functionality to access the automated bracket order preset options settings..
//there is also no option to submit the bracket child tp and stop orders placement percentage and requires
//price only. so to access the price we will either need to look at making a bracket order an unconventional
//way by submitting the parent order, wait, get the execttion details from tws and see the fill price, or,
//we can first make a request for delayed market data on the contract, see the last price, then build the 
//bracket order from there.

import { parseAlert} from "./Utils/AlertParser.js";
import { Client, Contract, Order } from "ib-tws-api-jj";
import events from "events"

/**
 * Get the contract from twsapi
 * @param {Contract} Contract 
 * @param {orderOptions} orderOptions 
 * @param {string} contractDate 
 * @returns ibkr option contract
 */
function makeContract(Contract: Contract, orderOptions: any, contractDate: string) {
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
async function getRealtimePrice (api: Client, contract: any) {
	try {
		//get contract deets to submit for market data snapshot
		console.log('get con deets');
		const contractDetails = await api.getContractDetails(contract);
		console.log('ret con deets', contractDetails);
		//format the reply to make request
		//const c = {
		//	contract: contractDetails[0].contract
		//}

		console.log('contract: ', contractDetails[0].contract);

		await api.reqMarketDataType(3);

		const marketData = await api.getMarketDataSnapshot({
			contract: contractDetails[0].contract
		});

		console.log('market data: ', marketData);

		if('ask' in marketData) return marketData.ask;
		if('delayedAsk' in marketData) {
			if(marketData.delayedAsk !== -1) return marketData.delayedAsk;
		}
		if('delayedLast' in marketData) {
			if(marketData.delayedLast !== -1) return marketData.delayedLast;
		}
		throw new Error('Could not get price');

	} catch (err) {
		throw err
	}

}

function modSpxProfitLossPrice (price: number) {
  return Math.round(price * 10) / 10;
}

function getStopPrice(orderOptions: any, price: number, configs: any) {
	let stopPriceDelta = 0;
	if(orderOptions.symbol === 'SPX') stopPriceDelta = price * configs.stopLossSpx;
	else stopPriceDelta = price * configs.stopLoss;
	let stopPriceFloat = price - stopPriceDelta;
	let stopPrice2DpStr = parseFloat(stopPriceFloat.toString()).toFixed(2);
	let stopPrice = parseFloat(stopPrice2DpStr);
	if(orderOptions.symbol === 'SPX') stopPrice = modSpxProfitLossPrice(stopPrice);
	console.log('stop price... ', stopPrice);
	return stopPrice;
}

function getProfitTakerPrice(orderOptions: any, price: number, configs: any) {
	let limitPriceDelta = 0;
	if(orderOptions.symbol === 'SPX') limitPriceDelta = price * configs.proffitTakerSpx;
	else limitPriceDelta = price * configs.proffitTaker;
	let limitPriceFloat = price + limitPriceDelta;
	let limitPrice2DpStr = parseFloat(limitPriceFloat.toString()).toFixed(2);
	let limitPrice = parseFloat(limitPrice2DpStr);
	if(orderOptions.symbol === 'SPX') limitPrice = modSpxProfitLossPrice(limitPrice);
	console.log('limitSellPrice ... ', limitPrice);
	return limitPrice;
}

function alertUser(message: string, orderOptions: any){
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

export async function startIbkr(event: events, configs: any){

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
		const api: Client = new Client({
			host: '127.0.0.1',
			port: 7497
		});

		const t = await api.getCurrentTime();
		console.log(t);

		//alerts events and place order
		event.on('alert', async (message: string) => {
			try {
				console.log('slert first event: ', message)

				//parse alert
				const orderOptions = parseAlert(message);

				if(!orderOptions) return

				console.log('passed parser')

				alertUser(message, orderOptions);

				if(orderOptions.date) {
					contractDate = `${contractDate.slice(0, contractDate.length -2)}${orderOptions.date}`;
					console.log('new contract date found: ', orderOptions.date);
				}

				//make contract
				//----- maybe we need to first check the contrat if its there
				console.log('making contract')
				const contract = makeContract(Contract, orderOptions, contractDate);
				console.log('returned contract: ', contract)
				let price = null;
				//get realtime price
				console.log('get realtime price')
				if(isRealTime) price = await getRealtimePrice(api, contract);
				else price = orderOptions.price;

				//calc ordersize
				if((price * orderSize * 100) > maxOrder) orderSize = 1;
				
				//set up bracket order
				//market order
				const order = Order.market({
					action: orderOptions.side,
					totalQuantity: orderSize
				}, false);

				const parentId = await api.placeOrder({
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

				await api.placeOrder({
					contract: contract,
					order: orderLimSell
				});
				
				//make stop order
				const stopPrice = getStopPrice(orderOptions, price, configs);

				const orderStop = (() => {
					if(configs.trailingStop) {
						return Order.stop({
							action: "SELL",
							totalQuantity: orderSize,
							auxPrice: stopPrice,
							adjustedStopPrice: 7,
							triggerPrice: 11.00,
							adjustedOrderType: "TRAIL",
							adjustableTrailingUnit: 100, //unit = 100 tells tws its a %
							adjustedTrailingAmount: configs.adjustedTrailingAmount
						}, true, parentId);
					} else {
						return Order.stop({
							action: "SELL",
							totalQuantity: orderSize,
							auxPrice: stopPrice
						}, true, parentId);
					}
				})();

				await api.placeOrder({
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

			} catch (err) {
				console.log(err);
			}
		});
	} catch (err) {
		console.log(err);
	}
}
//export default startIbkr
//module.exports.startIbkr = startIbkr