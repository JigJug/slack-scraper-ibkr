
export async function startIbkr(event, con){
    try {

        const ibkrapi = await import("ib-tws-api")


        const api = new ibkrapi.Client({
            host: '127.0.0.1',
            port: 7497
        });

    
        event.on('alert', async (message) => {
        
            console.log('Recieved ALERT: ', message, '\nplacing order... ');

            let time = await api.getCurrentTime();
            console.log('current time: ' + time);

            let order1 = await api.placeOrder({
                contract: ibkrapi.Contract.stock('TSLA'),
                order: ibkrapi.Order.market({
                  action: 'BUY',
                  totalQuantity: 1
                })
            });

            await delay(5000);

            console.log('Open orders: ')

            let tslaCtrt = await api.getAllOpenOrders();
            console.log(tslaCtrt[0].contract);
        });
        
    } catch (err) {
        console.log(err);
    }
}

function delay(time){
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, time)
    })
}

export async function positionTracker(){
    try {
        const pos = await api.getPositions();
        console.log(pos)
    } catch (err) {
        console.log(err)
    }
    
}

module.exports.startIbkr = startIbkr