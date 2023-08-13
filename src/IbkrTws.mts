/**
 * to make a bracket order we need to send an untransmitted parent order first so it will sit on tws but not
 * send to the servers. once the parent order is sent, tws returns an order id. the order id is then passed to the 
 * limit and stop order so they can be attached to the parent order as child orders...
 * 
 * after the parent order is submitted, we need to send an untransmitted limit sell order for tp. finally send the stop
 * order with transmit set to true. when the final orders transmit is set to true, tws will understand this as
 * a bracket order and automatiaclly process the parent order and transmit the child limit tp order.
 * 
 * tws api does not have functionality to access the automated bracket order preset options settings..
 * there is also no option to submit the bracket child tp and stop orders placement percentage and requires
 * price only. so to access the price we will either need to look at making a bracket order an unconventional
 * way by submitting the parent order, wait, get the execttion details from tws and see the fill price, or,
 * we can first make a request for market data on the contract, see the ask price, then build the 
 * bracket order from there.
 */

import { parseAlert} from "./Utils/AlertParser.js";
import { Client, Contract, Order } from "ib-tws-api-jj";
import events from "events"
import { OrderOptions } from "./Utils/AlertParser.js";
import { IbkrConfig } from "./typings.js";

/**
 * Get the contract from twsapi
 * @param {Contract} Contract 
 * @param {OrderOptions} orderOptions 
 * @param {string} contractDate 
 * @returns ibkr option contract
 */
