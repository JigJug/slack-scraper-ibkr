interface OptionOrderParam {
    side: string | null;
    symbol: string | null;
    right: string | null;
    strikePrice: number | null;
    price: number | null;
    date?: number | null;
}

export function parseAlert(alert: string){

    const oprderParam: OptionOrderParam = {
        side: null,
        symbol: null,
        right: null,
        strikePrice: null,
        price: null
    }

    let strikeIndex = 6;
    let priceIndex = 7;

    alert = alert.replace(/-/g, '')
    
    const splitAlert = alert.split(' ');

    if(splitAlert[7].indexOf('$') === -1 ){
        strikeIndex = strikeIndex + 2;
        priceIndex = priceIndex + 2;
        oprderParam.date = parseInt(splitAlert[7]);
    }

    const side: string = (() => {
        return splitAlert[3] == 'BOUGHT'? 'BUY' : 'SELL'
    })();

    const symbol = splitAlert[5];
    
    const right = (() => {
        const parse = splitAlert[strikeIndex].match(/C|P/);
        return parse != null? parse[0] : null
    })();

    const strike = parseFloat(splitAlert[strikeIndex].replace(/C|P/, ''));

    const price = parseFloat(splitAlert[priceIndex].replace('$', ''));
    
    oprderParam.side = side;
    oprderParam.symbol = symbol;
    oprderParam.right = right;
    oprderParam.strikePrice = strike;
    oprderParam.price = price;
    
    return (
        oprderParam.side === 'BUY'
        && typeof oprderParam.strikePrice == 'number'
        && typeof oprderParam.right == 'string'
        ? oprderParam : null
    )
}
