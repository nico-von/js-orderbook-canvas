import { commitToDepth } from "./itemCommitAlgorithms.js";
// for binance usd-m futures only
// this utilises recursion

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

async function applySnapshot(ticker, limit, lobDepth) {
  // console.log("STEP 3");
  const snapshot = await getSnapshot(ticker, limit);
  await commitToDepth(snapshot, lobDepth);
  return snapshot.lastUpdateId;
}

async function processBuffer(ticker, limit, lobDepth) {
  if (!lastUpdateId) {
    // console.log("lastUpdate missing");
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
    // console.log("Step 4");

    // drop event
    await processBuffer(ticker, limit, lobDepth);
    return;
  }

  // step 5
  if (!firstEventProcessed) {
    if (event.U > lastUpdateId) {
      // console.log("Step 5");

      // go back to step 3
      lastUpdateId = await applySnapshot(
        ticker,
        limit,
        lobDepth,
      );
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
      // console.log("step 6");

      //reset step 5 and 6 again
      firstEventProcessed = false;
      lastUpdatedEvent = null;

      //go back to step 3
      lastUpdateId = await applySnapshot(
        ticker,
        limit,
        lobDepth
      );

      await processBuffer(ticker, limit, lobDepth);
      return;
    }
  }

  // update last updatedEvent
  lastUpdatedEvent = event;
  await commitToDepth(event, lobDepth);
  await processBuffer(ticker, limit, lobDepth);
}

export async function manageOrderBook(
  data,
  dataTicker,
  restQtyLimit,
  lobDepth,
) {
  buffer.push(data);

  if (buffer.length === 1) {
    if (!lastUpdateId) {
      // console.log("initial call");
      lastUpdateId = await applySnapshot(
        dataTicker,
        restQtyLimit,
        lobDepth,
      );
      await processBuffer(dataTicker, restQtyLimit, lobDepth);
      return;
    }

    // console.log("...");
    await processBuffer(dataTicker, restQtyLimit, lobDepth);
  }
}
