import { drawOnContainer } from "./canvasFunctions.js";

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

export class CanvasContainer extends OrderFlowCanvas {
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
  }
}
export class CanvasContent extends OrderFlowCanvas {
  constructor(right, bottom, top, left, draw) {
    // document.createElement("canvas")
    super(right, bottom, top, left, new OffscreenCanvas(0, 0));
    this.draw = draw;
  }
}

export class CanvasTabContent extends CanvasContent {
  constructor(right, bottom, top, left, draw, gridColumnCount, children) {
    super(right, bottom, top, left, draw);
    this.gridColumnCount = gridColumnCount;
    this.children = children;
  }
}

export class CanvasGridContent extends CanvasContent {
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
      this.draw(i, nextY, this.startCell, endCell);
    }
  }
}
