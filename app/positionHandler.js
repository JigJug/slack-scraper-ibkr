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
class PositionHandler {
    constructor(api) {
        this.api = api;
        this.positions = {};
    }
    trackPosition(contract) {
        return __awaiter(this, void 0, void 0, function* () {
            //let eL = await this.api.streamMarketData({
            //    contract: contract
            //});
            let e = yield this.api.getMarketDataSnapshot({
                contract: contract
            });
            console.log(e);
            //e.on('tick', (t: any) => {
            //    console.log(t.ticker);
            //});
            //e.on('error', (t: any) => {
            //    console.log('error');
            //    console.log(t);
            //});
            //setTimeout(() => {
            //    e.stop();
            //    console.log('shut down streaming');
            //}, 120000);
        });
    }
}
module.exports.PositionHandler = PositionHandler;
class Ticker {
}
