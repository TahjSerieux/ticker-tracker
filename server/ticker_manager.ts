import {chromium  }from "playwright"
import type { Browser,Page, BrowserContext } from "playwright"


export class TickerManager{
    private browser:Browser|null = null;
    private pages: Map<string,Page> = new Map();
    private elementClass:string = ".last-zoF9r75I.js-symbol-last";
    async init(){
        this.browser = await chromium.launch({headless:false});
        return this;
    }
    private createURL(ticker_name:string){
        return (`https://www.tradingview.com/symbols/${ticker_name}/?exchange=BINANCE`);
    }

    async makePage(ticker_name: string,ws:WebSocket){
        if(!this.browser){
            this.browser = await chromium.launch({headless:false});
        }
        const page:Page = await this.browser.newPage();
        await page.goto(this.createURL(ticker_name));
    }
    async makeNewTab(context:BrowserContext,ws, ticker_name){
        const tab:Page = await context.newPage();
        await tab.goto(this.createURL(ticker_name));
        await this.observerPrice(tab,ws, ticker_name);
        return(tab);

    }
    async makeNewContext(){
        if(!this.browser){
            this.browser = await chromium.launch({headless:false});
        }
        return(await this.browser?.newContext());
    }
    async observerPrice(page:Page, ws, ticker_name: string){
        await page.exposeFunction("sendPriceUpdate",(price_update:string)=>{
            ws.send(JSON.stringify({
                price_update,
                ticker_name,
                timestamp:Date.now(),
                type:"PRICE_UPDATE"
            }))
        })
        // Wait for the element to appear
        const elementClass = this.elementClass;
        await page.waitForSelector(elementClass, { timeout: 60000 });

        await page.evaluate((elementClass)=> {
            const element = document.querySelector(elementClass);
            if(!element){
                return;
            }
            //@ts-ignore
            window.sendPriceUpdate(element.textContent);

            const observer =  new MutationObserver(()=>{
                const price = element.textContent;
                //@ts-ignore
                window.sendPriceUpdate(price);
            })

            observer.observe(element,{
                characterData:true,
                subtree:true,
                childList:true
            })

        },this.elementClass)
    }


}

