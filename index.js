// import D3
import { scaleLinear, max } from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// class and function declarations
class OrderFlowCanvas {
  constructor(right, bottom, top, left, canvas) {
    this.right = right; //also width
    this.bottom = bottom; //also height
    this.top = top;
    this.left = left;
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");
    this.init();
  }
  init() {
    this.canvas.width = this.right;
    this.canvas.height = this.bottom;
  }
  redraw() {
    this.ctx.clearRect(0, 0, this.right, this.bottom);
    if (this.drawGrid) {
      this.drawGrid();
    } else if (this.draw) {
      this.draw();
    }
  }
}

class CanvasContainer extends OrderFlowCanvas {
  constructor(right, bottom, top, left, canvas, content) {
    super(right, bottom, top, left, canvas);
    this.content = content;
  }

  initContent() {
    if (!this.content) {
      return;
    }
    const { width, height } = this.canvas.getBoundingClientRect();
    this.content.right = width;
    this.content.bottom = height;

    if (this.content instanceof CanvasGridContent) {
      this.content.maxCells = Math.ceil((height / this.content.cellHeight) * 2);
    }

    if (this.content.gridColumnCount) {
      let setXOnly = false;
      this.content.xCoordinate = [];
      this.content.nextTabMove = [];
      this.content.isMoving = [];
      this.content.cellWidths = [];
      this.content.cellWidth = width / this.content.gridColumnCount;
      if (
        this.content.gridColumns &&
        length(this.content.gridColumns) >= this.content.gridColumnCount &&
        this.content.gridCellWidths &&
        length(this.content.gridCellWidths) >= this.content.gridColumnCount
      ) {
        setXOnly = true;
      }
      for (let i = 0; i < this.content.gridColumnCount; i++) {
        this.content.nextTabMove[i] = undefined;
        this.content.isMoving[i] = false;

        if (setXOnly) {
          this.content.xCoordinate[i] = this.content.gridColumns[i];
          this.content.cellWidths[i] = this.content.gridCellWidths[i];
          continue;
        }
        this.content.xCoordinate[i] = i * this.content.cellWidth;
        this.content.cellWidths[i] = this.content.cellWidth;
      }
    }
  }

  isOnCanvas(x, y) {
    // set where canvas mouse events are allowed
    return (
      x >= this.left &&
      x <= this.left + this.canvas.width &&
      (y >=
      this.top + (this.content instanceof CanvasGridContent && this.gridOffset)
        ? this.gridOffset
        : 0) &&
      (y <=
      this.top +
        this.canvas.height +
        (this.content instanceof CanvasGridContent && this.gridOffset)
        ? this.gridOffset
        : 0)
    );
  }

  // for dynamic scroll
  #updateDynamic(deltaY) {
    // calculate next starting cell & max cell
    this.content.startCell += deltaY / this.content.cellHeight;
    this.content.maxCells += deltaY / this.content.cellHeight;
    this.content.currentY -= deltaY;
  }

  handleScroll(e) {
    this.#updateDynamic(e.deltaY);
    drawOnContainer(this);
  }
}

class CanvasContent extends OrderFlowCanvas {
  constructor(right, bottom, top, left, draw) {
    super(right, bottom, top, left, document.createElement("canvas"));
    this.draw = draw;
  }
}

class CanvasGridContent extends CanvasContent {
  constructor(
    right,
    bottom,
    top,
    left,
    draw,
    startingCell,
    cellHeight,
    gridColumnCount,
    gridColumns,
    gridCellWidths
  ) {
    super(right, bottom, top, left, draw);
    this.startCell = startingCell; // starting cell index to rendering
    this.cellHeight = cellHeight; // cell Height
    this.gridColumnCount = gridColumnCount; // grid column count
    this.gridColumns = gridColumns;
    this.gridCellWidths = gridCellWidths;
    this.currentY = this.top; // current Y location
  }

