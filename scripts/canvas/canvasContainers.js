import {
  CanvasContainer,
  CanvasGridContent,
  CanvasTabContent,
} from "./orderFlowCanvas.js";

import {
  mainCanvasRight,
  mainCanvasBottom,
  mainCanvasTop,
  mainCanvasLeft,
  canvasGrid,
  cellHeight,
  gridStartCell,
  gridColumns,
  canvasData,
  canvasTabBottom,
  canvasTabTop,
  canvasTabs,
  canvasSelector
} from "../settings.js";

// GRID
export const gridContainer = new CanvasContainer(
  mainCanvasRight,
  mainCanvasBottom,
  mainCanvasTop,
  mainCanvasLeft,
  canvasGrid,
  undefined
);

export const gridContent = new CanvasGridContent(
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
  gridColumns,
  undefined,
  undefined,
);

export const selectorContainer = new CanvasContainer(
  mainCanvasRight,
  mainCanvasBottom,
  mainCanvasTop,
  mainCanvasLeft,
  canvasSelector,
  undefined
)
export const selectorContent = new CanvasGridContent(
  mainCanvasRight,
  mainCanvasBottom * 2,
  -cellHeight,
  mainCanvasLeft,
  undefined,
  gridStartCell,
  cellHeight,
  gridColumns,
  undefined,
  undefined,
);

// DATA
export const dataContainer = new CanvasContainer(
  mainCanvasRight,
  mainCanvasBottom,
  mainCanvasTop,
  mainCanvasLeft,
  canvasData,
  undefined
);

export const dataContent = new CanvasGridContent(
  mainCanvasRight,
  mainCanvasBottom * 2,
  -cellHeight,
  mainCanvasLeft,
  undefined,
  gridStartCell,
  cellHeight,
  gridColumns,
  undefined,
  undefined,
);
// TAB

export const tabContainer = new CanvasContainer(
  mainCanvasRight,
  canvasTabBottom,
  canvasTabTop,
  mainCanvasLeft,
  canvasTabs,
  undefined
);

export const tabContent = new CanvasTabContent(
  mainCanvasRight,
  canvasTabBottom,
  canvasTabTop,
  mainCanvasLeft,
  undefined,
  gridColumns,
  undefined
);
