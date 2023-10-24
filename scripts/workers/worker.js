import {
  initialiseWebSocket,
  clearTrades,
} from "../binance/binanceWebSocket.js";
onmessage = function (e) {
  if (e.data.length == 1 && e.data[0] == "clearTrades") {
    clearTrades();
  } else if (e.data.length == 4) {
    initialiseWebSocket(e.data[0], e.data[1], e.data[2], e.data[3]);
  }
};
