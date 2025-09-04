import {WebSocketServer} from 'ws'
import type { BrowserContext,Page } from 'playwright';
import { TickerManager } from './ticker_manager';
import {v4 as uuidv4} from 'uuid';
// interface TickerRequest{
//     ticker_name:string
// }
type UUID = string & {readonly brand: unique symbol}

interface User{
    id:UUID,
    context:BrowserContext,
    tabs:Page[]

}
interface WebsocketClientMessage{
    user_uuid:UUID,
    ticker_name:string|null
    type:string
}
let user_list:Map<UUID,User> = new Map();
async function main(){
    const wss = new WebSocketServer({port:3001})
    const manager = await new TickerManager().init()

    wss.on('connection',async (ws)=>{
        console.log("Connected with client")
        const created_uuid:UUID = uuidv4() as UUID;
        ws.send(JSON.stringify({
            type:"USER_UUID",
            user_uuid:created_uuid
        }))
        console.log("User id created:",created_uuid);
        const context:BrowserContext = await manager.makeNewContext();
        const newUser2:User = {id:created_uuid, context, tabs:[]};
        user_list.set(created_uuid,newUser2);
        ws.on('message',async (msg:string)=>{
            console.log("Client has sent a message");
            const data:WebsocketClientMessage = JSON.parse(msg);
            if(data.type === "CLOSE_CONNECTION"){
                console.log("Removing user: ", data.user_uuid)

                const userContext = user_list.get(data.user_uuid);
                await userContext?.context.close();
                
                user_list.delete(data.user_uuid)
            }
            if(data.type === "TICKET_REQUEST"){
                const user =user_list.get(data.user_uuid);
                if(!user){
                    console.error("User not found", data.user_uuid);
                    return;
                }
                const newTab:Page = await manager.makeNewTab(user!.context,ws,data.ticker_name);
                user?.tabs.push(newTab);
                console.log("The ticker is: ",data.ticker_name);
            }
            if(data.type === "TEST_USERS_LIST"){
                console.log("----Users2----");
                for(const [uuid,user] of user_list){
                    console.log("UUID:", uuid);
                    console.log("Tabs: ", user.tabs.length," tabs opened");
                    console.log("--------------");
                }
                
            }
        
        
        })


    })
}

main()