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


/**
 * Get the contract from twsapi
 * @param {ibkrapi} ibkrapi 
 * @param {orderOptions} orderOptions 
 * @param {string} contractDate 
 * @returns ibkr option contract
 */
function makeContract(ibkrapi, orderOptions, contractDate) {
	return ibkrapi.Contract.option({
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
async function getRealtimePrice (api, contract) {
	try {
		//get contract deets to submit for market data snapshot
		const contractDetails = await api.getContractDetails(contract);

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

function modSpxProfitLossPrice (price) {
  return Math.round(price * 10) / 10;
}

function getStopPrice(orderOptions, price, configs) {
	let stopPriceDelta = 0;
	if(orderOptions.symbol === 'SPX') stopPriceDelta = price * configs.stopLossSpx;
	else stopPriceDelta = price * configs.stopLoss;
	let stopPriceFloat = price - stopPriceDelta;
	let stopPrice2DpStr = parseFloat(stopPriceFloat).toFixed(2);
	let stopPrice = parseFloat(stopPrice2DpStr);
	if(orderOptions.symbol === 'SPX') stopPrice = modSpxProfitLossPrice(stopPrice);
	console.log('stop price... ', stopPrice);
	return stopPrice;
}

function getProfitTakerPrice(orderOptions, price, configs) {
	let limitPriceDelta = 0;
	if(orderOptions.symbol === 'SPX') limitPriceDelta = price * configs.proffitTakerSpx;
	else limitPriceDelta = price * configs.proffitTaker;
	let limitPriceFloat = price + limitPriceDelta;
	let limitPrice2DpStr = parseFloat(limitPriceFloat).toFixed(2);
	let limitPrice = parseFloat(limitPrice2DpStr);
	if(orderOptions.symbol === 'SPX') limitPrice = modSpxProfitLossPrice(limitPrice);
	console.log('limitSellPrice ... ', limitPrice);
	return limitPrice;
}

function alertUser(){
	console.log('Received ALERT: ', message, '\nplacing order... ');
	console.log('parsed order orderOptions:::: ', orderOptions);
	//let time = await api.getCurrentTime();
	//console.log('current time: ' + time);
}

function delay(time){
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve()
		}, time)
	})
}

async function startIbkr(event, configs){

	let contractDate = configs.contractDate;
	const isRealTime = configs.realTimeData;
	let orderSize = configs.orderSize;
	const maxOrder = configs.maxOrder;

	try {
		//load in api, parser and position handler
		const ibkrapi = await import("ib-tws-api-jj");
		const parseAlert = require("./Utils/AlertParser");
		//const posH = require("./positionHandler");

		//start client
		const api = new ibkrapi.Client({
			host: '127.0.0.1',
			port: 7497
		});

		//alerts events and place order
		event.on('alert', async (message) => {
			try {

				//parse alert
				const orderOptions = parseAlert.parseAlert(message);

				if(!orderOptions) return

				alertUser();

				if(orderOptions.date) {
					contractDate = `${contractDate.slice(0, contractDate.length -2)}${orderOptions.date}`;
					console.log('new contract date found: ', orderOptions.date);
				}

				//make contract
				//----- maybe we need to first check the contrat if its there
				const contract = makeContract(ibkrapi, orderOptions, contractDate);
				let price = null;
				//get realtime price
				if(isRealTime) price = await getRealtimePrice(api, contract, price);
				else price = orderOptions.price;

				//calc ordersize
				if((price * orderSize * 100) > maxOrder) orderSize = 1;
				
				//set up bracket order
				//market order
				const order = ibkrapi.Order.market({
					action: orderOptions.side,
					totalQuantity: orderSize
				}, false);

				const parentId = await api.placeOrder({
					contract: contract,
					order: order
				});

				//make limit sell order
				const limitPrice = getProfitTakerPrice(orderOptions, price, configs);
				
				const orderLimSell = ibkrapi.Order.limit({
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
						return ibkrapi.Order.trail({
							action: "SELL",
							totalQuantity: orderSize,
							auxPrice: stopPrice,
							adjustableTrailingUnit: configs.adjustableTrailingUnit
						}, true, parentId);
					} else {
						return ibkrapi.Order.stop({
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

module.exports.startIbkr = startIbkr
