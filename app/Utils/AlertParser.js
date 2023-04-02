"use strict";
function parseAlert(alert) {
    alert = alert.replace('-', '');
    const splitAlert = alert.split(' ');
    const right = (() => {
        const parse = splitAlert[4].match(/C|P/);
        return parse != null ? parse[0] : null;
    })();
    const strike = parseFloat(splitAlert[4].replace(/C|P/, ''));
    const side = (() => {
        return splitAlert[2] == 'BOUGHT' ? 'BUY' : 'SELL';
    })();
    const oprderParam = {
        side: side,
        symbol: splitAlert[3],
        right: right,
        strikePrice: strike,
        price: parseFloat(splitAlert[5].replace('$', ''))
    };
    console.log(oprderParam);
    /*return (
        oprderParam.side === 'BUY'
        && typeof oprderParam.strikePrice == 'number'
        && typeof oprderParam.right == 'string'
        ? oprderParam : null
    )*/
}
module.exports.parseAlert = parseAlert;
