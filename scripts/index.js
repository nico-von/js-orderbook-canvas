import { initialiseTicker } from "./data/data.js";
import {
  gridContainer,
  gridContent,
  dataContainer,
  dataContent,
  tabContainer,
  tabContent,
} from "./canvas/canvasContainers.js";
import { gridDraw, dataDraw, tabDraw } from "./canvas/canvasDrawFunctions.js";
import { smoothifyCanvases } from "./canvas/canvasFunctions.js";
import {
  mouseMoveHandler,
  mouseDownHandler,
  mouseClickHandler,
  mouseDblClickHandler,
  mouseUpHandler,
  wheelHandlerAllContainers,
  websocketDrawEventHandler,
} from "./canvas/canvasListeners.js";
import { ticker, tickSize, priceColDecimalLength, data } from "./settings.js";

export let adjustedCanvasTabBottom;

//set draw functions
gridContent.draw = gridDraw;
dataContent.draw = dataDraw;
tabContent.draw = tabDraw;

//set children
tabContent.children = [gridContent, dataContent];

//start ticker
initialiseTicker(ticker, tickSize, priceColDecimalLength, data);

window.onload = function () {
  console.log("HEY");
  // smoothen canvases
  smoothifyCanvases(gridContainer, gridContent);
  smoothifyCanvases(dataContainer, dataContent);
  adjustedCanvasTabBottom = smoothifyCanvases(tabContainer, tabContent).height;

  // set contents
  gridContainer.content = gridContent;
  dataContainer.content = dataContent;
  tabContainer.content = tabContent;

  gridContainer.initContent();
  dataContainer.initContent();
  tabContainer.initContent();

  dataContainer.canvas.addEventListener("wheel", wheelHandlerAllContainers, {
    passive: false,
  });
  dataContainer.canvas.addEventListener("mousemove", mouseMoveHandler);
  dataContainer.canvas.addEventListener("mousedown", mouseDownHandler);
  dataContainer.canvas.addEventListener("click", mouseClickHandler);
  dataContainer.canvas.addEventListener("dblclick", mouseDblClickHandler);
  window.addEventListener("mouseup", mouseUpHandler);

  // initial draw - only on first depth populate
  document.addEventListener("draw", websocketDrawEventHandler);
};
