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

  const tickSizeToUse = clientTickSize > tickSize ? clientTickSize : +tickSize;
  let tickAdjustedLastPrice = +lastPrice;

  if (tickSizeToUse > tickSize) {
    tickAdjustedLastPrice = roundToNearestTick(
      lastPrice,
      clientTickSize,
      decimalLength
    );
  }

  // depth object
  if (tickSizeToUse > tickSize) {
    dataObject.depth = {
      bids: {},
      asks: {},
      tickInfo: {
        clientTickSize,
        actualTickSize: tickSize
      },
      decimalLength,
    };
  } else {
    dataObject.depth = {
      bids: {},
      asks: {},
      decimalLength,
    };
  }
  // market trades object
  dataObject.lastTrade = {};

  // canvas manipulation
  const canvasScale = scaleLinear()
    .domain([1, 0])
    .range([tickAdjustedLastPrice, tickAdjustedLastPrice + tickSizeToUse]);

  dataObject.transformIndex = function (i) {
    return canvasScale(i).toFixed(decimalLength);
  };

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
}

export function getPriceLevel(i, dataObject) {
  if (!(dataObject && dataObject.transformIndex)) {
    return;
  }

  return dataObject.transformIndex(Math.round(i));
}

export function getBid(i, dataObject, decimalLength) {
  if (!(dataObject && dataObject.depth)) {
    return;
  }
  const priceLevel = getPriceLevel(i, dataObject);
  const bids = dataObject.depth.bids[priceLevel];
  if (bids) {
    const asks = dataObject.depth.asks[priceLevel];
    const netBids = asks ? bids.qty - asks.qty : bids.qty;
    if (netBids > 0) {
      return netBids.toFixed(decimalLength);
    }
  }
  return;
}

export function getAsk(i, dataObject, decimalLength) {
  if (!(dataObject && dataObject.depth)) {
    return;
  }

  const priceLevel = getPriceLevel(i, dataObject);
  const asks = dataObject.depth.asks[priceLevel];
  if (asks) {
    const bids = dataObject.depth.bids[priceLevel];
    const netAsks = bids ? asks.qty - bids.qty : asks.qty;
    if (netAsks > 0) {
      return netAsks.toFixed(decimalLength);
    }
  }
  return;
}
