import { scaleLinear } from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { initialiseWebSocket } from "./binanceWebSocket.js";
import { manageTicker } from "./binanceTickerData.js";

// use dataObject parameter here for the benefit of index.js
// dataObject will originate from index.js and will be modified through
// this js module

// this function will only be called once from the
// index.js module
async function initialiseTicker(dataTicker, clientTickSize, dataObject) {
  // client tick size is the tick size required by the client
  // and not the tick size from the binance stream

  const { ticker, tickSize, lotStep } = await manageTicker(dataTicker);

  // depth object
  const depth = {
    bids: {},
    asks: {},
    clientTickSize, 
    tickerTickSize: tickSize
  };

  // market trades object
  const lastTrade = {};

  // eventObject
  const drawEvent = new Event("draw");

  // start web socket
  initialiseWebSocket(
    ticker.toLowerCase(),
    "1000",
    drawEvent,
    depth,
    lastTrade
  );

  document.addEventListener("draw", (e) => {

    
  });
}

initialiseTicker("BTCUSDT", {});
