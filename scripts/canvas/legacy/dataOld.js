// import D3
import { scaleLinear, max } from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
// *******************8
// TODO
//
// MAKE PRICE BUCKETS SCALABLE!
//***************
const drawEvent = new Event("draw");
const streams = ["btcusdt@depth", "btcusdt@aggTrade"];
const wsStream = `wss://fstream.binance.com/stream?streams=${streams.join(
  "/"
)}`;
const binanceRest = "https://fapi.binance.com/";
const tickerEndpoint = `${binanceRest}fapi/v1/ticker/price?symbol=BTCUSDT`;
const depthEndpoint = `${binanceRest}fapi/v1/depth?symbol=BTCUSDT&limit=1000`;

let depthEventBuffer = {
  buffer: [],
  lastUpdateId: null,
  firstEventProcessed: false,
  lastUpdatedEvent: null,
};
// the true ticks of the instrument
const trueTicks = 0.1;
const step = 10;
const fixedSize = 1;
const decimalSize = 3;
const bidDepth = {};
const askDepth = {};
export const ticker = {};
export const depth = {};
export const trades = {};
export const svp = {};
// BINANCE API order book PROCESS
// https://developers.binance.com/docs/binance-trading-api/futures#how-to-manage-a-local-order-book-correctly

// helpers
async function initialiseTicker() {
  const response = await fetch(tickerEndpoint);
  const tickerJson = await response.json();
  ticker.trueTicks = trueTicks;
  ticker.tickSize = step;
  ticker.fixedSize = fixedSize;
  ticker.decimalSize = decimalSize;
  ticker.topOfBook = roundToNearestTick(
    parseFloat(tickerJson.price),
    ticker.tickSize,
    ticker.fixedSize
  );
  ticker.rawTransformIndex = scaleLinear()
    .domain([1, 0])
    .range([ticker.topOfBook, ticker.topOfBook + ticker.tickSize]);

  ticker.transformIndex = function (i) {
    return this.rawTransformIndex(i).toFixed(ticker.fixedSize);
  };
}

async function getDepthSnapshot() {
  const response = await fetch(depthEndpoint);
  const depthJson = await response.json();
  return depthJson;
}
function roundToNearestTick(x, tickSize, fixedSize) {
  // this is for arranging the scale's custom tick values
  let hello = parseFloat(
    (Math.round(x / tickSize) * tickSize).toFixed(fixedSize)
  );
  // tmepor

  return hello;
}

function cleanDecimalAddition(a, b) {
  let temp = a + b;
  return parseFloat(temp.toFixed(ticker.decimalSize));
}

async function arrangedepth(snapshot) {
  let bids = [];
  let asks = [];

  if (snapshot.e) {
    bids = snapshot.b;
    asks = snapshot.a;
  } else {
    bids = snapshot.bids;
    asks = snapshot.asks;
  }

  function iter(arr, type) {
    for (let item of arr) {
      let truePrice = parseFloat(item[0]).toFixed(ticker.fixedSize);
      let price = roundToNearestTick(
        truePrice,
        ticker.tickSize,
        ticker.fixedSize
      );

      let quantity = parseFloat(item[1]);

      if (type == "bid") {
        if (quantity == 0) {
          delete bidDepth[truePrice];
          continue;
        }

        bidDepth[truePrice] = {
          price: truePrice,
          quantity,
        };
      } else if (type == "ask") {
        if (quantity == 0) {
          delete askDepth[truePrice];
          continue;
        }

        askDepth[truePrice] = {
          price: truePrice,
          quantity,
        };
      }

      let totalBids = 0;
      let totalAsks = 0;
      //bid
      for (let i = 0; i < ticker.tickSize; i += ticker.trueTicks) {
        const bidKey = (price + i).toFixed(ticker.fixedSize);
        const askKey = (price - i).toFixed(ticker.fixedSize);

        if (bidDepth[bidKey]) {
          let bidObject = bidDepth[bidKey];
          totalBids = cleanDecimalAddition(totalBids, bidObject.quantity);
        }

        if (askDepth[askKey]) {
          let askObject = askDepth[askKey];
          totalAsks = cleanDecimalAddition(totalAsks, askObject.quantity);
        }
      }

      // console.log("LAST");
      depth[price.toFixed(ticker.fixedSize)] = {
        bid: totalBids,
        ask: totalAsks,
      };
    }
  }
  iter(bids, "bid");
  iter(asks, "ask");
}

