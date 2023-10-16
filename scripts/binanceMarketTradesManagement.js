import { commitToMarketTrade } from "./itemCommitAlgorithms.js";
// for binance usd-m only

// Initialise last trade with blank object
// lastTrade = {};

export async function manageMarketTrades(data, marketTrades) {
  const key = data.p;
  const price = parseFloat(data.p);
  const type = data.m ? "s" : "b"; //market sold - s | market bought - b
  const qty = parseFloat(data.q);

  let dataToCommit = {
    price,
    type,
    qty,
  };

  commitToMarketTrade(dataToCommit, marketTrades);
}
