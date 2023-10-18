import { drawGridCell, xManager, getYPosition } from "./canvasFunctions.js";
import {
  getBuy,
  getSell,
  getBid,
  getAsk,
  getDelta,
  getPriceLevel,
  getBestBid,
  getBestAsk,
  getRelativeLargestBid,
} from "../data/data.js";

export function gridDraw(i, nextY, start, end) {
  const {
    gridColourObject,
    highlightYColourObject,
    highlightXColourObject,
    defaultGridStrokeWidth,
    highlightedGridStrokeWidth,
    priceColumn,
  } = this.addSettings;
  //fill style
  if (Math.round(i) % 2 == 0) {
    this.ctx.fillStyle = gridColourObject.a;
  } else {
    this.ctx.fillStyle = gridColourObject.b;
  }

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

    const withinY = yPosition == Math.round(i);
    const withinX =
      this.x >= this.xCoordinate[j] &&
      this.x <= this.xCoordinate[j] + this.cellWidths[j];

    if (withinY) {
      this.ctx.fillStyle = highlightYColourObject;
    }
    this.ctx.fill(grid[0]);

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
    this.ctx.stroke(grid[0]);
  }
}

export function dataDraw(i, nextY, start, end) {
  const { dataTextColour, data, otherColsDecimalLength, gridColourObject } =
    this.addSettings;
  // default fill style
  this.ctx.fillStyle = dataTextColour;
  // price data
  const currPrice = getPriceLevel(i, data);
  const bestBid = getBestBid(data);
  const bestAsk = getBestAsk(data);
  const atBestBid = i == bestBid;
  const atBestAsk = i == bestAsk;
  const largestBid = getRelativeLargestBid(start, end, data);

  for (let j = 0; j < this.gridColumnCount; j++) {
    let grid;
    // grid text
    let dataText = "";
    // this.ctx.strokeStyle = gridColourObject.default;
    switch (j) {
      case 0:
        let svpBuy = getBuy(i, data, otherColsDecimalLength, true);
        let svpSell = getSell(i, data, otherColsDecimalLength, true);
        dataText = `${svpBuy ? svpBuy : 0}, ${svpSell ? svpSell : 0}`;
        break;
      case 1:
        let cvpBuy = getBuy(i, data, otherColsDecimalLength, false);
        let cvpSell = getSell(i, data, otherColsDecimalLength, false);
        dataText = `${cvpBuy ? cvpBuy : 0}, ${cvpSell ? cvpSell : 0}`;
        break;
      case 2:
        let bid = getBid(i, data, otherColsDecimalLength);
        if (bid) {
          // set text;
          dataText = bid;
          // set grid
          let widthAdjustment = bid / largestBid;
          grid = drawGridCell(
            this.cellHeight,
            this.cellWidths[j] * widthAdjustment,
            j,
            nextY,
            this.xCoordinate[j]
          );
          this.ctx.fillStyle = gridColourObject.bids;
          this.ctx.fill(grid[0]);
          this.ctx.fillStyle = dataTextColour;
        }

        break;
      case 3:
        if (atBestBid) {
          // set grid
          grid = drawGridCell(
            this.cellHeight,
            this.cellWidths[j],
            j,
            nextY,
            this.xCoordinate[j]
          );
          this.ctx.fillStyle = gridColourObject.bestBid;
          this.ctx.fill(grid[0]);
          this.ctx.fillStyle = dataTextColour;
        }
        let sell = getSell(i, data, otherColsDecimalLength);
        dataText = sell ? sell : "";
        break;
      case 4:
        dataText = currPrice;
        break;
      case 5:
        if (atBestAsk) {
          // set grid
          grid = drawGridCell(
            this.cellHeight,
            this.cellWidths[j],
            j,
            nextY,
            this.xCoordinate[j]
          );
          this.ctx.fillStyle = gridColourObject.bestAsk;
          this.ctx.fill(grid[0]);
          this.ctx.fillStyle = dataTextColour;
        }
        let buy = getBuy(i, data, otherColsDecimalLength, false);
        dataText = buy ? buy : "";
        break;
      case 6:
        let ask = getAsk(i, data, otherColsDecimalLength, false);
        dataText = ask ? ask : "";
        break;
      case 7:
        let delta = getDelta(i, data, otherColsDecimalLength);
        dataText = delta != 0 ? delta : "";
        break;
      default:
        dataText = "";
    }

    this.ctx.fillText(
      dataText,
      this.xCoordinate[j],
      nextY * this.cellHeight + 16
    );
  }
}

export function tabDraw() {
  const { tabLineColour, tabTextColour, tabTextFont, tabs, canvasTabOffset } =
    this.addSettings;
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
