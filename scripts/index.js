import { initialiseTicker } from "./data/data.js";
import {
  gridContainer,
  gridContent,
  dataContainer,
  dataContent,
  tabContainer,
  tabContent,
  selectorContainer,
  selectorContent,
  visContainer,
  visContent,
} from "./canvas/canvasContainers.js";
import {
  gridDraw,
  selectorDraw,
  dataDraw,
  tabDraw,
  visDraw,
} from "./canvas/canvasDrawFunctions.js";
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
import { drawOnContainer } from "./canvas/canvasFunctions.js";
import { ticker, tickSize, priceColDecimalLength, data } from "./settings.js";

export let adjustedCanvasTabBottom;

//set draw functions
gridContent.draw = gridDraw;
dataContent.draw = dataDraw;
visContent.draw = visDraw;
tabContent.draw = tabDraw;
selectorContent.draw = selectorDraw;
//set children
tabContent.children = [gridContent, dataContent, visContent, selectorContent];

//start ticker
initialiseTicker(ticker, tickSize, priceColDecimalLength, data);

window.onload = function () {
  console.log("HEY");
  // smoothen canvases
  smoothifyCanvases(gridContainer, gridContent);
  smoothifyCanvases(dataContainer, dataContent);
  smoothifyCanvases(visContainer, dataContent);
  smoothifyCanvases(selectorContainer, selectorContent);
  adjustedCanvasTabBottom = smoothifyCanvases(tabContainer, tabContent).height;

  // set contents
  gridContainer.content = gridContent;
  dataContainer.content = dataContent;
  selectorContainer.content = selectorContent;
  tabContainer.content = tabContent;
  visContainer.content = visContent;

  gridContainer.initContent();
  dataContainer.initContent();
  selectorContainer.initContent();
  tabContainer.initContent();
  visContainer.initContent();

  selectorContainer.canvas.addEventListener(
    "wheel",
    wheelHandlerAllContainers,
    {
      passive: false,
    }
  );
  selectorContainer.canvas.addEventListener("mousemove", mouseMoveHandler);
  selectorContainer.canvas.addEventListener("mousedown", mouseDownHandler);
  selectorContainer.canvas.addEventListener("click", mouseClickHandler);
  selectorContainer.canvas.addEventListener("dblclick", mouseDblClickHandler);
  window.addEventListener("mouseup", mouseUpHandler);

  // depth populate
  document.addEventListener("draw", websocketDrawEventHandler);

  //initial draw
  drawOnContainer(selectorContainer, adjustedCanvasTabBottom);
  drawOnContainer(gridContainer, adjustedCanvasTabBottom);
  drawOnContainer(tabContainer, adjustedCanvasTabBottom);
};
