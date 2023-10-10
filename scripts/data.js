import { scaleLinear } from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { initialiseWebSocket } from "./binanceWebSocket.js";

const depth = {
  bids: {},
  asks: {},
};

const lastTrade = {};

initialiseWebSocket("btcusdt", "1000", null, depth, lastTrade);
