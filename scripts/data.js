import { scaleLinear } from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { initialiseWebSocket } from "./binanceWebSocket.js";
import { manageTicker } from "./binanceTickerData.js";
import { roundToNearestTick } from "./numberManipulationFunctions.js";

// use dataObject parameter here for the benefit of index.js
// dataObject will originate from index.js and will be modified through
// this js module

// this function will only be called once from the
// index.js module
export async function initialiseTicker(
  dataTicker,
  clientTickSize,
  decimalLength,
  dataObject
) {
  // client tick size is the tick size required by the client
  // and not the tick size from the binance stream

  const { ticker, tickSize, lastPrice } = await manageTicker(dataTicker);

  const tickAdjustedLastPrice = roundToNearestTick(
    lastPrice,
    tickSize,
    decimalLength
  );

  // depth object
  dataObject.depth = {
    bids: {},
    asks: {},
    tickInfo: {
      clientTickSize,
      actualTickSize: tickSize,
      decimalLength,
    },
  };

  // market trades object
  dataObject.lastTrade = {};

  // canvas manipulation
  dataObject.transformIndex = scaleLinear()
    .domain([1, 0])
    .range([tickAdjustedLastPrice, tickAdjustedLastPrice + tickSize]);

  // eventObject
  const drawEvent = new Event("draw");

  // start web socket
  initialiseWebSocket(
    ticker.toLowerCase(),
    "1000",
    drawEvent,
    dataObject.depth,
    dataObject.lastTrade
  );

  document.addEventListener("draw", (e) => {});
}
