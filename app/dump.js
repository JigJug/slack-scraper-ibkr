"use strict";
//load in api, parser and position handler
//const ibkrapi = await import("ib-tws-api-jj");
//const parseAlert = require("./Utils/AlertParser");
//const posH = require("./positionHandler");
Object.defineProperty(exports, "__esModule", { value: true });
/*function makeLimitOrder (
    orderSize: number,
    limitPrice: number,
    parentId: number
) {
    return Order.limit({
        action: "SELL",
        totalQuantity: orderSize,
        lmtPrice: limitPrice
    }, false, parentId);
}

function makeStopOrder (
    configs: any,
    orderSize: number,
    stopPrice: number,
    parentId: number
) {
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
}*/
//const orderStop = makeStopOrder(configs, orderSize, stopPrice, parentId);
//await placeOrder(api, contract, orderStop);
/*const orderStop = (() => {
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
})();*/
/*await api.placeOrder({
    contract: contract,
    order: orderStop
});*/
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
/*const orderLimSell = Order.limit({
action: "SELL",
totalQuantity: orderSize,
lmtPrice: limitPrice
}, false, parentId);*/
//await placeOrder(api, contract, orderLimSell); 
/*await api.placeOrder({
    contract: contract,
    order: orderLimSell
});*/
/*const order = Order.market({
action: orderOptions.side,
totalQuantity: orderSize
}, false);*/
//const parentId = await placeOrder(api, contract, order);
/*const parentId = await api.placeOrder({
    contract: contract,
    order: order
});*/ 
