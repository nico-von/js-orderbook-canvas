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
  getRelativeLargestDepth,
  getRelativeLargestVp
} from "../data/data.js";

export function gridDraw(i, nextY, start, end) {
  const { gridColourObject, defaultGridStrokeWidth } = this.addSettings;
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
  const {
    gridColourObject,
    highlightYColourObject,
    highlightXColourObject,
    defaultGridStrokeWidth,
    highlightedGridStrokeWidth,
    priceColumn,
  } = this.addSettings;
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

export function dataDraw(i, nextY, start, end) {
  const { dataTextColour, data, otherColsDecimalLength, gridColourObject } =
    this.addSettings;
  // default fill style
  this.ctx.fillStyle = dataTextColour;
  // price data
  const currPrice = getPriceLevel(i, data);
  const bestBid = getBestBid(data);
  const bestAsk = getBestAsk(data);
  const atBestBid = Math.round(i) == bestBid;
  const atBestAsk = Math.round(i) == bestAsk;
  const largestBid = getRelativeLargestDepth(start, end, data, true);
  const largestAsk = getRelativeLargestDepth(start, end, data, false);
  const largestSvpBuy = getRelativeLargestVp(start, end, data, true, true);
  const largestSvpSell = getRelativeLargestVp(start, end, data, true, false);
  const svpLarger = Math.max(largestSvpBuy, largestSvpSell);

  for (let j = 0; j < this.gridColumnCount; j++) {
    // grid text
    let dataText = "";
    // this.ctx.strokeStyle = gridColourObject.default;
    switch (j) {
      case 0:
        const svpBuy = getBuy(i, data, otherColsDecimalLength, true);
        const svpSell = getSell(i, data, otherColsDecimalLength, true);

        const svpBuyHigher = +svpBuy >= +svpSell;
        dataText = `${svpBuy}, ${svpSell}, ${svpBuyHigher}`;

        const svpBuyWidthAdj = svpBuy / svpLarger;
        const svpSellWidthAdj = svpSell / svpLarger;

        const svpLower = svpBuyHigher ? svpSellWidthAdj : svpBuyWidthAdj;
        const svpLowerWidth = this.cellWidths[j] * (svpLower); 

        const svpHigher = svpBuyHigher ? svpBuyWidthAdj : svpSellWidthAdj;
        const svpHigherWidth = (this.cellWidths[j] * (svpHigher)) - svpLowerWidth;
        
        const gridfillStyle = svpBuyHigher ? gridColourObject.sells: gridColourObject.buys;
        
        const gridOuterFillStyle = svpBuyHigher ? gridColourObject.buys: gridColourObject.sells;

        // set grid
        const gridInner = drawGridCell(
          this.cellHeight,
          svpLowerWidth,
          j,
          nextY,
          this.xCoordinate[j]
        );
        this.ctx.fillStyle = gridfillStyle;
        this.ctx.fill(gridInner[0]);

        // set grid b
        const gridOuter = drawGridCell(
          this.cellHeight,
          svpHigherWidth,
          j,
          nextY,
          this.xCoordinate[j] + svpLowerWidth
        )

        // console.log(this.cellWidths[j], this.xCoordinate[j] + svpLowerWidth, this.cellWidths[j] * svpRemaining)
        this.ctx.fillStyle = gridOuterFillStyle;
        this.ctx.fill(gridOuter[0]);
        this.ctx.fillStyle = dataTextColour;
        
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
          const widthAdjustment = bid / largestBid;
          const grid = drawGridCell(
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
          const grid = drawGridCell(
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
          const grid = drawGridCell(
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
        if (ask) {
          // set text;
          dataText = ask;
          // set grid
          const widthAdjustment = ask / largestAsk;
          const grid = drawGridCell(
            this.cellHeight,
            this.cellWidths[j] * widthAdjustment,
            j,
            nextY,
            this.xCoordinate[j]
          );
          this.ctx.fillStyle = gridColourObject.asks;
          this.ctx.fill(grid[0]);
          this.ctx.fillStyle = dataTextColour;
        }
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
