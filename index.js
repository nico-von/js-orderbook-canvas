// import D3
import { scaleLinear, max } from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// class and function declarations
class OrderFlowCanvas{
    constructor( right, bottom, top, left, canvas){
        this.right = right; //also width
        this.bottom = bottom; //also height
        this.top = top;
        this.left = left;
        this.canvas = canvas;    
        this.ctx = this.canvas.getContext('2d');
        this.init();
    }
    init(){
        this.canvas.width = this.right;
        this.canvas.height = this.bottom;
    }
    redraw() {
        this.ctx.clearRect(0,0,this.right, this.bottom);
        if (this.drawGrid) {
            this.drawGrid();
        } else if (this.draw) {
            this.draw();
        }
    }
}

class CanvasContainer extends OrderFlowCanvas {
    constructor( right, bottom, top, left, canvas, content){
        super(right, bottom, top, left, canvas);
        this.content = content;
    }

    
    initContent() {
        if(!this.content){
            return
        }
        const {width, height} = this.canvas.getBoundingClientRect();
        
        this.content.cellWidth = Math.ceil(width / this.content.gridColumnCount);

        if (this.content instanceof CanvasGridContent) {
            this.content.maxCells = Math.ceil((height / this.content.cellHeight) * 2);
        }
    }

    isOnCanvas(x, y) {
        // set where canvas mouse events are allowed
        return ((x >= this.left) && 
                 (x <= this.left + this.right) && 
                 (y >= this.top + canvasTabBottom) && 
                 (y <= this.top + this.bottom + canvasTabBottom));
    }
    
    // for dynamic scroll
    #updateDynamic(deltaY){
        // calculate next starting cell & max cell
        this.content.startCell += (deltaY / this.content.cellHeight); 
        this.content.maxCells +=  (deltaY / this.content.cellHeight);
        this.content.currentY -= (deltaY);
        
    }

    handleScroll(e){
        this.#updateDynamic(e.deltaY);
        drawOnContainer(this);
    }

}

class CanvasContent extends OrderFlowCanvas {
    constructor( right, bottom, top, left, draw ){
        super(right, bottom, top, left, document.createElement('canvas'));  
        this.draw = draw;     
    }
}

class CanvasGridContent extends CanvasContent {
    constructor( right, bottom, top, left, draw, startingCell, cellHeight, gridColumnCount){
        super(right, bottom, top, left, draw);
        this.startCell = startingCell; // starting cell index to rendering
        this.cellHeight = cellHeight; // cell Height
        this.gridColumnCount = gridColumnCount; // grid column count 
        this.currentY = this.top; // current Y location
    }

    drawGrid() {
        const totalCells = this.maxCells - this.startCell;
        // calculate for endCell
        const endCell = this.startCell + totalCells;
        // start loop
        for (let i = this.startCell; i < endCell; i++) {
            
            let nextY = Math.round(i) + (this.currentY/this.cellHeight);
            
            // optimization only
            const realY = nextY  * this.cellHeight;
            if ((realY) > this.bottom || (realY) < this.top){
                continue;
            }

            // ctx jobs
            this.draw(i, nextY);
        }        
    } 
}

// HELPER FUNCTIONS
// smooth canvases
function smoothifyCanvases(container, content){
            
    let {width, height} = container.canvas.getBoundingClientRect();
    
    // dpr
    const dpr = window.devicePixelRatio;
    
    width = Math.ceil(width * dpr);
    height = Math.ceil(height * dpr);
    
    content.canvas.width = width;
    content.canvas.height = height;
    container.canvas.width = width;
    container.canvas.height = height;
    
    // style
    container.canvas.style.width = `${width/dpr}px`;
    container.canvas.style.height = `${height/dpr}px`;
    
    // scale
    content.ctx.scale(dpr, dpr);
    return {width, height}
}

// draw on container
function drawOnContainer(container, gridOffset){
    if(!gridOffset){
        // if gridOffset is not given we will assume
        // it is in the object
        gridOffset = container.gridOffset;
    } else {
        // if it is given, set it as the gridOffset
        container.gridOffset = gridOffset;
    }
    const { content } = container;
    
    content.redraw();
    container.ctx.clearRect(0, 0, container.canvas.width, container.canvas.height);
    if (content instanceof CanvasGridContent){
        container.ctx.drawImage(content.canvas, 0, gridOffset);
    }
    else if (content instanceof CanvasContent){
        container.ctx.drawImage(content.canvas, 0, 0);
    }
        
}

// draw grid
function drawGridCell(height, width, xOffset, yOffset) {
    // returns rectangle & xOffset
    const x = (xOffset * width);
    const y = (yOffset * height);
    const rectangle = new Path2D();
    rectangle.rect(x, y, width, height);
    return [rectangle, xOffset];
}

// LISTENERS
function wheelHandlerAllContainers(e) {
    const x = e.clientX;
    const y = e.clientY;

    if (dataContainer.isOnCanvas(x, y)){
        e.preventDefault();
        e.stopPropagation();
        gridContainer.handleScroll(e);
        dataContainer.handleScroll(e); 
    }   
};

