"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
            const ibkrapi = yield Promise.resolve().then(() => __importStar(require("ib-tws-api")));
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
