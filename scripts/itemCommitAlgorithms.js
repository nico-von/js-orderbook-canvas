import {
  roundToNearestTick,
  sumAllValues,
} from "./numberManipulationFunctions.js";

export function commitToDepth(snapshot, lobDepth) {
  // populate accordingly
  let bids = snapshot.e ? snapshot.b : snapshot.bids;
  let asks = snapshot.e ? snapshot.a : snapshot.asks;

  function iter(arr, type) {
    for (let item of arr) {
      // we need to save these according to
      // client tick sizes
      if (!lobDepth.customTickSize) {
        commitItemWithoutClientTick(item, type, lobDepth);
      } else {
        commitItemWithClientTick(item, type, lobDepth);
      }
    }
  }
  iter(bids, "bid");
  iter(asks, "ask");
}

function commitItemWithoutClientTick(item, type, lobDepth) {
  let { decimalLength } = lobDepth;
  let price = parseFloat(item[0]).toFixed(decimalLength);
  let qty = parseFloat(item[1]);

  if (type == "bid") {
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

function commitItemWithClientTick(item, type, lobDepth) {
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

    lobDepth.asks[targetPrice] = updatedPriceObject;
  }
}

function commitLastItemWithoutClientTick(
  lastTrade,
  marketTrades,
  decimalLength
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
}

function commitLastItemWithClientTick(
  lastTrade,
  marketTrades,
  tickSize,
  decimalLength
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
}
export function commitToMarketTrade(
  data,
  marketTrades,
  customTickSize,
  tickSize,
  decimalLength
) {
  if (!customTickSize) {
    commitLastItemWithoutClientTick(data, marketTrades, decimalLength);
  } else {
    commitLastItemWithClientTick(data, marketTrades, tickSize, decimalLength);
  }
}
