import { roundToNearestTick } from "./numberManipulationFunctions.js";

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

function commitItemWithClientTick(item, type, lobDepth) {
  let price = item[0];
  let qty = parseFloat(item[1]);

  //get scale price as target
  const targetPrice = roundToNearestTick(
    price,
    lobDepth.tickInfo.clienTickSize,
    lobDepth.tickInfo.decimalLength
  );
}
