import * as https from 'https'


export async function req(options: any, write: boolean, body?: any) {
    try {
        const dat:any = await httpRequest(options, write, body);
        return dat
    } catch (err) {
        throw err
    }
}

function httpRequest(options: any, write: boolean, body?: any){
    return new Promise((resolve, reject) => {
        
        let request = https.request(options, (res) => {
            if(res.statusCode !== 200) {
                console.error(`not ok... ${res.statusCode}`)
                res.resume();
                return;
            }

            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('close', () => {
                let resData = JSON.parse(data)
                resolve(resData);
            });

        });

        if(write) request.write(JSON.stringify(body))

        request.end();

        request.on('error', (err) => {
            reject(err);
        })
    });
}




