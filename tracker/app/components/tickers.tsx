interface Ticker{
  ticker_name:string,
  ticker_price: string,
  onRemove:(ticker_name:string)=>void
}
import styles from './ticker.module.css'
export default function  Tickers(params:Ticker){
    const {ticker_name, ticker_price, onRemove} = params;
    return(
        <div className={styles.Tickers}>
            <div className={styles.ticker_name}>{ticker_name}:</div>
            <div className={styles.ticker_price}>{ticker_price}</div>
            <button onClick={()=>onRemove(ticker_name)} className={styles.remove_button}>X</button>
        </div>

    )
}