function makeContract(Contract: Contract, orderOptions: OrderOptions) {
	return Contract.option({
		symbol: orderOptions.symbol,
		right: orderOptions.right,
		lastTradeDateOrContractMonth: orderOptions.date,
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
async function getPrice (api: Client, contract: any, isRealTime: boolean, orderOptions: OrderOptions) {
	try {
		if(!isRealTime) return orderOptions.price;
		//get contract deets to submit for market data snapshot
		console.log('get con deets');
		const contractDetails = await api.getContractDetails(contract);
		console.log('ret con deets', contractDetails);

		console.log('contract: ', contractDetails[0].contract);

		await api.reqMarketDataType(3);

		const marketData = await api.getMarketDataSnapshot({
			contract: contractDetails[0].contract
		});

		console.log('market data: ', marketData);

		if('ask' in marketData) return marketData.ask;
		if('delayedAsk' in marketData) {
			if(marketData.delayedAsk > 0) return marketData.delayedAsk;
		}
		if('delayedLast' in marketData) {
			if(marketData.delayedLast > 0) return marketData.delayedLast;
		}
		if('delayedClose' in marketData) {
			if(marketData.delayedClose > 0) return marketData.delayedClose;
		}
		return orderOptions.price;

	} catch (err) {
		console.log('using parsed price...')
		return orderOptions.price;
	}

}

/**
 * 
 * @param n floating point number input as number or string
 * @param numOfDec number of decimals to truncate to
 * @returns truncated floating point number
 */
function truncate(n: number | string, numOfDec: number): number {
	return parseFloat(parseFloat(n.toString()).toFixed(numOfDec));
}

function modSpxProfitLossPrice (price: number) {
  return Math.round(price * 10) / 10;
}

function isSpx (symbol: string) {
	return symbol === 'SPX' ? true : false;
}

function getStopPrice(orderOptions: OrderOptions, price: number, configs: IbkrConfig) {

	const spx = isSpx(orderOptions.symbol!);

	const stopDec = spx ? configs.stopLossSpx : configs.stopLoss;

	const stopPrice = truncate((price - (price * stopDec)), 2);

	return spx ? modSpxProfitLossPrice(stopPrice) : stopPrice;

}

function getProfitTakerPrice(orderOptions: OrderOptions, price: number, configs: IbkrConfig) {

	const spx = isSpx(orderOptions.symbol!);

	const limDec = spx ? configs.proffitTakerSpx : configs.proffitTaker;

	const limitPrice = truncate((price + (price * limDec)), 2);

	return spx ? modSpxProfitLossPrice(limitPrice) : limitPrice;

}

function alertUser(message: string, orderOptions: OrderOptions){
	console.log('Received ALERT: ', message, '\nplacing order... ');
	console.log('parsed order orderOptions:::: ', orderOptions);
}

function timeStamp () {
	return new Date().getTime();
}

function orderMarket (orderSize: number, oPms: OrderParams) {
	return Order.market({
		action: oPms.orderOptions!.side,
		totalQuantity: orderSize
	}, false);
}

function orderLimitSell (orderSize: number, oPms: OrderParams) {
	return Order.limit({
		action: "SELL",
		totalQuantity: orderSize,
		lmtPrice: oPms.stpLmPrice
	}, false, oPms.parentId);
}

function orderStop (orderSize: number, oPms: OrderParams) {
	return Order.stop({
		action: "SELL",
		totalQuantity: orderSize,
		auxPrice: oPms.stpLmPrice
	}, true, oPms.parentId);
}

function orderTrail(orderSize: number, oPms: OrderParams) {
	return Order.stop({
		action: "SELL",
		totalQuantity: orderSize,
		auxPrice: oPms.stpLmPrice,
		adjustedStopPrice: 7,
		triggerPrice: 11.00,
		adjustedOrderType: "TRAIL",
		adjustableTrailingUnit: 100, //unit = 100 tells tws its a %
		adjustedTrailingAmount: oPms.configs!.adjustedTrailingAmount
	}, true, oPms.parentId)
}

async function placeOrder (
	api: Client,
	contract: Contract,
	order: () => Order
) {
	return api.placeOrder({
		contract: contract,
		order: order()
	});
}

interface OrderParams {
	stpLmPrice?: number,
	parentId?: number,
	orderOptions?: OrderOptions,
	configs?: IbkrConfig
}

function makeOrder (
	type: 'MARKET' | 'LIMIT' | 'STOP',
	api: Client,
	contract: Contract,
	orderSize: number,
	oPms: OrderParams
) {
	const order: Record<string, () => Order> = {
		MARKET: () => {
			return orderMarket(orderSize, oPms);
		},
		LIMIT: () => {
			return orderLimitSell(orderSize, oPms);
		},
		STOP: () => {
			return oPms.configs!.trailingStop
			? orderTrail(orderSize, oPms)
			: orderStop(orderSize, oPms)
		}
	}
	return placeOrder(api, contract, order[type]);
}

async function sendOrders(
	api: Client,
	orderOptions: OrderOptions,
	contract: Contract,
	orderSize: number,
	price: number,
	configs: IbkrConfig
) {
	try {
		//set up bracket order
		//market order
		const parentId = await makeOrder('MARKET', api, contract, orderSize, {orderOptions});

		//make limit sell order
		//const limitPrice = getProfitTakerPrice(orderOptions, price, configs);

		await makeOrder('LIMIT', api, contract, orderSize, {
			stpLmPrice: getProfitTakerPrice(orderOptions, price, configs),
			parentId
		});
		
		//make stop order
		//const stopPrice = getStopPrice(orderOptions, price, configs);
		await makeOrder('STOP', api, contract, orderSize, {
			configs,
			stpLmPrice: getStopPrice(orderOptions, price, configs),
			parentId
		});
		
	} catch (err) {
		throw err;
	}
}

export async function startIbkr(event: events, configs: IbkrConfig){

	const isRealTime = configs.realTimeData;
	const maxOrder = configs.maxOrder;
	
	try {

		//start client
		const api: Client = new Client({
			host: '127.0.0.1',
			port: 7497,
			timeoutMs: 30000
		});

		const t = await api.getCurrentTime();
		console.log(t);

		//alerts events and place order
		event.on('alert', async (message: string) => {
			try {
				const timeNow = timeStamp();
				//parse alert
				const orderOptions = parseAlert(message, configs.contractDate);

				if(!orderOptions) return

				alertUser(message, orderOptions);

				let orderSize = configs.orderSize;

				//make contract
				//----- maybe we need to first check the contrat if its there
				const contract = makeContract(Contract, orderOptions);
				console.log('returned contract: ', contract);

				//get price
				console.log('get price');
				let price = await getPrice(api, contract, isRealTime, orderOptions);

				//calc ordersize
				if((price * orderSize * 100) > maxOrder) orderSize = 1;
				
				await sendOrders(api, orderOptions, contract, orderSize, price, configs);

				console.log(`Orders Sent... and took ${(timeStamp() - timeNow) / 1000} seconds to complete`);

			} catch (err) {
				console.log(err);
			}
		});
	} catch (err) {
		console.log(err);
	}
}
