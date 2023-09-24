import { Client, Contract } from "ib-tws-api-jj";

class PositionHandler {
  api;
  positions: {};

  constructor(api: Client) {
    this.api = api;
    this.positions = {};
  }

  async trackPosition(contract: Contract) {
    //let eL = await this.api.streamMarketData({
    //    contract: contract
    //});

    let e = await this.api.getMarketDataSnapshot({
      contract: contract,
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
  }

  //addPosition(position){
  //    this.positions.push(posiion)
  //}
}

module.exports.PositionHandler = PositionHandler;

class Ticker {}
