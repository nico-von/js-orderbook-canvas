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
  bestBid: 0,
  bestAsk: 0,
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
    delta: {}
  },
  tickSize: 0,
  decimalLength: 0,
  customTickSize: false,
};

const worker = new Worker("./scripts/workers/worker.js", {
  type: "module",
});

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

  if (window.Worker) {
    //Worker related eventListener
    document.addEventListener("clearTrades", (e) => {
      worker.postMessage(["clearTrades"]);
    });

    worker.postMessage([
      ticker.toLowerCase(),
      "1000",
      dataObject.depth,
      dataObject.marketTrades,
    ]);

    worker.onmessage = (e) => {
      dataObject.depth = e.data[0];
      dataObject.marketTrades = e.data[1];

      document.dispatchEvent(drawEvent);
    };

    worker.onerror = (e) => {
      console.log("error");
    };
  }

  // start web socket
  // initialiseWebSocket(
  //   ticker.toLowerCase(),
  //   "1000",
  //   drawEvent,
  //   dataObject.depth,
  //   dataObject.marketTrades
  // );
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

  return getIndexLevel(dataObject.depth.bestBid, dataObject);
}

export function getBestAsk(dataObject) {
  //returns the index of bestbid
  if (!(dataObject && dataObject.depth)) {
    return;
  }
  return getIndexLevel(dataObject.depth.bestAsk, dataObject);
}

export function getLargestBid(dataObject) {
  if (!(dataObject && dataObject.depth.largestBid)) {
    return;
  }

  return dataObject.depth.largestBid;
}

export function getLargestAsk(dataObject) {
  if (!(dataObject && dataObject.depth.largestAsk)) {
    return;
  }

  return dataObject.depth.largestAsk;
}
function getRelLargestQty(start, end, dataObject, mainObject, abs) {
  if (!(dataObject && mainObject)) {
    return;
  }
  let largest = 0;
  for (let i = start; i < end; i++) {
    const priceLevel = getPriceLevel(i, mainObject);
    const d = dataObject[priceLevel];
    if (d) {
      if(abs) {
        largest = Math.abs(d.qty) > largest ? Math.abs(d.qty) : largest;
      } else {
        largest = d.qty > largest ? d.qty : largest;
      }
      
    }
  }
  return largest;
}

export function getRelativeLargestDepth(start, end, dataObject, isBid) {
  if (!(dataObject && dataObject.depth)) {
    return;
  }

  const data = isBid ? dataObject.depth.bids : dataObject.depth.asks;
  return getRelLargestQty(start, end, data, dataObject);
}

export function getRelativeLargestVp(start, end, dataObject, isSession, isBuy) {
  if (!(dataObject && dataObject.marketTrades)) {
    return;
  }
  const session = isSession
    ? dataObject.marketTrades.session
    : dataObject.marketTrades.client;
  const data = isBuy ? session.buy : session.sell;

  return getRelLargestQty(start, end, data, dataObject);
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
  } else {
    return 0;
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
  } else {
    return 0;
  }
}

export function getDelta(i, dataObject) {
  if (!dataObject && dataObject.marketTrades.session) {
    return;
  }

  const priceLevel = getPriceLevel(i, dataObject);
  const delta = dataObject.marketTrades.session.delta[priceLevel];
  return delta ? delta.qty : 0;
}

export function getRelativeLargestDelta(start, end, dataObject) {
  return getRelLargestQty(start, end, dataObject.marketTrades.session.delta, dataObject, true)
}
