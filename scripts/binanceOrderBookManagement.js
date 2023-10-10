// for binance usd-m futures only
// this utilises recursion

// SAMPLE DEPTH OBJECT:
// depth = {
//     bids: {},
//     asks: {}
// };

// buffer related variables
let buffer = [];
let lastUpdateId = null;
let firstEventProcessed = false;
let lastUpdatedEvent = null;

async function getSnapshot(ticker, limit) {
  const response = await fetch(
    `https://fapi.binance.com/fapi/v1/depth?symbol=${ticker}&limit=${limit}`
  );
  return await response.json();
}

function commitToDepth(snapshot, lobDepth) {
  // populate accordingly
  let bids = snapshot.e ? snapshot.b : snapshot.bids;
  let asks = snapshot.e ? snapshot.a : snapshot.asks;

  function iter(arr, type) {
    for (let item of arr) {
      // we need to convert this to string
      let price = item[0];
      let qty = parseFloat(item[1]);

      if (type == "bid") {
        if (qty === 0) {
          delete lobDepth.bids[price];
          continue;
        }

        lobDepth.bids[price] = {
          price,
          qty,
          priceFloat: parseFloat(price),
        };
      } else if (type == "ask") {
        if (qty === 0) {
          delete lobDepth.asks[price];
          continue;
        }

        lobDepth.asks[price] = {
          price,
          qty,
          priceFloat: parseFloat(price),
        };
      }
    }
  }
  iter(bids, "bid");
  iter(asks, "ask");
}

async function applySnapshot(ticker, limit, lobDepth) {
  console.log("STEP 3");
  const snapshot = await getSnapshot(ticker, limit);
  commitToDepth(snapshot, lobDepth);
  return snapshot.lastUpdateId;
}

async function processBuffer(ticker, limit, lobDepth) {
  if (!lastUpdateId) {
    console.log("lastUpdate missing");
    return;
  }

  // base case
  if (buffer.length === 0) {
    return;
  }

  // recursive case
  const event = buffer.shift();

  // step 4
  if (event.u < lastUpdateId) {
    console.log("Step 4");

    // drop event
    await processBuffer(ticker, limit, lobDepth);
    return;
  }

  // step 5
  if (!firstEventProcessed) {
    if (event.U > lastUpdateId) {
      console.log("Step 5");

      // go back to step 3
      lastUpdateId = await applySnapshot(ticker, limit, lobDepth);
      await processBuffer(ticker, limit, lobDepth);
      return;
    } else {
      firstEventProcessed = true;
      // reset last update event
      lastUpdatedEvent = null;
    }
  }
  // Step 6
  if (lastUpdatedEvent) {
    if (event.pu != lastUpdatedEvent.u) {
      console.log("step 6");

      //reset step 5 and 6 again
      firstEventProcessed = false;
      lastUpdatedEvent = null;

      //go back to step 3
      lastUpdateId = await applySnapshot(ticker, limit, lobDepth);

      await processBuffer(ticker, limit, lobDepth);
      return;
    }
  }

  // update last updatedEvent
  lastUpdatedEvent = event;
  commitToDepth(event, lobDepth);
  await processBuffer(ticker, limit, lobDepth);
}

export async function manageOrderBook(
  data,
  dataTicker,
  restQtyLimit,
  lobDepth
) {
  buffer.push(data);

  if (buffer.length === 1) {
    if (!lastUpdateId) {
      console.log("initial call");
      lastUpdateId = await applySnapshot(dataTicker, restQtyLimit, lobDepth);
      await processBuffer(dataTicker, restQtyLimit, lobDepth);
      return;
    }

    console.log("...");
    await processBuffer(dataTicker, restQtyLimit, lobDepth);
  }
}