  drawGrid() {
    const totalCells = this.maxCells - this.startCell;
    // calculate for endCell
    const endCell = this.startCell + totalCells;
    // start loop
    for (let i = this.startCell; i < endCell; i++) {
      let nextY = Math.round(i) + this.currentY / this.cellHeight;

      // optimization only
      const realY = nextY * this.cellHeight;
      if (realY > this.bottom || realY < this.top) {
        continue;
      }

      // ctx jobs
      this.draw(i, nextY);
    }
  }
}

// HELPER FUNCTIONS
// smooth canvases
function smoothifyCanvases(container, content) {
  let { width, height } = container.canvas.getBoundingClientRect();

  // dpr
  const dpr = window.devicePixelRatio;

  width = Math.ceil(width * dpr);
  height = Math.ceil(height * dpr);

  content.canvas.width = width;
  content.canvas.height = height;
  container.canvas.width = width;
  container.canvas.height = height;

  // style
  container.canvas.style.width = `${width / dpr}px`;
  container.canvas.style.height = `${height / dpr}px`;

  // scale
  content.ctx.scale(dpr, dpr);
  return { width, height };
}

// draw on container
function drawOnContainer(container, gridOffset) {
  const { content } = container;
  if (!gridOffset) {
    // if gridOffset is not given we will assume
    // it is in the object
    gridOffset = container.gridOffset;
  } else {
    // if it is given, set it as the gridOffset
    container.gridOffset = gridOffset;
    content.gridOffset = gridOffset;
  }

  content.redraw();
  container.ctx.clearRect(
    0,
    0,
    container.canvas.width,
    container.canvas.height
  );
  if (content instanceof CanvasGridContent) {
    container.ctx.drawImage(content.canvas, 0, gridOffset);
  } else if (content instanceof CanvasContent) {
    container.ctx.drawImage(content.canvas, 0, 0);
  }
}

// draw grid
function drawGridCell(height, width, xOffset, yOffset, xCoordinate) {
  // returns rectangle & xOffset
  const x = xCoordinate ? xCoordinate : xOffset * width;
  const y = yOffset * height;
  const rectangle = new Path2D();
  rectangle.rect(x, y, width, height);
  return [rectangle, xOffset];
}

// dynamic X management
function xManager(i, content, children) {
  const xOffset = 5;
  const xBounds = 30;
  if (content.clickX) {
    if (
      Math.floor(content.clickX) <=
        Math.floor(content.xCoordinate[i] + xOffset) &&
      Math.floor(content.clickX) >= Math.floor(content.xCoordinate[i] - xOffset)
    ) {
      content.tabToMove = i;
      content.tabMoved = i;
    }
  }
  if (content.mouseDown && content.tabToMove == i) {
    content.isMoving[i] = true;
    content.nextTabMove[i] = content.x;
  } else if (!content.mouseDown) {
    content.isMoving[i] = false;

    const isStartEdge = content.tabMoved == 0;
    const isEndEdge = content.tabMoved >= content.gridColumnCount - 1;

    const withinBoundsAfter =
      Math.floor(content.nextTabMove[content.tabMoved]) <=
      Math.floor(content.xCoordinate[content.tabMoved + 1] - xBounds);
    const withinBoundsBefore =
      Math.floor(content.nextTabMove[content.tabMoved]) >=
      Math.floor(content.xCoordinate[content.tabMoved - 1] + xBounds);
    const withinBoundsRight =
      Math.floor(content.nextTabMove[content.tabMoved]) <=
      Math.floor(content.right - xBounds);
    if (
      (isEndEdge && !isStartEdge && withinBoundsBefore && withinBoundsRight) ||
      (!isStartEdge && !isEndEdge && withinBoundsBefore && withinBoundsAfter)
    ) {
      const deltaX =
        content.xCoordinate[content.tabMoved] -
        content.nextTabMove[content.tabMoved];
      content.xCoordinate[content.tabMoved] =
        content.nextTabMove[content.tabMoved];

      for (let child of children) {
        // remove deltaX from affected tab
        child.cellWidths[content.tabMoved - 1] -= deltaX;
        // maintain moved tab width
        child.cellWidths[content.tabMoved] += deltaX;
        child.xCoordinate[content.tabMoved] =
          content.nextTabMove[content.tabMoved];
      }
    }
  }
}
// LISTENER OBJS

