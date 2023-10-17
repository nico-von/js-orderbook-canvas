import { commitToMarketTrade } from "./itemCommitAlgorithms.js";
// for binance usd-m only

// Initialise last trade with blank object
// lastTrade = {};

export async function manageMarketTrades(data, marketTrades) {
  const { customTickSize, tickSize, decimalLength } = marketTrades;
  const key = data.p;
  const price = parseFloat(data.p);
  const type = data.m ? "s" : "b"; //market sold - s | market bought - b
  const qty = parseFloat(data.q);

  let dataToCommit = {
    price,
    type,
    qty,
  };

  commitToMarketTrade(
    dataToCommit,
    marketTrades.client,
    customTickSize,
    tickSize,
    decimalLength
  );
  // have to commit it to SVP too, because marketTrades
  // is regularly cleared, and I think (for now) that
  // the best way of having the old data stick is to save it
  // to another object at the same time
  commitToMarketTrade(
    dataToCommit,
    marketTrades.session,
    customTickSize,
    tickSize,
    decimalLength
  );
}
