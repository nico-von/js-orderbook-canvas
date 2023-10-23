import { drawGridCell, xManager, getYPosition } from "./canvasFunctions.js";
import {
  getPriceLevel,
  getBestBid,
  getBestAsk,
  getRelativeLargestDepth,
  getRelativeLargestVp,
} from "../data/data.js";
import {
  fillVP,
  printBidAsk,
  printPrice,
  printBuySell,
  printDelta,
  fillBidAsk,
  fillBuySell,
} from "./dataContentHelpers.js";
import {
  gridColourObject,
  defaultGridStrokeWidth,
  highlightYColourObject,
  highlightXColourObject,
  highlightedGridStrokeWidth,
  priceColumn,
  dataTextColour,
  data,
  tabLineColour,
  tabTextColour,
  tabTextFont,
  tabs,
  canvasTabOffset,
} from "../settings.js";

export function gridDraw(i, nextY, start, end) {
  //fill style
  if (Math.round(i) % 2 == 0) {
    this.ctx.fillStyle = gridColourObject.a;
  } else {
    this.ctx.fillStyle = gridColourObject.b;
  }

  //render grid

  for (let j = 0; j < this.gridColumnCount; j++) {
    // create row grid
    const grid = drawGridCell(
      this.cellHeight,
      this.cellWidths[j],
      j,
      nextY,
      this.xCoordinate[j]
    );
    // > FILL
    this.ctx.fill(grid[0]);

    // stroke reset
    this.ctx.strokeStyle = gridColourObject.default;
    // reset lineWidth
    this.ctx.lineWidth = defaultGridStrokeWidth;
    // stroke grids
    this.ctx.stroke(grid[0]);
  }
}

export function selectorDraw(i, nextY, start, end) {
  //fill style

  let yPosition = 0;
  if (this.x && this.y) {
    // get relative Y pos
    yPosition = getYPosition(
      this.y,
      this.currentY,
      this.gridOffset,
      this.bottom,
      this.cellHeight
    );
  }
  const withinY = yPosition == Math.round(i);

  //render grid
  for (let j = 0; j < this.gridColumnCount; j++) {
    // create row grid
    const grid = drawGridCell(
      this.cellHeight,
      this.cellWidths[j],
      j,
      nextY,
      this.xCoordinate[j]
    );
    // > FILL

    const withinX =
      this.x >= this.xCoordinate[j] &&
      this.x <= this.xCoordinate[j] + this.cellWidths[j];

    if (withinY) {
      this.ctx.fillStyle = highlightYColourObject;
      this.ctx.fill(grid[0]);
    }

    // > STROKE
    // except price grid
    if (withinX && withinY && grid[1] != priceColumn) {
      this.ctx.lineWidth = highlightedGridStrokeWidth;
      this.ctx.strokeStyle = highlightXColourObject[grid[1]];
      this.ctx.stroke(grid[0]);
    }

    // stroke reset
    this.ctx.strokeStyle = gridColourObject.default;
    // reset lineWidth
    this.ctx.lineWidth = defaultGridStrokeWidth;
    // stroke grids
  }
}
export function visDraw(i, nextY, start, end) {
  // default fill style
  this.ctx.fillStyle = dataTextColour;

  // BBO
  const bestBid = getBestBid(data);
  const bestAsk = getBestAsk(data);

  const atBestBid = Math.round(i) == bestBid;
  const atBestAsk = Math.round(i) == bestAsk;

  // largest
  const largestBid = getRelativeLargestDepth(start, end, data, true);
  const largestAsk = getRelativeLargestDepth(start, end, data, false);
  const largestSvpBuy = getRelativeLargestVp(start, end, data, true, true);
  const largestSvpSell = getRelativeLargestVp(start, end, data, true, false);
  const largestCvpBuy = getRelativeLargestVp(start, end, data, false, true);
  const largestCvpSell = getRelativeLargestVp(start, end, data, false, false);

  // relative
  const svpLarger = Math.max(largestSvpBuy, largestSvpSell);
  const cvpLarger = Math.max(largestCvpBuy, largestCvpSell);
  const depthLarger = Math.max(largestBid, largestAsk);

  for (let j = 0; j < this.gridColumnCount; j++) {
    switch (j) {
      case 0:
        fillVP(this, i, svpLarger, true, j, nextY);
        break;
      case 1:
        fillVP(this, i, cvpLarger, false, j, nextY);
        break;
      case 2:
        fillBidAsk(this, i, depthLarger, j, nextY, true);
        break;
      case 3:
        fillBuySell(this, i, cvpLarger, j, nextY, atBestBid);
        break;
      case 4:
        break;
      case 5:
        fillBuySell(this, i, cvpLarger, j, nextY, atBestAsk, true);
        break;
      case 6:
        fillBidAsk(this, i, depthLarger, j, nextY);
        break;
      case 7:
        break;
      default:
        return;
    }
  }
}

export function dataDraw(i, nextY, start, end) {
  // default fill style
  this.ctx.fillStyle = dataTextColour;
  // price data
  const currPrice = getPriceLevel(i, data);

  for (let j = 0; j < this.gridColumnCount; j++) {
    switch (j) {
      case 0:
        break;
      case 1:
        break;
      case 2:
        printBidAsk(this, i, j, nextY, true);
        break;
      case 3:
        printBuySell(this, i, j, nextY);
        break;
      case 4:
        printPrice(this, currPrice, j, nextY);
        break;
      case 5:
        printBuySell(this, i, j, nextY, true);
        break;
      case 6:
        printBidAsk(this, i, j, nextY);
        break;
      case 7:
        printDelta(this, i, j, nextY);
        break;
      default:
        return;
    }
  }
}

export function tabDraw() {
  for (let i = 0; i < this.gridColumnCount; i++) {
    xManager(i, this, this.children);
    //movable tabs
    const tabOffset = (this.bottom * 1) / 5;

    const tab = new Path2D();
    tab.moveTo(
      this.isMoving[i] ? this.nextTabMove[i] : this.xCoordinate[i],
      this.top + tabOffset
    );
    tab.lineTo(
      this.isMoving[i] ? this.nextTabMove[i] : this.xCoordinate[i],
      this.top + this.bottom - tabOffset
    );

    // render
    this.ctx.strokeStyle = tabLineColour;
    this.ctx.stroke(tab);

    // text
    this.ctx.font = tabTextFont;
    this.ctx.fillStyle = tabTextColour;
    this.ctx.fillText(
      tabs[i].toUpperCase(), // text
      this.xCoordinate[i] + canvasTabOffset, //x
      this.bottom - this.bottom / 4
    );
  }
}