// LISTENERS
function wheelHandlerAllContainers(e) {
  const container = this.getBoundingClientRect();
  const x = e.clientX - container.left;
  const y = e.clientY - container.top;

  if (dataContainer.isOnCanvas(x, y)) {
    e.preventDefault();
    e.stopPropagation();
    gridContainer.handleScroll(e);
    dataContainer.handleScroll(e);
  }
}

function mouseMoveHandler(e) {
  const container = this.getBoundingClientRect();
  const x = e.clientX - container.left;
  const y = e.clientY - container.top;

  if (gridContainer.isOnCanvas(x, y)) {
    gridContainer.content.x = x;
    gridContainer.content.y = y;

    // redraw containers
    drawOnContainer(gridContainer);
  } else if (tabContainer.isOnCanvas(x, y)) {
    if (!tabContainer.content.mouseDown) {
      // reset tab settings
      // if mouse is not down
      tabContainer.content.tabMoved = -1;
      tabContainer.content.tabToMove = -1;
      tabContainer.content.clickX = undefined;
    }

    tabContainer.content.x = x;
    tabContainer.content.y = y;

    // redraw containers
    drawOnContainer(tabContainer);
    drawOnContainer(gridContainer);
    drawOnContainer(dataContainer);
  }
}

function mouseDownHandler(e) {
  const container = this.getBoundingClientRect();
  const x = e.clientX - container.left;
  const y = e.clientY - container.top;

  if (tabContainer.isOnCanvas(x, y) && !tabContainer.content.mouseDown) {
    tabContainer.content.mouseDown = true;
    tabContainer.content.clickX = x;

    // redraw containers
    drawOnContainer(tabContainer);
    drawOnContainer(gridContainer);
    drawOnContainer(dataContainer);
  }
}

function mouseUpHandler(e) {
  // reset tab settings without resetting tabMoved;
  if (tabContainer.content.mouseDown) {
    tabContainer.content.mouseDown = false;
    tabContainer.content.tabToMove = -1;
    tabContainer.content.clickX = undefined;

    drawOnContainer(tabContainer);
    drawOnContainer(gridContainer);
    drawOnContainer(dataContainer);
  }
}

function mouseClickHandler(e) {
  const container = this.getBoundingClientRect();
  const x = e.clientX - container.left;
  const y = e.clientY - container.top;

  if (tabContainer.isOnCanvas(x, y)) {
    tabContainer.content.clickX = x;
  }
}

// GLOBALS
// Canvas Tab Settings
const data = scaleLinear([0, 1000], [0, 1000]);
const canvasTabTop = 0;
let canvasTabBottom = 15;
const canvasTabOffset = 3.5;
const tabs = ["delta", "limit", "bid", "price", "ask", "limit", "delta"];
// Container Settings
const mainCanvasRight = 700;
const mainCanvasBottom = 200;
const mainCanvasLeft = 0;
const mainCanvasTop = 0;

// Grid Settings

const gridColumns = 7;
const priceColumn = 3;
const cellHeight = 20;

const gridStartCell = 0;

// Canvas
const canvasGrid = document.getElementById("canvasGrid");
const canvasData = document.getElementById("canvasData");
const canvasTabs = document.getElementById("canvasTabs");

// fonts
const tabTextFont = "0.7rem 'Roboto-Mono', monospace";

// colours
const gridColourObject = { default: "#ffffff", a: "#4C4E52", b: "#6F7378" };
const highlightXColourObject = { 2: "#00ff00", 4: "#ff0000" };
const highlightYColourObject = "#d3d3d3";
const dataTextColour = "#f0f0f0";
const tabTextColour = "#ffffff";
const tabLineColour = "#f0f0f0";

// lines
const highlightedGridStrokeWidth = 1;
const defaultGridStrokeWidth = 0.18;

// CANVASES

