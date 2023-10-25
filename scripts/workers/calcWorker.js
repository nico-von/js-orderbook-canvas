onmessage = async function (e) {
  const [startPriceLevel, endPriceLevel, depth, trades] = e.data;
  const { tickSize } = depth;
  const { decimalLength } = depth;

  let largestDepth = 0;
  let largestDelta = 0;
  let largestMTSession = 0;
  let largestMTClient = 0;

  for (let i = +endPriceLevel; i < +startPriceLevel; i += tickSize) {
    const priceKey = i.toFixed(decimalLength);
    // Depth
    const b = depth.bids[priceKey];
    const a = depth.asks[priceKey];
    largestDepth = Math.max(largestDepth, b ? b.qty : 0, a ? a.qty : 0);

    // MTDelta
    const delta = trades.session.delta[priceKey];
    largestDelta = Math.max(largestDelta, delta ? Math.abs(delta.qty) : 0);

    // MTSession
    const sb = trades.session.buy[priceKey];
    const ss = trades.session.sell[priceKey];
    largestMTSession = Math.max(
      largestMTSession,
      sb ? sb.qty : 0,
      ss ? ss.qty : 0
    );

    // MTClient
    const cb = trades.client.buy[priceKey];
    const cs = trades.client.sell[priceKey];
    largestMTClient = Math.max(
      largestMTClient,
      cb ? cb.qty : 0,
      cs ? cs.qty : 0
    );
  }
  postMessage([largestDepth, largestDelta, largestMTSession, largestMTClient]);
};
