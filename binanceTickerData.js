const exchangeInfoEndpoint = "https://fapi.binance.com/fapi/v1/exchangeInfo";

export async function manageTicker(dataTicker) {
  const response = await fetch(exchangeInfoEndpoint);
  const exchangeInfo = await response.json();
  const ticker = exchangeInfo.symbols.filter((d) => d.symbol == dataTicker)[0];
  const { tickSize } = ticker.filters.filter(
    (d) => d.filterType == "PRICE_FILTER"
  )[0];
  const { stepSize } = ticker.filters.filter(
    (d) => d.filterType == "LOT_SIZE"
  )[0];
  return {
    ticker: dataTicker,
    tickSize: tickSize,
    lotStep: stepSize,
  };
}
