import { CanvasGridContent, CanvasContent } from "./orderFlowCanvas.js";

export function smoothifyCanvases(container, content) {
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
export function drawOnContainer(container, gridOffset) {
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
export function drawGridCell(height, width, xOffset, yOffset, xCoordinate) {
  // returns rectangle & xOffset
  const x = xCoordinate ? xCoordinate : xOffset * width;
  const y = yOffset * height;
  const rectangle = new Path2D();
  rectangle.rect(x, y, width, height);
  return [rectangle, xOffset];
}

// dynamic X management
export function xManager(i, content, children) {
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

export function getYPosition(y, currentY, gridOffset, bottom, cellHeight){
  // added back gridOffset to compensate offset
  const relativeY = (y - currentY - gridOffset) / bottom;
  
    // get y Position of selected cell
  return Math.floor(relativeY * (bottom / cellHeight));
}