// for binance usd-m futures only
// this utilises recursion
export const depth = {
    bids: {},
    asks: {}
};
let ticker = undefined;
let limit = undefined;

// buffer related variables
let buffer = [];
let lastUpdateId = null;
let firstEventProcessed = false;
let lastUpdatedEvent = null;

function commitToDepth(snapshot){
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
                };

                lobDepth.bids[price] = {
                    price: parseFloat(price), 
                    qty
                };
            } else if (type == "ask") {
                if (qty === 0) {
                    delete lobDepth.asks[price];
                    continue;
                };

                lobDepth.asks[price] = {
                    price: parseFloat(price),
                    qty
                }
            }
        }
    }
    iter(bids, "bid");
    iter(asks, "ask");
}

async function applySnapshot() {
    console.log("STEP 3")
    const response = await fetch(
        `https://fapi.binance.com/fapi/v1/depth?symbol=${ticker}&limit=${limit}`
    )
    const snapshot = await response.json();
    commitToDepth(snapshot);
    return snapshot.lastUpdateId;
}

async function processBuffer() {
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
        await processBuffer();
        return;
    }

    // step 5
    if (!firstEventProcessed) {
        if (event.U > lastUpdateId) {
            console.log("Step 5");
            
            // go back to step 3
            lastUpdateId = await applySnapshot();
            await processBuffer();
            return;
        } else {
            firstEventProcessed = true;
            // reset last update event
            lastUpdatedEvent = null;
        }
    }
    // Step 6
    if(lastUpdatedEvent) {
        if (event.pu != lastUpdatedEvent.u) {
            console.log("step 6");

            //reset step 5 and 6 again
            firstEventProcessed = false;
            lastUpdatedEvent = null;

            //go back to step 3
            lastUpdateId = await applySnapshot();

            await processBuffer();
            return;
        }
    }

    // update last updatedEvent
    lastUpdatedEvent = event;
    commitToDepth(event);
    await processBuffer();
}

export async function manageOrderBook(data, dataTicker, restQtyLimit){
    buffer.push(data);

    if (buffer.length === 1) {
        if(!lastUpdateId) {
            console.log("initial call");
            ticker = dataTicker;
            limit = restQtyLimit;
            lastUpdateId = await applySnapshot();
            await processBuffer();
            return;
        }

        console.log("...");
        await processBuffer();
    }

}