async function manageTradeEvents(data) {
  const price = roundToNearestTick(
    parseFloat(data.p),
    ticker.tickSize,
    ticker.fixedSize
  );

  const type = data.m ? "sell" : "buy";
  const quantity = parseFloat(data.q);

  //check if price exists
  if (trades[price] && trades[price].type == type) {
    trades[price].quantity = cleanDecimalAddition(
      trades[price].quantity,
      quantity
    );
  } else {
    trades[price] = {
      price,
      type,
      quantity,
    };
  }

  if (svp[price]) {
    svp[price].quantity = cleanDecimalAddition(svp[price].quantity, quantity);
  } else {
    svp[price] = {
      price,
      quantity,
    };
  }
}


// step 3
async function processStepThree() {
  console.log("STEP 3");
  const snapshot = await getDepthSnapshot();
  await arrangedepth(snapshot);
  return snapshot.lastUpdateId;
}

async function manageDepthEventsRecursive(data) {
  // step 2
  depthEventBuffer.buffer.push(data);

  // step 3
  if (depthEventBuffer.buffer.length === 1) {
    if (!depthEventBuffer.lastUpdateId) {
      console.log("STEP 3 initial call")
      depthEventBuffer.lastUpdateId = await processStepThree();
      await processEvents();
      return;
    }

    console.log("...")
    await processEvents();
  }
}

async function processEvents() {
  if (!depthEventBuffer.lastUpdateId) {
    console.log("lastUpdate missing")
    return;
  }
  if (depthEventBuffer.buffer.length === 0) {
    return;
  }

  const event = depthEventBuffer.buffer.shift();

  // STEP 4
  if (event.u < depthEventBuffer.lastUpdateId) {
    console.log("STEP 4");
    await processEvents();
    return;
  }

  // STEP 5
  if (!depthEventBuffer.firstEventProcessed) {
    if (event.U > depthEventBuffer.lastUpdateId) {
      console.log("step 5");

      //go back to step 3
      depthEventBuffer.lastUpdateId = await processStepThree();
      await processEvents();
      return;
    } else {
      depthEventBuffer.firstEventProcessed = true;
      // reset also last update event in case its not undefined
      depthEventBuffer.lastUpdatedEvent = undefined;
    }
  }

  // STEP 6
  if (depthEventBuffer.lastUpdatedEvent) {
    if (event.pu != depthEventBuffer.lastUpdatedEvent.u) {
      console.log("step 6");

      //go back to step 3
      depthEventBuffer.lastUpdateId = await processStepThree();

      // reset Step 5 and 6 again
      depthEventBuffer.firstEventProcessed = false;
      depthEventBuffer.lastUpdatedEvent = undefined;

      await processEvents();
      return;
    }
  }

  depthEventBuffer.lastUpdatedEvent = event;

  await arrangedepth(event);
  await processEvents(); // recurse, my love
}

// STEP 1:
let socket = new WebSocket(wsStream);

// STEP 2:
socket.onmessage = async function (event) {
  const { data } = JSON.parse(event.data);
  const { e } = data;
  // init ticker!
  if (Object.keys(ticker) == 0) {
    console.log("Init ticker")
    // temporary
    await initialiseTicker();
  }
  if (e == "depthUpdate") {
    await manageDepthEventsRecursive(data);
  } else if (e == "aggTrade") {
    await manageTradeEvents(data);
  }

  window.dispatchEvent(drawEvent);
};
