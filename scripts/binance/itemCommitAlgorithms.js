import {
  roundToNearestTick,
  sumAllValues,
} from "../misc/numberManipulationFunctions.js";

let bidBuffer = [];
let askBuffer = [];

async function processItem(type, arr, lobDepth) {
  //base case
  if (arr.length === 0) {
    return;
  }

  const item = arr.shift();
  if (!lobDepth.customTickSize) {
    await commitItemWithoutClientTick(item, type, lobDepth);
  } else {
    await commitItemWithClientTick(item, type, lobDepth);
  }
  await processItem(type, arr, lobDepth);
}

export async function commitToDepth(snapshot, lobDepth) {
  // populate accordingly
  let bids = snapshot.e ? snapshot.b : snapshot.bids;
  let asks = snapshot.e ? snapshot.a : snapshot.asks;
  
  //get rid of backlogs
  bidBuffer.length = 0;
  askBuffer.length = 0;

  bidBuffer.push(...bids);
  askBuffer.push(...asks);

  const {tickSize} = lobDepth;
  if(!lobDepth.customTickSize){
    lobDepth.bestBid = parseFloat(bids.reduce((p, c) => +p[0] > +c[0] ? p : c)[0]);
    lobDepth.bestAsk = parseFloat(asks.reduce((p, c) => +p[0] < +c[0] ? p : c)[0]);
  } else {
    const bB = bids.reduce((p, c) => {
      const P = roundToNearestTick(+p[0], tickSize);  
      const C = roundToNearestTick(+c[0], tickSize);
      return P > C ? p : c;
    })[0];
    const bA = asks.reduce((p, c) => {
      const P = roundToNearestTick(+p[0], tickSize);  
      const C = roundToNearestTick(+c[0], tickSize);
      return P < C ? p : c;
    })[0];
    lobDepth.bestBid = roundToNearestTick(bB, tickSize);
    lobDepth.bestAsk = roundToNearestTick(bA, tickSize);

    //reduce is said to be faster
  }

  await processItem("bid", bidBuffer, lobDepth);
  await processItem("ask", askBuffer, lobDepth);
}

async function commitItemWithoutClientTick(
  item,
  type,
  lobDepth
) {
  let { decimalLength } = lobDepth;
  let price = parseFloat(item[0]).toFixed(decimalLength);
  let qty = parseFloat(item[1]);

  if (type == "bid") {
    // compare targetPrice to bestBid
   
    
    // compare qty to largestBid
    if (qty > lobDepth.largestBid) {
      lobDepth.largestBid = qty;
    }

    if (qty === 0) {
      delete lobDepth.bids[price];
      return;
    }

    lobDepth.bids[price] = {
      price,
      qty,
      priceFloat: parseFloat(price),
    };
  } else if (type == "ask") {
    // compare targetPrice to bestAsk
    

    if (qty > lobDepth.largestAsk) {
      lobDepth.largestAsk = qty;
    }

    if (qty === 0) {
      delete lobDepth.asks[price];
      return;
    }

    lobDepth.asks[price] = {
      price,
      qty,
      priceFloat: parseFloat(price),
    };
  }

  // postMessage([lobDepth, "depth"]);

}

function processTargetPrice(targetPriceObject, originalPrice, qty, isDepth) {
  // get qty of target price, if 0
  // normally, here we do not really add them,
  // but since the limit orders are update by
  // net basis, we need to somehow store
  // the values and then calculate the total
  // values.. we need to do this because
  // the values are not always updated to their
  // net values
  // i am thinking of using this type of
  // price data
  // 20010 : {
  // quantityOfPrices: [qty of 20005, 20006, 20007, 20008, 20009, 20010, 20011,
  // 20012, 20013, 20014, 20015]
  // sumOfQuantities: SUM of quantityOfPrices
  // }

  if (isDepth) {
    targetPriceObject.quantities[originalPrice] = qty;
  } else {
    const previousQuantity = targetPriceObject.quantities[originalPrice];
    targetPriceObject.quantities[originalPrice] = previousQuantity
      ? previousQuantity + qty
      : qty;
  }
  let sumOfQuantities = sumAllValues(targetPriceObject.quantities);
  if (sumOfQuantities <= 0) {
    return false;
  } else {
    targetPriceObject.qty = sumOfQuantities;
    return targetPriceObject;
  }
}

