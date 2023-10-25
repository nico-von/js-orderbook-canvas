import { manageOrderBook } from "./binanceOrderBookManagement.js";
import { manageMarketTrades } from "./binanceMarketTradesManagement.js";

// make global for use of clearTrades();
let trades;

export function initialiseWebSocket(
  dataTicker,
  restQtyLimit,
  lobDepth,
  marketTrades
) {
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
      await manageOrderBook(data, dataTicker, restQtyLimit, lobDepth);
    } else if (e == "aggTrade") {
      await manageMarketTrades(data, trades);
    }
    // for updating
    postMessage([lobDepth, trades]);
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
