export const canvasTabTop = 0;
export const canvasTabBottom = 15;
export const canvasTabOffset = 3.5;
export const tabs = [
  "svp",
  "cvp",
  "bid",
  "sell",
  "price",
  "buy",
  "ask",
  "delta",
];

// Data Settings
export const data = {};
export const ticker = "BTCUSDT";
export const tickSize = 1;
export const priceColDecimalLength = 2;
export const otherColsDecimalLength = 2;
// Container Settings
export const mainCanvasRight = 700;
export const mainCanvasBottom = 500;
export const mainCanvasLeft = 0;
export const mainCanvasTop = 0;

// Grid Settings

export const gridColumns = 8;
export const priceColumn = 4;
export const cellHeight = 20;

export const gridStartCell = 0;

// Canvas
export const canvasGrid = document.getElementById("canvasGrid");
export const canvasData = document.getElementById("canvasData");
export const canvasTabs = document.getElementById("canvasTabs");

// fonts
export const tabTextFont = "0.7rem 'Roboto-Mono', monospace";

// grid colours
export const gridColourObject = {
  default: "#ffffff",
  a: "#4C4E52",
  b: "#6F7378",
  bestBid: "#155e15",
  bestAsk: "#940e0c"
};

//highlight X colour object, key, refers to tab number
export const highlightXColourObject = { 
  2: "#00ff00", //bid 
  6: "#ff0000"  //ask
};
export const highlightYColourObject = "#d3d3d3";
export const dataTextColour = "#f0f0f0";
export const tabTextColour = "#ffffff";
export const tabLineColour = "#f0f0f0";

// lines
export const highlightedGridStrokeWidth = 1;
export const defaultGridStrokeWidth = 0.18;
