"use strict";
function parseAlert(alert) {
    const splitAlert = alert.split(' ');
    const right = (() => {
        const parse = splitAlert[6].match(/C|P/);
        return parse != null ? parse[0] : null;
    })();
    const strike = parseFloat(splitAlert[6].replace(/C|P/, ''));
    const side = (() => {
        return splitAlert[3] == 'BOUGHT' ? 'BUY' : 'SELL';
    })();
    const oprderParam = {
        side: side,
        symbol: splitAlert[5],
        right: right,
        strikePrice: strike,
        //bidAsk: parseFloat(splitAlert[7].replace('$', ''))
    };
    console.log(oprderParam);
    return (oprderParam.side === 'BUY'
        && typeof oprderParam.strikePrice == 'number'
        && typeof oprderParam.right == 'string'
        ? oprderParam : null);
}
module.exports.parseAlert = parseAlert;
