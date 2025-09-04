'use client';
import Tickers from './components/tickers';
interface Ticker{
  ticker_name:string,
  ticker_price: string| null}
interface WebsocketServerMessage{
  type:string,
  price_update:string|null,
  ticker_name:string|null,
  user_uuid:UUID|null
}
import { useEffect, useRef, useState } from 'react';
import {v4 as uuidv4} from 'uuid'
import styles from './ticker_tracker.module.css'

type UUID =  string & {readonly brand:unique symbol}
export default function Home(){
  const [tickers,setTickers] = useState<Ticker[]>([]);
  const [inputTicker, setInputeTicker] = useState<string>('');
  const ws = useRef<WebSocket|null>(null);
  const userUUID = useRef<UUID|null>(null);
  useEffect(()=>{
      ws.current = new WebSocket("ws://localhost:3001");

      ws.current.onopen = () =>{
        console.log("Opened connection to Websocket Server");
      }
      ws.current.onclose = () =>{
        console.log("Closed connection to Websocket Server");
      }

      ws.current.onmessage = async(event) =>{
        console.log("Recieved a message");
        const data:WebsocketServerMessage =  await JSON.parse(event.data);
        if(data.type === "USER_UUID"){
          console.log(data.user_uuid)
          userUUID.current = data.user_uuid
        }
        if(data.type === "PRICE_UPDATE"){
          console.log(data.ticker_name,": ",data.price_update);
          setTickers((prev)=>{
            return prev.map((t)=>{
                if(t.ticker_name == data.ticker_name){
                  return({ticker_name:data.ticker_name, ticker_price:data.price_update});
                }else{
                  return(t);
                }
            })
          })
        }
        

      }
      const handleUnload = () => {
        if (ws.current && userUUID.current) {
          ws.current.send(JSON.stringify({
            type: "CLOSE_CONNECTION",
            user_uuid: userUUID.current
          }));
          ws.current.close();
        }
      };
      window.addEventListener("beforeunload", handleUnload);
      return () => {
        window.removeEventListener("beforeunload", handleUnload);
        ws.current?.close();
      };
  },[])
  const onInputChange = (e:React.ChangeEvent<HTMLInputElement>) =>{
      setInputeTicker(e.target.value.toUpperCase());
    
  }
  const onTickerSubmit = (e:React.FormEvent<HTMLFormElement>) =>{
    e.preventDefault();
    if(!inputTicker.trim()){
      return;
    }
    if(tickers.some((ticker)=>ticker.ticker_name ===inputTicker)){
      return;
    }
    ws.current?.send(JSON.stringify({
      ticker_name:inputTicker,
      type:"TICKET_REQUEST",
      user_uuid:userUUID.current
    }))
    setTickers((prev)=>[...prev, {ticker_name:inputTicker, ticker_price:''}]);
    setInputeTicker('')
  }
  const removeTicker = (ticker_name:string) =>{
    setTickers(
      prev=>prev.filter((ticker)=> ticker.ticker_name!== ticker_name)
    )
  }
  const TEST_USERS_LIST = () =>{
    console.log("Testing user list");
    ws.current?.send(JSON.stringify({
      type:"TEST_USERS_LIST"
    }))
  }
  return(
    <div className="container">
      <div className={styles.bundle}>
        <div className={styles.input_container}>
          <h2 className={styles.input_container_label}>Tickers</h2>
          <button onClick={TEST_USERS_LIST} >test</button>
          <form className={styles.input_field_container} onSubmit={onTickerSubmit} >
            <input onChange={onInputChange} placeholder="i.e tsla" value={inputTicker} className={styles.input_bar} type="text" />
            <button type='submit' className={styles.input_button}>add</button>
          </form>
        </div>
        <div className={styles.ticker_container}>
          {
            tickers.map((ticker, index)=>{
              return(<Tickers onRemove={removeTicker} key={index} ticker_name={ticker.ticker_name} ticker_price={ticker.ticker_price||''} />)
            })
          }
        </div>
      </div>
    </div>
  );
}