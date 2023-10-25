import {
  getBuy,
  getSell,
  getBid,
  getAsk,
  getDelta,
  getVP,
} from "../data/data.js";
import {
  data,
  otherColsDecimalLength,
  gridColourObject,
  dataTextColour,
} from "../settings.js";
import { drawGridCell } from "./canvasFunctions.js";

import { textOffsetX, textOffsetY } from "../settings.js";

function printText(content, dataText, j, nextY, align) {
  switch (align) {
    case "right":
      content.ctx.fillText(
        dataText,
        content.xCoordinate[j] +
          content.cellWidths[j] -
          content.ctx.measureText(dataText).width -
          textOffsetX,
        nextY * content.cellHeight + textOffsetY
      );
      break;
    case "left":
      content.ctx.fillText(
        dataText,
        content.xCoordinate[j] + textOffsetX,
        nextY * content.cellHeight + textOffsetY
      );
    default:
      return;
  }
}

function fillGridCell(content, colour, grid, defaultColour) {
  content.ctx.fillStyle = colour;
  content.ctx.fill(grid);
  content.ctx.fillStyle = defaultColour;
}

function strokeGridCell(content, colour, grid, defaultColour) {
  content.ctx.strokeStyle = colour;
  content.ctx.stroke(grid);
  content.ctx.strokeStyle = defaultColour;
}

export function fillVP(content, i, vpLarger, isSession, j, nextY) {
  const vpBuy = getBuy(i, data, otherColsDecimalLength, isSession);
  const vpSell = getSell(i, data, otherColsDecimalLength, isSession);

  const vpBuyHigher = +vpBuy >= +vpSell;
  const vpBuyWidthAdj = vpBuy / vpLarger;
  const vpSellWidthAdj = vpSell / vpLarger;

  const vpLower = vpBuyHigher ? vpSellWidthAdj : vpBuyWidthAdj;
  const vpLowerWidth = content.cellWidths[j] * (vpLower > 1 ? 1 : vpLower);

  const vpHigher = vpBuyHigher ? vpBuyWidthAdj : vpSellWidthAdj;
  const vpHigherWidth =
    content.cellWidths[j] * (vpHigher > 1 ? 1 : vpHigher) - vpLowerWidth;

  const gridfillStyle = vpBuyHigher
    ? gridColourObject.sells
    : gridColourObject.buys;

  const gridOuterFillStyle = vpBuyHigher
    ? gridColourObject.buys
    : gridColourObject.sells;

  // set grid

  const gridInner = drawGridCell(
    content.cellHeight,
    vpLowerWidth,
    j,
    nextY,
    content.xCoordinate[j]
  );
  fillGridCell(content, gridfillStyle, gridInner[0], dataTextColour);

  // set grid b
  const gridOuter = drawGridCell(
    content.cellHeight,
    vpHigherWidth,
    j,
    nextY,
    content.xCoordinate[j] + vpLowerWidth
  );

  fillGridCell(content, gridOuterFillStyle, gridOuter[0], dataTextColour);
}

export function printVP(content, i, isSession, j, nextY) {
  const vp = getVP(i, data, otherColsDecimalLength, isSession);
  let dataText = vp ? vp : "";
  printText(content, dataText, j, nextY, "left");
}

export function printBidAsk(content, i, j, nextY, isBid) {
  let d = isBid
    ? getBid(i, data, otherColsDecimalLength)
    : getAsk(i, data, otherColsDecimalLength);
  let dataText = "";
  if (d) {
    // set text;
    dataText = d;
    // set grid
  }
  printText(content, dataText, j, nextY, isBid ? "right" : "left");
}

export function printBuySell(content, i, j, nextY, isBuy) {
  let d = isBuy
    ? getBuy(i, data, otherColsDecimalLength, false)
    : getSell(i, data, otherColsDecimalLength, false);
  let dataText = "";
  if (d) {
    dataText = d;
  }
  printText(content, dataText, j, nextY, isBuy ? "right" : "left");
}

export function printPrice(content, currPrice, j, nextY) {
  const dataText = currPrice;
  printText(content, dataText, j, nextY, "left");
}

export function printDelta(content, i, j, nextY) {
  let delta = getDelta(i, data);
  let dataText = delta != 0 ? delta.toFixed(otherColsDecimalLength) : "";
  printText(content, dataText, j, nextY, "left");
}

export function fillBidAsk(content, i, largestQty, j, nextY, isBid) {
  let d = isBid
    ? getBid(i, data, otherColsDecimalLength)
    : getAsk(i, data, otherColsDecimalLength);
  if (d) {
    const widthAdj = +d / largestQty;
    const gridWidth = content.cellWidths[j] * (widthAdj > 1 ? 1 : widthAdj);
    const gridOffset = isBid ? content.cellWidths[j] - gridWidth : 0;
    const gridColour = isBid ? gridColourObject.bids : gridColourObject.asks;
    const grid = drawGridCell(
      content.cellHeight,
      gridWidth,
      j,
      nextY,
      content.xCoordinate[j] + gridOffset
    );
    fillGridCell(content, gridColour, grid[0], dataTextColour);
  }
}

export function fillBuySell(content, i, largestCVPQty, j, nextY, atBBO, isBuy) {
  let d = isBuy
    ? getBuy(i, data, otherColsDecimalLength, false)
    : getSell(i, data, otherColsDecimalLength, false);
  if (d) {
    const widthAdj = +d / largestCVPQty;
    const gridWidth = content.cellWidths[j] * (widthAdj > 1 ? 1 : widthAdj); //compensate for trivial worker message delay
    const gridOffset = isBuy ? content.cellWidths[j] - gridWidth : 0;
    const gridColour = isBuy ? gridColourObject.buys : gridColourObject.sells;
    const grid = drawGridCell(
      content.cellHeight,
      gridWidth,
      j,
      nextY,
      content.xCoordinate[j] + gridOffset
    );
    fillGridCell(content, gridColour, grid[0], dataTextColour);
  }
  if (atBBO) {
    // set grid
    const strokeColour = isBuy
      ? gridColourObject.bestAsk
      : gridColourObject.bestBid;
    const grid = drawGridCell(
      content.cellHeight,
      content.cellWidths[j],
      j,
      nextY,
      content.xCoordinate[j]
    );
    strokeGridCell(content, strokeColour, grid[0], dataTextColour);
  }
}

export function fillDelta(content, i, largestDelta, j, nextY) {
  let delta = getDelta(i, data);
  const widthAdj = Math.abs(delta) / largestDelta;
  const grid = drawGridCell(
    content.cellHeight,
    content.cellWidths[j] * (widthAdj > 1 ? 1 : widthAdj),
    j,
    nextY,
    content.xCoordinate[j]
  );
  if (delta > 0) {
    fillGridCell(content, gridColourObject.buys, grid[0], dataTextColour);
  } else if (delta < 0) {
    fillGridCell(content, gridColourObject.sells, grid[0], dataTextColour);
  }
}
