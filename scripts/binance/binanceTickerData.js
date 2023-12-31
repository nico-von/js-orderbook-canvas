const exchangeInfoEndpoint = "https://fapi.binance.com/fapi/v1/exchangeInfo";
const priceEndpoint = "https://fapi.binance.com/fapi/v1/ticker/price";

async function getExchangeInfo() {
  const response = await fetch(exchangeInfoEndpoint);
  return await response.json();
}

async function getCurrentPrice(dataTicker) {
  const response = await fetch(`${priceEndpoint}?symbol=${dataTicker}`);
  return await response.json();
}
export async function manageTicker(dataTicker) {
  const exchangeInfo = await getExchangeInfo();
  const ticker = exchangeInfo.symbols.filter((d) => d.symbol == dataTicker)[0];
  const { tickSize } = ticker.filters.filter(
    (d) => d.filterType == "PRICE_FILTER"
  )[0];
  const { stepSize } = ticker.filters.filter(
    (d) => d.filterType == "LOT_SIZE"
  )[0];

  const { price } = await getCurrentPrice(dataTicker);

  return {
    ticker: dataTicker,
    tickSize: tickSize,
    lotStep: stepSize,
    lastPrice: price,
  };
}
