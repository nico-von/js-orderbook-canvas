import { drawOnContainer } from "./canvasFunctions.js";
import { data } from "../settings.js";
import {
  gridContainer,
  dataContainer,
  tabContainer,
  selectorContainer,
  visContainer,
} from "./canvasContainers.js";
import { adjustedCanvasTabBottom } from "../index.js";

const clearTradesEvent = new Event("clearTrades");
let previousTimestamp;

export function wheelHandlerAllContainers(e) {
  const container = this.getBoundingClientRect();
  const x = e.clientX - container.left;
  const y = e.clientY - container.top;

  if (selectorContainer.isOnCanvas(x, y)) {
    e.preventDefault();
    e.stopPropagation();

    gridContainer.handleScroll(e);
    dataContainer.handleScroll(e);
    visContainer.handleScroll(e);
    selectorContainer.handleScroll(e);

    drawOnContainer(tabContainer);
    drawOnContainer(gridContainer);
    drawOnContainer(selectorContainer);
    requestAnimationFrame(rafCallback);
  }
}

export function mouseMoveHandler(e) {
  const container = this.getBoundingClientRect();
  const x = e.clientX - container.left;
  const y = e.clientY - container.top;

  if (selectorContainer.isOnCanvas(x, y)) {
    gridContainer.content.x = x;
    gridContainer.content.y = y;
    selectorContainer.content.x = x;
    selectorContainer.content.y = y;

    // redraw containers
    requestAnimationFrame((t) => {
      if (previousTimestamp < t) {
        drawOnContainer(gridContainer);
        drawOnContainer(selectorContainer);
      }
      previousTimestamp = t;
    });
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
    drawOnContainer(selectorContainer);
    requestAnimationFrame(rafCallback);
  }
}

export function mouseDownHandler(e) {
  const container = this.getBoundingClientRect();
  const x = e.clientX - container.left;
  const y = e.clientY - container.top;

  if (tabContainer.isOnCanvas(x, y) && !tabContainer.content.mouseDown) {
    tabContainer.content.mouseDown = true;
    tabContainer.content.clickX = x;

    // redraw containers
    drawOnContainer(tabContainer);
    drawOnContainer(gridContainer);
    drawOnContainer(selectorContainer);
    requestAnimationFrame(rafCallback);
  }
}

export function mouseUpHandler(e) {
  // reset tab settings without resetting tabMoved;
  if (tabContainer.content.mouseDown) {
    tabContainer.content.mouseDown = false;
    tabContainer.content.tabToMove = -1;
    tabContainer.content.clickX = undefined;

    drawOnContainer(tabContainer);
    drawOnContainer(gridContainer);
    drawOnContainer(selectorContainer);
    requestAnimationFrame(rafCallback);
  }
}

export function mouseClickHandler(e) {
  const container = this.getBoundingClientRect();
  const x = e.clientX - container.left;
  const y = e.clientY - container.top;

  if (tabContainer.isOnCanvas(x, y)) {
    tabContainer.content.clickX = x;
  }
}

export function mouseDblClickHandler(e) {
  const container = this.getBoundingClientRect();
  const x = e.clientX - container.left;
  const y = e.clientY - container.top;

  //clear trades
  document.dispatchEvent(clearTradesEvent);
  requestAnimationFrame(rafCallback);
}

export function websocketDrawEventHandler(e) {
  requestAnimationFrame(rafCallback);
}

function rafCallback(t) {
  if (previousTimestamp < t) {
    //render only on latest t
    drawOnContainer(dataContainer, adjustedCanvasTabBottom);
    drawOnContainer(visContainer, adjustedCanvasTabBottom);
  }
  previousTimestamp = t;
}