function mouseMoveHandler(e) {
    const x = e.clientX;
    const y = e.clientY;

    if (gridContainer.isOnCanvas(x, y)){
        gridContainer.content.x = x;
        gridContainer.content.y = y;
        drawOnContainer(gridContainer);
    }
}

// GLOBALS
// Canvas Tab Settings
const data = scaleLinear([0,1000],[0,1000]);
const canvasTabTop = 0;
let canvasTabBottom = 15;
const canvasTabOffset = 4.5;
const tabs = [
    'delta',
    'limit',
    'bid',
    'price',
    'ask',
    'limit',
    'delta',       
]
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
const canvasGrid = document.getElementById('canvasGrid');
const canvasData = document.getElementById('canvasData');
const canvasTabs = document.getElementById('canvasTabs');

// fonts
const tabTextFont = "0.7rem 'Roboto-Mono', monospace"; 

// colours
const gridColourObject = {default: "#000000", a: "#4C4E52", b: "#6F7378"}
const highlightXColourObject = {2: "#00ff00", 4: "#ff0000"}
const highlightYColourObject = "#d3d3d3";
const dataTextColour = "#f0f0f0";
const tabTextColour = "#ffffff";

// lines
const highlightedGridStrokeWidth = 1;
const defaultGridStrokeWidth = 0.05;

// CANVASES

// 1. GRID

// grid container (z-index should be bottom-most)
const gridContainer = new CanvasContainer(
    mainCanvasRight, 
    mainCanvasBottom, 
    mainCanvasTop, 
    mainCanvasLeft, 
    canvasGrid,
    undefined);

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
    gridColumns,
)

// 2. DATA
const dataContainer = new CanvasContainer(
    mainCanvasRight, 
    mainCanvasBottom, 
    mainCanvasTop, 
    mainCanvasLeft, 
    canvasData,
    undefined);

const dataContent = new CanvasGridContent(
    mainCanvasRight,
    mainCanvasBottom * 2, 
    -cellHeight, 
    mainCanvasLeft,
    undefined, 
    gridStartCell, 
    cellHeight,
    gridColumns 
    )

// 3. MAIN TABS
const tabContainer = new CanvasContainer(
    mainCanvasRight,
    canvasTabBottom,
    canvasTabTop,
    mainCanvasLeft,
    canvasTabs,
    undefined,
)
const tabContent = new CanvasContent(
    mainCanvasRight,
    canvasTabBottom,
    canvasTabTop,
    mainCanvasLeft,
    undefined,
)
// Add grid column count for tab offset calculation
tabContent.gridColumnCount = gridColumns;

// DRAW FUNCTIONS
function gridDraw(i, nextY){
    console.log("hello")
    //fill style
    if (Math.round(i) % 2 == 0) {
        this.ctx.fillStyle = gridColourObject.a;
    } else {
        this.ctx.fillStyle = gridColourObject.b;
    }

    let xPosition = 0;
    let yPosition = 0;
    if (this.x && this.y) {
        // get relative X and Y pos
        const relativeX = this.x / this.right;
        // added back canvasTabBottom to compensate offset
        const relativeY = (this.y - this.currentY - canvasTabBottom) / this.bottom;

        // get x & y Position of selected cell 
        xPosition = Math.floor(relativeX * (this.right / this.cellWidth));
        yPosition = Math.floor(relativeY * (this.bottom/ this.cellHeight));
    }
    
    //render grid
    
    for (let j = 0; j < gridColumns; j++){
        // stroke reset
        this.ctx.strokeStyle = gridColourObject.default;
        
        // create row grid
        const grid = drawGridCell(this.cellHeight, this.cellWidth, j, nextY);
        // > FILL
        this.ctx.lineWidth = defaultGridStrokeWidth;
        
        const withinY = yPosition == Math.round(i);
        const withinX = xPosition == grid[1];
        

        if ( withinY ){
            this.ctx.fillStyle = highlightYColourObject;
        }
        this.ctx.fill(grid[0]);

        // > STROKE
        // except price grid
        if (withinX && withinY && grid[1] != priceColumn)
        {
            this.ctx.lineWidth = highlightedGridStrokeWidth;
            this.ctx.strokeStyle = highlightXColourObject[grid[1]];
        }
        this.ctx.stroke(grid[0]);
    }
}

function dataDraw(i, nextY){
    this.ctx.fillStyle = dataTextColour;
    this.ctx.fillText(Math.round(i), priceColumn * this.cellWidth, (nextY * this.cellHeight) + 16);
};

function tabDraw(){
    for(let i = 0; i < gridColumns; i++)
    {
        this.ctx.font = tabTextFont;
        this.ctx.fillStyle = tabTextColour; 
        this.ctx.fillText(
            tabs[i].toUpperCase(), // text
            (i * this.cellWidth) + canvasTabOffset, //x
            this.bottom - (this.bottom / 4)); //y
    }
}

gridContent.draw = gridDraw;
dataContent.draw = dataDraw;
tabContent.draw = tabDraw;

window.onload = function() {

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
    dataContainer.canvas.addEventListener('wheel', wheelHandlerAllContainers);
    dataContainer.canvas.addEventListener('mousemove', mouseMoveHandler);
}