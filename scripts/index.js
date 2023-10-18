import { initialiseTicker } from "./data/data.js";
import {
  gridContainer,
  gridContent,
  dataContainer,
  dataContent,
  tabContainer,
  tabContent,
  selectorContainer,
  selectorContent
} from "./canvas/canvasContainers.js";
import { gridDraw, selectorDraw, dataDraw, tabDraw } from "./canvas/canvasDrawFunctions.js";
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
selectorContent.draw = selectorDraw;
//set children
tabContent.children = [gridContent, dataContent, selectorContent];

//start ticker
initialiseTicker(ticker, tickSize, priceColDecimalLength, data);

window.onload = function () {
  console.log("HEY");
  // smoothen canvases
  smoothifyCanvases(gridContainer, gridContent);
  smoothifyCanvases(dataContainer, dataContent);
  smoothifyCanvases(selectorContainer, selectorContent);
  adjustedCanvasTabBottom = smoothifyCanvases(tabContainer, tabContent).height;

  // set contents
  gridContainer.content = gridContent;
  dataContainer.content = dataContent;
  selectorContainer.content = selectorContent;
  tabContainer.content = tabContent;
  
  gridContainer.initContent();
  dataContainer.initContent();
  selectorContainer.initContent();
  tabContainer.initContent();

  selectorContainer.canvas.addEventListener("wheel", wheelHandlerAllContainers, {
    passive: false,
  });
  selectorContainer.canvas.addEventListener("mousemove", mouseMoveHandler);
  selectorContainer.canvas.addEventListener("mousedown", mouseDownHandler);
  selectorContainer.canvas.addEventListener("click", mouseClickHandler);
  selectorContainer.canvas.addEventListener("dblclick", mouseDblClickHandler);
  window.addEventListener("mouseup", mouseUpHandler);

  // initial draw - only on first depth populate
  document.addEventListener("draw", websocketDrawEventHandler);
};
