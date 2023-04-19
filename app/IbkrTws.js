
async function startIbkr(event, configs){

    const contractDate = configs.contractDate;
    const isRealTime = configs.realTimeData;
    let orderSize = configs.orderSize;
    const maxOrder = configs.maxOrder;

    try {
        //load in api, parser and position handler
        const ibkrapi = await import("ib-tws-api-jj");
        const parseAlert = require("./Utils/AlertParser");
        const posH = require("./positionHandler");

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

                console.log('Recieved ALERT: ', message, '\nplacing order... ');
                console.log('parsed order orderOptions:::: ', orderOptions);

                let time = await api.getCurrentTime();
                console.log('current time: ' + time);

                //to make a bracket order we need to send an untransmitted parent order first so it will sit on tws but not
                //send to the servers. once the parent order is sent, tws returns an order id. the order id is then passed to the 
                //limit and stop order so they can be attached to the parent order as child orders. after the parent order is
                //submitted we need to send an untransmitted limit sell order for tp. finally send the stop
                //order with transmit set to true. with the last orders transmit is set to true, tws will understand this as
                //a bracket order and automatiaclly process the parent order and transmit the child limit tp order. 

                //tws api does not have functionality to access the automated bracket order preset options settings..
                //there is also no option to submit the bracket child tp and stop orders placement percentage and requires
                //price only. so to access the price we will either need to look at making a bracket order an unconventional
                //way by submitting the parent order, wait, get the execttion details from tws and see the fill price, or,
                //we can first make a request for delayed market data on the contract, see the last price, then build the 
                //bracket order from there.

                if(orderOptions.date) {
                    contractDate = `${contractDate.slice(0, contractDate.length -2)}${orderOptions.date}`
                    console.log('new contract date found: ', orderOptions.date)
                }

                //make contract
                const contract = ibkrapi.Contract.option({
                    symbol: orderOptions.symbol,
                    right: orderOptions.right,
                    lastTradeDateOrContractMonth: contractDate,
                    strike: orderOptions.strikePrice
                });

                let price = null;

                //NOW USING THE PRICE FROM ALERT SO IGNORE MARKET DATA
                if(isRealTime){
                    //get contract deets to submit for market data snapshot
                    const contractDetails = await api.getContractDetails(contract);

                    //format the reply to make request
                    const c = {
                        contract: contractDetails[0].contract
                    }

                    console.log(c);
                    console.log(c.contract.conId);

                    //request market data feed type. 3 is for delayed market data
                    await api.reqMarketDataType(3);
                    console.log('set market data type to: ', api._marketDataType);
                
                    const marketData = await api.getMarketDataSnapshot(c);

                    console.log('first order xy: ', marketData);

                    if('delayedAsk' in marketData){
                        if(marketData.delayedAsk !== -1)  price = marketData.delayedAsk;
                        if(marketData.delayedLast !== -1)  price = marketData.delayedLast;
                    } else if('delayedLast' in marketData){
                        if(marketData.delayedLast !== -1 && price == null)  price = marketData.delayedLast;
                    } else {
                        price = marketData.ask;
                    } 
                    
                } else {
                    price = orderOptions.price;
                }

                //calc ordersize
                if((price * orderSize * 100) > maxOrder) orderSize = 1;
                
                //set up bracket order
                //get last price and cal % for limit and stop
                let stopPrice = price * configs.stopLoss;
                let limitPrice = price * configs.proffitTaker;

                //market order
                const order = ibkrapi.Order.market({
                    action: orderOptions.side,
                    totalQuantity: orderSize
                }, false);

                const parentId = await api.placeOrder({
                    contract: contract,
                    order: order
                });
                
                //get % and make limit sell
                let pl = price + limitPrice;
                let stpPrice11 = parseFloat(pl).toFixed(2);
                let stpPrice1 = parseFloat(stpPrice11);
                console.log('stpprice1 ... ', stpPrice1);
                
                const orderLimSell = ibkrapi.Order.limit({
                    action: "SELL",
                    totalQuantity: 1,
                    lmtPrice: stpPrice1
                }, false, parentId);

                await api.placeOrder({
                    contract: contract,
                    order: orderLimSell
                });
                
                //make stop order
                let ps = price - stopPrice;
                let stpPricee = parseFloat(ps).toFixed(2);
                let stpPrice = parseFloat(stpPricee);
                console.log('stop price... ', stpPrice);
                
                const orderStop = ibkrapi.Order.stop({
                    action: "SELL",
                    totalQuantity: 1,
                    auxPrice: stpPrice
                }, true, parentId);

                await api.placeOrder({
                    contract: contract,
                    order: orderStop
                });

                
                console.log('Orders Sent...');

            } catch (err) {
                console.log(err);
            }
            
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

module.exports.startIbkr = startIbkr