async function commitItemWithClientTick(item, type, lobDepth) {
  // parseFloat price here to be able to
  // calculate its nearest tick
  let price = parseFloat(item[0]);
  let qty = parseFloat(item[1]);
  let { decimalLength } = lobDepth;
  let { tickSize } = lobDepth;
  //get scale price as target
  const targetPrice = roundToNearestTick(price, tickSize).toFixed(
    decimalLength
  );

  const targetPriceObject = {
    quantities: {},
    qty: 0,
  };

  if (type == "bid") {
    const updatedPriceObject = processTargetPrice(
      lobDepth.bids[targetPrice]
        ? lobDepth.bids[targetPrice]
        : targetPriceObject,
      price,
      qty,
      true
    );

    if (!updatedPriceObject) {
      delete lobDepth.bids[targetPrice];
      return;
    }

    // compare targetPrice to bestBid


    // compare qty to largestBid
    if (updatedPriceObject.qty > lobDepth.largestBid) {
      lobDepth.largestBid = updatedPriceObject.qty;
    }

    lobDepth.bids[targetPrice] = updatedPriceObject;
  } else if (type == "ask") {
    const updatedPriceObject = processTargetPrice(
      lobDepth.asks[targetPrice]
        ? lobDepth.asks[targetPrice]
        : targetPriceObject,
      price,
      qty,
      true
    );

    if (!updatedPriceObject) {
      delete lobDepth.asks[targetPrice];
      return;
    }

    // compare targetPrice to bestBid
 

    // compare qty to largestAsk
    if (updatedPriceObject.qty > lobDepth.largestAsk) {
      lobDepth.largestAsk = updatedPriceObject.qty;
    }

    lobDepth.asks[targetPrice] = updatedPriceObject;
  }
  // postMessage([lobDepth, "depth"]);
}

async function commitLastItemWithoutClientTick(
  lastTrade,
  marketTrades,
  decimalLength,
  isSession
) {
  const { price, type, qty } = lastTrade;

  const priceKey = parseFloat(price).toFixed(decimalLength);

  if (type == "s") {
    let quantity = marketTrades.sell[priceKey]
      ? marketTrades.sell[priceKey].qty + qty
      : qty;

    marketTrades.sell[priceKey] = {
      qty: quantity,
    };
  } else if (type == "b") {
    let quantity = marketTrades.buy[priceKey]
      ? marketTrades.buy[priceKey].qty + qty
      : qty;

    marketTrades.buy[priceKey] = {
      qty: quantity,
    };
  }

// postMessage(marketTrades, "marketTrades", isSession);
}

async function commitLastItemWithClientTick(
  lastTrade,
  marketTrades,
  tickSize,
  decimalLength,
  isSession
) {
  const { price, type, qty } = lastTrade;
  const targetPrice = roundToNearestTick(price, tickSize).toFixed(
    decimalLength
  );

  const targetPriceObject = {
    quantities: {},
    qty: 0,
  };

  if (type == "s") {
    const updatedPriceObject = processTargetPrice(
      marketTrades.sell[targetPrice]
        ? marketTrades.sell[targetPrice]
        : targetPriceObject,
      price,
      qty,
      false
    );

    if (updatedPriceObject) {
      marketTrades.sell[targetPrice] = updatedPriceObject;
    }
  } else if (type == "b") {
    const updatedPriceObject = processTargetPrice(
      marketTrades.buy[targetPrice]
        ? marketTrades.buy[targetPrice]
        : targetPriceObject,
      price,
      qty,
      false
    );

    if (updatedPriceObject) {
      marketTrades.buy[targetPrice] = updatedPriceObject;
    }
  }

  // postMessage([marketTrades, "marketTrades", isSession]);
}
export async function commitToMarketTrade(
  data,
  marketTrades,
  customTickSize,
  tickSize,
  decimalLength,
  isSession
) {
  if (!customTickSize) {
    await commitLastItemWithoutClientTick(
      data,
      marketTrades,
      decimalLength,
      isSession
    );
  } else {
    await commitLastItemWithClientTick(
      data,
      marketTrades,
      tickSize,
      decimalLength,
      isSession
    );
  }
}
