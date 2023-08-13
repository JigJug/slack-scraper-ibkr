export interface OrderOptions {
    side: string | null;
    symbol: string | null;
    right: string | null;
    strikePrice: number | null;
    price: number | null;
    date: string | null;
    newDate: boolean;
}

export function parseAlert(alert: string, contractDate: string){

    const orderParam: OrderOptions = {
        side: null,
        symbol: null,
        right: null,
        strikePrice: null,
        price: null,
        date: contractDate,
        newDate: false
    }

    let strikeIndex = 6;
    let priceIndex = 7;

    alert = alert.replace(/-/g, '');
    
    const splitAlert = alert.split(' ');

    //check if new date is in alert
    if(splitAlert[7].indexOf('$') === -1 ){
        strikeIndex = strikeIndex + 2;
        priceIndex = priceIndex + 2;
        const d = parseInt(splitAlert[7]);
        orderParam.date = `${contractDate.slice(0, contractDate.length -2)}${d}`;
    }

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

    //check if spx and z-dte
    if(!orderParam.newDate) {
        if(symbol === 'SPX') {
            orderParam.date = todaysDate();
        }
    }
    
    orderParam.side = side;
    orderParam.symbol = symbol;
    orderParam.right = right;
    orderParam.strikePrice = strike;
    orderParam.price = price;
    
    console.log(orderParam);

    return (
        orderParam.side === 'BUY'
        && typeof orderParam.strikePrice == 'number'
        && typeof orderParam.right == 'string'
        ? orderParam
        : null
    )
}

function todaysDate () {
    const nd = new Date();
    const addZero = (dig: number) => {
        return dig.toString().length === 1 ? `0${dig}` : dig;
    }
    return `${nd.getFullYear()}${addZero((nd.getUTCMonth()+1))}${addZero(nd.getDate())}`
}