// 1. GRID

// grid container (z-index should be bottom-most)
const gridContainer = new CanvasContainer(
  mainCanvasRight,
  mainCanvasBottom,
  mainCanvasTop,
  mainCanvasLeft,
  canvasGrid,
  undefined
);

// grid content
const gridContent = new CanvasGridContent(
  mainCanvasRight, // the right of gridContent(X2)
  mainCanvasBottom * 2, // the bottom of gridContent(Y2)
  // **Needs to have off-canvas padding to perform
  // behind the scenes manipulation such as adding of
  // grid cells for a beautiful scroll effect!
  -cellHeight, // the top or Y1 **Also needs padding for similar reasons
  mainCanvasLeft, // the left or starting X1
  undefined,
  gridStartCell, // startingCell
  cellHeight, // cell height
  gridColumns
);

// 2. DATA
const dataContainer = new CanvasContainer(
  mainCanvasRight,
  mainCanvasBottom,
  mainCanvasTop,
  mainCanvasLeft,
  canvasData,
  undefined
);

const dataContent = new CanvasGridContent(
  mainCanvasRight,
  mainCanvasBottom * 2,
  -cellHeight,
  mainCanvasLeft,
  undefined,
  gridStartCell,
  cellHeight,
  gridColumns
);

// 3. MAIN TABS
const tabContainer = new CanvasContainer(
  mainCanvasRight,
  canvasTabBottom,
  canvasTabTop,
  mainCanvasLeft,
  canvasTabs,
  undefined
);
const tabContent = new CanvasContent(
  mainCanvasRight,
  canvasTabBottom,
  canvasTabTop,
  mainCanvasLeft,
  undefined
);
// Add grid column count for tab offset calculation
tabContent.gridColumnCount = gridColumns;

// DRAW FUNCTIONS
function gridDraw(i, nextY) {
  //fill style
  if (Math.round(i) % 2 == 0) {
    this.ctx.fillStyle = gridColourObject.a;
  } else {
    this.ctx.fillStyle = gridColourObject.b;
  }

  let yPosition = 0;
  if (this.x && this.y) {
    // get relative Y pos
    // added back gridOffset to compensate offset
    const relativeY = (this.y - this.currentY - this.gridOffset) / this.bottom;

    // get y Position of selected cell
    yPosition = Math.floor(relativeY * (this.bottom / this.cellHeight));
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

function dataDraw(i, nextY) {
  // sample data rendering
  this.ctx.fillStyle = dataTextColour;
  this.ctx.fillText(
    Math.round(i),
    this.xCoordinate[priceColumn],
    nextY * this.cellHeight + 16
  );
}

function tabDraw() {
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

gridContent.draw = gridDraw;
dataContent.draw = dataDraw;
tabContent.draw = tabDraw;

//set children
tabContent.children = [gridContent, dataContent];

window.onload = function () {
  // smoothen canvases
  smoothifyCanvases(gridContainer, gridContent);
  smoothifyCanvases(dataContainer, dataContent);
  canvasTabBottom = smoothifyCanvases(tabContainer, tabContent).height;

  // set contents
  gridContainer.content = gridContent;
  dataContainer.content = dataContent;
  tabContainer.content = tabContent;

  gridContainer.initContent();
  dataContainer.initContent();
  tabContainer.initContent();

  // initial draw
  drawOnContainer(gridContainer, canvasTabBottom);
  drawOnContainer(dataContainer, canvasTabBottom);
  drawOnContainer(tabContainer, canvasTabBottom);

  // event listeners
  // this was originally a method in the container
  // but decided to take it out for much easier readability
  dataContainer.canvas.addEventListener("wheel", wheelHandlerAllContainers, {
    passive: false,
  });
  dataContainer.canvas.addEventListener("mousemove", mouseMoveHandler);
  dataContainer.canvas.addEventListener("mousedown", mouseDownHandler);
  dataContainer.canvas.addEventListener("click", mouseClickHandler);
  window.addEventListener("mouseup", mouseUpHandler);
};
