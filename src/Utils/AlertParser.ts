export interface OrderOptions {
    side: string | null;
    symbol: string | null;
    right: string | null;
    strikePrice: number | null;
    price: number | null;
    date?: number | null;
    zdte?: boolean | null;
}

export function parseAlert(alert: string){

    const oprderParam: OrderOptions = {
        side: null,
        symbol: null,
        right: null,
        strikePrice: null,
        price: null
    }

    let strikeIndex = 6;
    let priceIndex = 7;

    console.log('alert parser alert all: ', alert)

    alert = alert.replace(/-/g, '')
    console.log('alert parser alert replace -: ', alert);
    
    const splitAlert = alert.split(' ');
    console.log('alert parser alert split space: ', splitAlert);
    console.log(splitAlert.length);

    if(splitAlert[7].indexOf('$') === -1 ){// && splitAlert.length == 10){
        strikeIndex = strikeIndex + 2;
        priceIndex = priceIndex + 2;
        oprderParam.date = parseInt(splitAlert[7]);
    }
    //} else if(splitAlert.length > 8){
    //    console.log('Parser Error');
    //    return null
    //}

    const side: string = (() => {
        return splitAlert[3] == 'BOUGHT'? 'BUY' : 'SELL'
    })();

    const symbol = splitAlert[5];

    console.log(splitAlert[strikeIndex])
    
    const right = (() => {
        const parse = splitAlert[strikeIndex].match(/C|P/);
        return parse != null? parse[0] : null
    })();

    const strike = parseFloat(splitAlert[strikeIndex].replace(/C|P/, ''));

    const price = parseFloat(splitAlert[priceIndex].replace('$', ''));

    const zdte: boolean = (() => {
        return !oprderParam.date && symbol === 'SPX'  ? true : false;
    })();
    
    oprderParam.side = side;
    oprderParam.symbol = symbol;
    oprderParam.right = right;
    oprderParam.strikePrice = strike;
    oprderParam.price = price;
    oprderParam.zdte = zdte;
    
    console.log(oprderParam);

    return (
        oprderParam.side === 'BUY'
        && typeof oprderParam.strikePrice == 'number'
        && typeof oprderParam.right == 'string'
        ? oprderParam : null
    )
}