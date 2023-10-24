import { manageOrderBook } from "./binanceOrderBookManagement.js";
import { manageMarketTrades } from "./binanceMarketTradesManagement.js";

let depth;
let trades;
export function initialiseWebSocket(
  dataTicker,
  restQtyLimit,
  lobDepth,
  marketTrades
) {
  depth = lobDepth;
  trades = marketTrades;

  const streams = [`${dataTicker}@depth`, `${dataTicker}@aggTrade`];
  const wsStream = `wss://fstream.binance.com/stream?streams=${streams.join(
    "/"
  )}`;
  const binanceSocket = new WebSocket(wsStream);

  binanceSocket.addEventListener("message", async (event) => {
    const { data } = JSON.parse(event.data);
    const { e } = data;

    if (e == "depthUpdate") {
      await manageOrderBook(data, dataTicker, restQtyLimit, depth);
    } else if (e == "aggTrade") {
      await manageMarketTrades(data, trades);
    }
    // for updating
    postMessage([depth, trades]);
  });
  return;
}

export function clearTrades() {
  const client = trades.client;
  if (client) {
    Object.keys(client.buy).forEach((key) => {
      delete client.buy[key];
    });
    Object.keys(client.sell).forEach((key) => {
      delete client.sell[key];
    });
  }
}
