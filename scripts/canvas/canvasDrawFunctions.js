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
import { textOffsetX, textOffsetY } from "../settings.js";

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
  const largestCvpBuy = getRelativeLargestVp(start, end, data, false, true);
  const largestCvpSell = getRelativeLargestVp(start, end, data, false, false);
  for (let j = 0; j < this.gridColumnCount; j++) {
    // grid text
    let dataText = "";
    // this.ctx.strokeStyle = gridColourObject.default;
    switch (j) {
      case 0:
        const svpBuy = getBuy(i, data, otherColsDecimalLength, true);
        const svpSell = getSell(i, data, otherColsDecimalLength, true);

        const svpBuyHigher = +svpBuy >= +svpSell;
        // dataText = `${svpBuy}, ${svpSell}, ${svpBuyHigher}`;

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
        this.ctx.fillText(
          dataText,
          this.xCoordinate[j] + textOffsetX,
          nextY * this.cellHeight + textOffsetY
        );
        break;
      case 2:
        let bid = getBid(i, data, otherColsDecimalLength);
        if (bid) {
          // set text;
          dataText = bid;
          // set grid
          const widthAdjustment = bid / largestBid;
          const gridWidth = this.cellWidths[j] * widthAdjustment;
          const gridOffset = this.cellWidths[j] - gridWidth; 
          const grid = drawGridCell(
            this.cellHeight,
            gridWidth,
            j,
            nextY,
            this.xCoordinate[j] + gridOffset
          );
          this.ctx.fillStyle = gridColourObject.bids;
          this.ctx.fill(grid[0]);
          this.ctx.fillStyle = dataTextColour;
        }
        this.ctx.fillText(
          dataText,
          this.xCoordinate[j] + this.cellWidths[j] - this.ctx.measureText(dataText).width - textOffsetX,
          nextY * this.cellHeight + textOffsetY
        );
        break;
      case 3:
        let sell = getSell(i, data, otherColsDecimalLength);
        dataText = sell ? sell : "";
        if(sell){
          const sellWidthAdj = sell / largestCvpSell;
          const grid = drawGridCell(
            this.cellHeight,
            this.cellWidths[j] * sellWidthAdj,
            j,
            nextY,
            this.xCoordinate[j]
          );
          this.ctx.fillStyle = gridColourObject.sells;
          this.ctx.fill(grid[0]);
          this.ctx.fillStyle = dataTextColour;
          
        }
        if (atBestBid) {
          // set grid
          const bbGrid = drawGridCell(
            this.cellHeight,
            this.cellWidths[j],
            j,
            nextY,
            this.xCoordinate[j]
          );
          this.ctx.strokeStyle = gridColourObject.bestBid;
          this.ctx.stroke(bbGrid[0]);
          this.ctx.strokeStyle = dataTextColour;
        }
        this.ctx.fillText(
          dataText,
          this.xCoordinate[j] + textOffsetX,
          nextY * this.cellHeight + textOffsetY
        );
        break;
      case 4:
        dataText = currPrice;
        this.ctx.fillText(
          dataText,
          this.xCoordinate[j],
          nextY * this.cellHeight + textOffsetY
        );
        break;
      case 5:
        let buy = getBuy(i, data, otherColsDecimalLength, false);
        dataText = buy ? buy : "";
        if(buy){
          const buyWidthAdj = buy / largestCvpBuy;
          const gridWidth = this.cellWidths[j] * buyWidthAdj;
          const gridOffset = this.cellWidths[j] - gridWidth; 
          const grid = drawGridCell(
            this.cellHeight,
            gridWidth,
            j,
            nextY,
            this.xCoordinate[j] + gridOffset
          );
          this.ctx.fillStyle = gridColourObject.buys;
          this.ctx.fill(grid[0]);
          this.ctx.fillStyle = dataTextColour;
          
        }
        if (atBestAsk) {
          // set grid
          const grid = drawGridCell(
            this.cellHeight,
            this.cellWidths[j],
            j,
            nextY,
            this.xCoordinate[j]
          );
          this.ctx.strokeStyle = gridColourObject.bestAsk;
          this.ctx.stroke(grid[0]);
          this.ctx.strokeStyle = dataTextColour;
        }
        this.ctx.fillText(
          dataText,
          this.xCoordinate[j] + this.cellWidths[j] - this.ctx.measureText(dataText).width - textOffsetX,
          nextY * this.cellHeight + textOffsetY
        );
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
        this.ctx.fillText(
          dataText,
          this.xCoordinate[j] + textOffsetX,
          nextY * this.cellHeight + textOffsetY
        );
        break;
      case 7:
        let delta = getDelta(i, data, otherColsDecimalLength);
        dataText = delta != 0 ? delta : "";
        this.ctx.fillText(
          dataText,
          this.xCoordinate[j] + textOffsetX,
          nextY * this.cellHeight + textOffsetY
        );
        break;
      default:
        dataText = "";
        this.ctx.fillText(
          dataText,
          this.xCoordinate[j] + textOffsetX,
          nextY * this.cellHeight + textOffsetY
        );
    }

    
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
