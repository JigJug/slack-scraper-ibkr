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
exports.positionTracker = exports.startIbkr = void 0;
function startIbkr(event, con) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ibkrapi = yield import("ib-tws-api");
            const api = new ibkrapi.Client({
                host: '127.0.0.1',
                port: 7497
            });
            event.on('alert', (message) => __awaiter(this, void 0, void 0, function* () {
                console.log('Recieved ALERT: ', message, '\nplacing order... ');
                let time = yield api.getCurrentTime();
                console.log('current time: ' + time);
                let order1 = yield api.placeOrder({
                    contract: ibkrapi.Contract.stock('TSLA'),
                    order: ibkrapi.Order.market({
                        action: 'BUY',
                        totalQuantity: 1
                    })
                });
                yield delay(5000);
                console.log('Open orders: ');
                let tslaCtrt = yield api.getAllOpenOrders();
                console.log(tslaCtrt[0].contract);
            }));
        }
        catch (err) {
            console.log(err);
        }
    });
}
exports.startIbkr = startIbkr;
function delay(time) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}
function positionTracker() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pos = yield api.getPositions();
            console.log(pos);
        }
        catch (err) {
            console.log(err);
        }
    });
}
exports.positionTracker = positionTracker;
module.exports.startIbkr = startIbkr;
