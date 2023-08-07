import { Client, Contract, Order } from "ib-tws-api-jj";
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
		const contractDetails = await api.getContractDetails(contract);

		await api.reqMarketDataType(3);

		const marketData = await api.getMarketDataSnapshot({
			contract: contractDetails[0].contract
		});

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

/**
 * 
 * @param n floating point number input as number or string
 * @param numOfDec number of decimals to truncate to
 * @returns floating point number
 */
function truncate(n: number | string, numOfDec: number): number {
	return parseFloat(parseFloat(n.toString()).toFixed(numOfDec));
}

function modSpxProfitLossPrice (price: number) {
  return Math.round(price * 10) / 10;
}

function getStopPrice(orderOptions: any, price: number, configs: any) {
	const isSpx = orderOptions.symbol === 'SPX' ? true : false;
	const stopDec = isSpx ? configs.stopLossSpx : configs.stopLoss;
	const stopPrice = truncate((price - (price * stopDec)), 2);
	return isSpx ? modSpxProfitLossPrice(stopPrice) : stopPrice;
}

function getProfitTakerPrice(orderOptions: any, price: number, configs: any) {
	const isSpx = orderOptions.symbol === 'SPX' ? true : false;
	const limDec = isSpx ? configs.proffitTakerSpx : configs.proffitTaker;
	const limitPrice = truncate((price + (price * limDec)), 2);
	return isSpx ? modSpxProfitLossPrice(limitPrice) : limitPrice;
}

function alertUser(message: string, orderOptions: any){
	console.log('Received ALERT: ', message, '\nplacing order... ');
	console.log('parsed order orderOptions:::: ', orderOptions);
}

class IbkrTws {
    private event: events;
    private configs: any;
    private listener: null | events;
    private api: Client | null;

    constructor(event: events, configs: any) {
        this.event = event;
        this.configs = configs;
        this.listener = null;
    }

    async connect() {
        try {
            const api: Client = new Client({
                host: '127.0.0.1',
                port: 7497
            });
            this.api = api;
            const t = await api.getCurrentTime();
            console.log(t);
        } catch(err){
            throw err;
        }
    }

    startListener() {
        if(this.listener) return;
        this.listener = this.event.on('alert', this.placeOrder);
    }

    private async placeOrder(message: string) {
        try {
            console.log('this.configs', this.configs)
            const api = this.api;
            const configs = this.configs;
            let contractDate = this.configs.contractDate;
            const isRealTime = this.configs.realTimeData;
            let orderSize = this.configs.orderSize;
            const maxOrder = this.configs.maxOrder;

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
            let price: number;
            //get realtime price
            console.log('get realtime price')
            if(isRealTime) price = await getRealtimePrice(api, contract);
            else price = orderOptions.price!;

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
            
            console.log('Orders Sent...');

        } catch (err) {
            console.log(err);
        }
    }

}

export {IbkrTws}