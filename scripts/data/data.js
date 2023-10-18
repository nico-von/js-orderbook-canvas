import { scaleLinear } from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { initialiseWebSocket } from "../binance/binanceWebSocket.js";
import { manageTicker } from "../binance/binanceTickerData.js";
import { roundToNearestTick } from "../misc/numberManipulationFunctions.js";
import { data } from "../settings.js";

// use dataObject parameter here for the benefit of index.js
// dataObject will originate from index.js and will be modified through
// this js module

// this function will only be called once from the
// index.js module

const depth = {
  bids: {},
  asks: {},
  largestBid: 0,
  largestAsk: 0,
  tickSize: 0,
  decimalLength: 0,
  customTickSize: false,
};

const marketTrades = {
  client: {
    buy: {},
    sell: {},
  },
  session: {
    buy: {},
    sell: {},
  },
  tickSize: 0,
  decimalLength: 0,
  customTickSize: false,
};

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

  // depth object
  dataObject.depth = depth;
  dataObject.depth.tickSize = tickSizeToUse;
  dataObject.depth.decimalLength = decimalLength;

  // market trades object
  dataObject.marketTrades = marketTrades;
  dataObject.marketTrades.tickSize = tickSizeToUse;
  dataObject.marketTrades.decimalLength = decimalLength;

  if (tickSizeToUse > tickSize) {
    tickAdjustedLastPrice = roundToNearestTick(lastPrice, clientTickSize);
    dataObject.depth.customTickSize = true;
    dataObject.marketTrades.customTickSize = true;
  }

  // canvas manipulation
  const canvasScale = scaleLinear()
    .domain([1, 0])
    .range([tickAdjustedLastPrice, tickAdjustedLastPrice + tickSizeToUse]);

  dataObject.transformIndex = function (i) {
    return canvasScale(i).toFixed(decimalLength);
  };

  dataObject.invertIndex = function (price) {
    return canvasScale.invert(price).toFixed(decimalLength);
  };

  // eventObject
  const drawEvent = new Event("draw");

  // start web socket
  initialiseWebSocket(
    ticker.toLowerCase(),
    "1000",
    drawEvent,
    dataObject.depth,
    dataObject.marketTrades
  );
}

export function getPriceLevel(i, dataObject) {
  if (!(dataObject && dataObject.transformIndex)) {
    return;
  }

  return dataObject.transformIndex(Math.round(i));
}

export function getIndexLevel(price, dataObject) {
  if (!(dataObject && dataObject.invertIndex)) {
    return;
  }

  return dataObject.invertIndex(price);
}

export function getBestBid(dataObject) {
  //returns the index of bestbid
  if (!(dataObject && dataObject.depth)) {
    return;
  }
  const bids = Object.keys(dataObject.depth.bids).map((d) => {
    const bid = parseFloat(d);
    if (bid) {
      return bid;
    }
    return;
  });
  return getIndexLevel(Math.max(...bids), dataObject);
}

export function getBestAsk(dataObject) {
  //returns the index of bestbid
  if (!(dataObject && dataObject.depth)) {
    return;
  }
  const asks = Object.keys(dataObject.depth.asks).map((d) => {
    const ask = parseFloat(d);
    if (ask) {
      return ask;
    }
    return;
  });
  return getIndexLevel(Math.min(...asks), dataObject);
}

export function getLargestBid(dataObject) {
  if (!(dataObject && dataObject.depth.largestBid)){
    return;
  }

  return dataObject.depth.largestBid;
}

export function getRelativeLargestBid(start, end, dataObject){
  if (!(dataObject && dataObject.depth)) {
    return;
  }
  let largest = 0;
  for (let i = start; i < end; i++){
    const priceLevel = getPriceLevel(i, dataObject);
    const bid = dataObject.depth.bids[priceLevel];
    if (bid) {
      largest = bid.qty > largest ? bid.qty : largest; 
    }
  }
  return largest;
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

export function getBuy(i, dataObject, decimalLength, isSession) {
  if (!(dataObject && dataObject.marketTrades)) {
    return;
  }
  const priceLevel = getPriceLevel(i, dataObject);
  let buy;
  if (isSession) {
    buy = dataObject.marketTrades.session.buy[priceLevel];
  } else {
    buy = dataObject.marketTrades.client.buy[priceLevel];
  }

  if (buy) {
    return buy.qty.toFixed(decimalLength);
  }
}

export function getSell(i, dataObject, decimalLength, isSession) {
  if (!(dataObject && dataObject.marketTrades)) {
    return;
  }

  const priceLevel = getPriceLevel(i, dataObject);

  let sell;
  if (isSession) {
    sell = dataObject.marketTrades.session.sell[priceLevel];
  } else {
    sell = dataObject.marketTrades.client.sell[priceLevel];
  }

  if (sell) {
    return sell.qty.toFixed(decimalLength);
  }
}

export function getDelta(i, dataObject, decimalLength) {
  if (!(dataObject && dataObject.marketTrades)) {
    return;
  }

  const priceLevel = getPriceLevel(i, dataObject);

  const sessionTrades = dataObject.marketTrades.session;
  const buy = sessionTrades.buy[priceLevel];
  const sell = sessionTrades.sell[priceLevel];

  return ((buy ? buy.qty : 0) - (sell ? sell.qty : 0)).toFixed(decimalLength);
}