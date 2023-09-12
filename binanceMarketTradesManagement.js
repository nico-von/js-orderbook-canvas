// for binance usd-m only
export const lastTrade = {};

export async function manageMarketTrades(data) {
    const key = data.p;
    const price = parseFloat(price);
    const type = data.m ? "sold" : "bought";
    const qty = parseFloat(data.q);

    lastTrade = {
        key,
        price,
        type,
        qty
    }
}