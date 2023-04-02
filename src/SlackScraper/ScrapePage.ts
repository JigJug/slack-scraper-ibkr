import { Page} from "puppeteer";
import { delay } from "../Utils/Delay";
import events from "events"
//const alertsArray: string[] = []
interface Count {
    mouse: number | undefined;
    refresh: number | undefined;
}


export async function getFeed(event: events, page:Page, lastMessage: string , start: boolean, count: Count): Promise<any> {
    
    try {

        //need a delay on start
        if(start) await delay(10000);

        count = await makeHumanAndKickIdle(page, count!, lastMessage);

        //get all our elements that we want to inspect and work with
        const ge = await loadHtml(page);

        //general program delay
        await delay(1000);

        //const mainMessageWindow = ge.mesgWindow;
        
        //const bouBox: BoundingBox = await mainMessageWindow


        const blockQuote = ge.blockQuotes.pop();

        //block quotes on startup
        if(blockQuote == undefined){ 
            lastMessage = blockQuote!;
            count.refresh! += 1
            return getFeed(event, page, lastMessage, true, count);
        }
        if(start) lastMessage = blockQuote!;

        //check if we have a new block quote come through
        if(blockQuote != lastMessage) {
            //const checkDs = checkForDuplicates(alertsArray, getMessage);
            //if(!checkDs)
            if(blockQuote!.includes('ALERT')) {
                console.log('FOUND ALERT::: ',blockQuote);
                event.emit('alert', blockQuote);
            }
            //alertsArray.push(getMessage)
        }
    
        lastMessage = blockQuote!;
        count.mouse! += 1;
        count.refresh! += 1;
        //console.log(count)
        
        getFeed(event, page, lastMessage, false, count);

    } catch (err) {
        throw err
    }

}


const loadHtml = async (page: Page) => {

    try {

        const blockQuotes = await page.$$eval("blockquote", (chdv)=>{
            //let eles = chdv.getElementsByClassName('p-rich_text_section');
            let elesa = Array.from(chdv)

            return elesa.map((v) => {
                return v.textContent
            })
        });

        const mesgWindow = await page.$eval('.c-virtual_list__scroll_container',(ele) => {
            //(ele as HTMLInputElement)
            //ele.scroll(0, )
            //return Array.from(ele);
            return ele
        })



        return {blockQuotes, mesgWindow}
        
    } catch (err) {
        throw err
    }
}



function checkForDuplicates(signalArry: string[], toCheck: string){
    return signalArry.some((v) => {
        return v.includes(toCheck)
    })
}

/**
 * makeHumanAndKickIdle
 * - Refresh page after a random amount of minutes between 2 and 5 minutes
 * - Click in the message box and move mouse wheel up then down at random intervals
 * @param page 
 * @param count 
 * @param lastMessage 
 */
async function makeHumanAndKickIdle(page: Page, count: Count, lastMessage: string){
    try {
        //page load every ~5 mins.. need to make this random or ip will get blocked for a little while
        const timeRandRefresh = Math.random()* (600 - 240) + 240;
        if(count.refresh! > timeRandRefresh){
            //console.log('refreshing page..', timeRandRefresh);
            //await page.reload({ waitUntil: 'networkidle2'});
            console.log('program working... ');
            console.log('Previous ALERT recieved: ', lastMessage)
            count.refresh = 0;
        }

        const randMouseTime = Math.random()* (50 - 30) + 30;
        const randMouseClickX = Math.random()* (330 - 230) + 230;
        const randMouseClickY = Math.random()* (500 - 400) + 400;
        const randMouseWheelUp = Math.random()* (99 - 30) + 30;
        //const randMouseWheelDown = Math.random()* (150 - 300) + 150
        if(count.mouse! > randMouseTime){
            console.log(count)

            /*console.log(
                'controling mouse... ',
                'randMouseTime=',randMouseTime,
                'randMousemoveX=',randMouseClickX,
                'randMouseClickY=',randMouseClickY,
                'randMouseWheelUp', randMouseWheelUp
            );*/
            
            await page.mouse.move(randMouseClickX, randMouseClickY);
            await delay(Math.random()*500)
            await page.mouse.wheel({deltaY: -randMouseWheelUp});
            //await page.mouse.wheel({deltaY: -randMouseWheelUp});
            await delay(Math.random()*500)
            await page.mouse.wheel({deltaY: 300});

            count.mouse = 0;
        }
        return count
        
    } catch (err) 
    {
        throw err
    }
}