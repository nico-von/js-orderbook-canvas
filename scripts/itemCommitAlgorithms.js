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
      if (!lobDepth.tickInfo) {
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
  let price = item[0];
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

function processTargetPrice(targetPriceObject, originalPrice, qty) {
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
  targetPriceObject.quantities[originalPrice] = qty;
  let sumOfQuantities = sumAllValues(targetPriceObject.quantities);
  if (sumOfQuantities == 0) {
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
  let { decimalLength } = lobDepth.tickInfo;
  let { clientTickSize } = lobDepth.tickInfo;
  //get scale price as target
  const targetPrice = roundToNearestTick(price, clientTickSize, decimalLength);

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
      qty
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
      qty
    );

    if (!updatedPriceObject) {
      delete lobDepth.asks[targetPrice];
      return;
    }

    lobDepth.asks[targetPrice] = updatedPriceObject;
  }
}
