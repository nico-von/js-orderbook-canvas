// for binance usd-m only

// Initialise last trade with blank object 
// lastTrade = {};

export async function manageMarketTrades(data, lastTrade) {
    const key = data.p;
    const price = parseFloat(data.p);
    const type = data.m ? "sold" : "bought";
    const qty = parseFloat(data.q);

    lastTrade[key] = {
        price,
        type,
        qty
    }
}