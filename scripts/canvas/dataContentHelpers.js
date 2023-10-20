import { getBuy, getSell, getBid, getAsk, getDelta } from "../data/data.js";
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

export function printVP(content, i, vpLarger, isSession, j, nextY) {
  const vpBuy = getBuy(i, data, otherColsDecimalLength, isSession);
  const vpSell = getSell(i, data, otherColsDecimalLength, isSession);

  const vpBuyHigher = +vpBuy >= +vpSell;
  const vpBuyWidthAdj = vpBuy / vpLarger;
  const vpSellWidthAdj = vpSell / vpLarger;

  const vpLower = vpBuyHigher ? vpSellWidthAdj : vpBuyWidthAdj;
  const vpLowerWidth = content.cellWidths[j] * vpLower;

  const vpHigher = vpBuyHigher ? vpBuyWidthAdj : vpSellWidthAdj;
  const vpHigherWidth = content.cellWidths[j] * vpHigher - vpLowerWidth;

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

export function printBid(content, i, largestBid, j, nextY) {
  let bid = getBid(i, data, otherColsDecimalLength);
  let dataText = "";
  if (bid) {
    // set text;
    dataText = bid;
    // set grid
    const widthAdjustment = bid / largestBid;
    const gridWidth = content.cellWidths[j] * widthAdjustment;
    const gridOffset = content.cellWidths[j] - gridWidth;
    const grid = drawGridCell(
      content.cellHeight,
      gridWidth,
      j,
      nextY,
      content.xCoordinate[j] + gridOffset
    );
    fillGridCell(content, gridColourObject.bids, grid[0], dataTextColour);
  }
  printText(content, dataText, j, nextY, "right");
}

export function printSell(content, i, largestCvpSell, j, nextY, atBestBid) {
  let sell = getSell(i, data, otherColsDecimalLength);
  let dataText = "";
  if (sell) {
    //set text
    dataText = sell;
    const sellWidthAdj = sell / largestCvpSell;
    const grid = drawGridCell(
      content.cellHeight,
      content.cellWidths[j] * sellWidthAdj,
      j,
      nextY,
      content.xCoordinate[j]
    );
    fillGridCell(content, gridColourObject.sells, grid[0], dataTextColour);
  }
  if (atBestBid) {
    // set grid
    const bbGrid = drawGridCell(
      content.cellHeight,
      content.cellWidths[j],
      j,
      nextY,
      content.xCoordinate[j]
    );
    strokeGridCell(
      content,
      gridColourObject.bestBid,
      bbGrid[0],
      dataTextColour
    );
  }
  printText(content, dataText, j, nextY, "left");
}

export function printPrice(content, currPrice, j, nextY) {
  const dataText = currPrice;
  printText(content, dataText, j, nextY, "left");
}

export function printBuy(content, i, largestCvpBuy, j, nextY, atBestAsk) {
  let buy = getBuy(i, data, otherColsDecimalLength, false);
  let dataText = "";
  if (buy) {
    dataText = buy;
    const buyWidthAdj = buy / largestCvpBuy;
    const gridWidth = content.cellWidths[j] * buyWidthAdj;
    const gridOffset = content.cellWidths[j] - gridWidth;
    const grid = drawGridCell(
      content.cellHeight,
      gridWidth,
      j,
      nextY,
      content.xCoordinate[j] + gridOffset
    );
    fillGridCell(content, gridColourObject.buys, grid[0], dataTextColour);
  }
  if (atBestAsk) {
    // set grid
    const grid = drawGridCell(
      content.cellHeight,
      content.cellWidths[j],
      j,
      nextY,
      content.xCoordinate[j]
    );
    strokeGridCell(content, gridColourObject.bestAsk, grid[0], dataTextColour);
  }
  printText(content, dataText, j, nextY, "right");
}

export function printAsk(content, i, largestAsk, j, nextY) {
  let ask = getAsk(i, data, otherColsDecimalLength, false);
  let dataText = "";
  if (ask) {
    // set text;
    dataText = ask;
    // set grid
    const widthAdjustment = ask / largestAsk;
    const grid = drawGridCell(
      content.cellHeight,
      content.cellWidths[j] * widthAdjustment,
      j,
      nextY,
      content.xCoordinate[j]
    );
    fillGridCell(content, gridColourObject.asks, grid[0], dataTextColour);
  }

  printText(content, dataText, j, nextY, "left");
}

export function printDelta(content, i, j, nextY) {
  let delta = getDelta(i, data, otherColsDecimalLength);
  let dataText = delta != 0 ? delta : "";
  printText(content, dataText, j, nextY, "left");
}
