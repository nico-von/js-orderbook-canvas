import { manageOrderBook } from "./binanceOrderBookManagement.js";
import { manageMarketTrades } from "./binanceMarketTradesManagement.js";

export function initialiseWebSocket(dataTicker, restQtyLimit, eventToDispatch) {
    const streams = [`${dataTicker}@depth`, `${dataTicker}@aggTrade`];
    const wsStream = `wss://fstream.binance.com/stream?streams=${streams.join(
        "/"
      )}`;
    const binanceSocket = new WebSocket(wsStream);

    binanceSocket.addEventListener("message", async (event) => {
        const { data } = JSON.parse(event.data);
        const { e } = data;
        
        if (e == "depthUpdate") {
           await manageOrderBook(data, dataTicker, restQtyLimit);
        } else if (e == "aggTrade") {
           await manageMarketTrades(data);
        }
        
        // for updating
        if(eventToDispatch){
          document.dispatchEvent(eventToDispatch);  
        }
    })
    return;
}
