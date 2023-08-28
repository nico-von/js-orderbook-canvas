// import D3
import { scaleLinear, max } from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

window.onload = function() {
    // class and function declarations
    class OrderFlowCanvas{
        constructor( right, bottom, top, left, canvas){
            this.right = right; //also width
            this.bottom = bottom; //also height
            this.top = top;
            this.left = left;
            this.canvas = canvas;    
            this.ctx = this.canvas.getContext('2d');
        }
        init() {
            this.canvas.width = this.right;
            this.canvas.height = this.bottom;
            this.ctx.clearRect(0,0,this.right, this.bottom);
            if (this.drawGrid) {
                this.drawGrid();
            }
        }
    }
    class CanvasContainer extends OrderFlowCanvas {
        constructor( right, bottom, top, left, canvas, isDynamic, content){
            super(right, bottom, top, left, canvas);
            this.isDynamic = isDynamic;
            this.content = content;
            this.init();    
        }
        isOnCanvas(x, y) {
            return ((x >= this.left) && 
                     (x <= this.left + this.right) && 
                     (y >= this.top) && 
                     (y <= this.top + this.bottom));
        }
        
        // for static scroll
        #updateStatic(deltaY){
            if(this.content.bottom > this.bottom) {
                this.content.top -= deltaY;
                if (this.content.top < this.bottom - this.content.bottom) {
                    this.content.top = this.bottom - this.content.bottom;
                } else if (this.content.top > 0) {
                    this.content.top = 0;
                }
            }
        }
        // for dynamic scroll
        #updateDynamic(deltaY){
            // calculate next starting cell & max cell
            this.content.startCell += (deltaY / this.content.cellHeight); 
            this.content.maxCells +=  (deltaY / this.content.cellHeight);
            this.content.currentY -= (deltaY);
            this.content.deltaY = deltaY;
            // re-initialise
            this.content.init();
            
            
        }

        handleScroll(e){
            if (this.isDynamic){
                this.#updateDynamic(e.deltaY);
            } else {
                this.#updateStatic(e.deltaY);
            }
            drawOnContainer(this, this.content);
        }

    }
    class CanvasContent extends OrderFlowCanvas {
        constructor( right, bottom, top, left, draw ){
            super(right, bottom, top, left, document.createElement('canvas'));  
            this.draw = draw;     
            this.init();     
        }
    }
    class CanvasGridContent extends OrderFlowCanvas {
        constructor( right, bottom, top, left, startCell, maxCells, cellHeight, cellWidth, draw){
            super(right, bottom, top, left, document.createElement('canvas'));
            this.startCell = startCell; // starting cell index to rendering 
            this.maxCells = maxCells; // maximum cell index to render
            this.cellHeight = cellHeight; // cell Height
            this.cellWidth = cellWidth; // cell Width
            this.draw = draw; // draw Function
            this.currentY = this.top; // current Y location
            this.deltaY = 0;
            this.init();     
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
            // redraw
            gridContainer.content.init();
            drawOnContainer(gridContainer, gridContainer.content);
        }
    }
    // HELPER FUNCTIONS

    // draw on container
    function drawOnContainer(container, content){
        container.ctx.clearRect(0, 0, container.right, container.bottom);
        container.ctx.drawImage(content.canvas, container.left, container.top);    
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

    // ACTUAL CODE
    
    // initialise globals
    const cellHeight = 20; 
    const cellWidth = 100;
    const mainCanvasRight = 500;
    const mainCanvasBottom = 500;
    const mainCanvasLeft = 0;
    const mainCanvasTop = 0;
    const gridStartCell = 0;
    const gridMaxCell = (mainCanvasBottom / cellHeight) * 2; // maximumCell 
                                                             // **Multiplied by 2 to fill 
                                                             // the padding set on grid Content
    
    const canvasGrid = document.getElementById('canvasGrid');
    const canvasData = document.getElementById('canvasData');
    // colours
    const gridColourObject = {default: "#000000", a: "#4C4E52", b: "#6F7378"}
    const highlightXColourObject = {1: "#ffbf00", 3: "#ff0000"}
    const highlightYColourObject = "#d3d3d3";
    
    // lines
    const highlightedGridStrokeWidth = 1;
    const defaultGridStrokeWidth = 0.05;
    // 1. GRID
    // grid container (z-index should be bottom-most)
    const gridContainer = new CanvasContainer(mainCanvasRight, 
        mainCanvasBottom, mainCanvasTop, mainCanvasLeft, canvasGrid, 
        true, undefined);
    
    // grid content
    const gridContent = new CanvasGridContent(
        mainCanvasRight, // the right of gridContent(X2)
        mainCanvasBottom * 2, // the bottom of gridContent(Y2) 
                                  // **Needs to have off-canvas padding to perform 
                                  // behind the scenes manipulation such as adding of 
                                  // grid cells for a beautiful scroll effect!
        - cellHeight, // the top or Y1 **Also needs padding for similar reasons
        mainCanvasLeft, // the left or starting X1
        gridStartCell, // startingCell
        gridMaxCell,  // maxCell
        cellHeight, // cell height
        cellWidth, // cell width
        function(i, nextY){
                //fill style
                this.ctx.strokeStyle = gridColourObject.default;
                if (Math.round(i) % 2 == 0) {
                    this.ctx.fillStyle = gridColourObject.a;
                } else {
                    this.ctx.fillStyle = gridColourObject.b;
                }
                const grids = [
                    drawGridCell(this.cellHeight, this.cellWidth, 1, nextY),
                    drawGridCell(this.cellHeight, this.cellWidth, 2, nextY),
                    drawGridCell(this.cellHeight, this.cellWidth, 3, nextY),
                ]

                let xPosition = 0;
                let yPosition = 0;
                if (this.x && this.y) {
                    // get relative X and Y pos
                    const relativeX = this.x / this.right;
                    const relativeY = (this.y - this.currentY) / this.bottom;
    
                    // get x & y Position of selected cell 
                    xPosition = Math.floor(relativeX * (this.right / this.cellWidth));
                    yPosition = Math.floor(relativeY * (this.bottom/ this.cellHeight));
                }
                //render
                
                for (let grid of grids){
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
                    if (withinX && withinY && grid[1] != 2)
                    {
                        this.ctx.lineWidth = highlightedGridStrokeWidth;
                        this.ctx.strokeStyle = highlightXColourObject[grid[1]];
                    }
                    this.ctx.stroke(grid[0]);
                }
                
            
        })

    // 2. DATA
    //
    // use d3 to make a quick linear scale that envelops the domain
    // this shall hold the data for the buckets of price for the orderbook
    const data = scaleLinear([0,1000],[0,1000]);
    const dataContainer = new CanvasContainer(mainCanvasRight, 
        mainCanvasBottom, mainCanvasTop, mainCanvasLeft, canvasData, 
        true, undefined);
    
    const dataContent = new CanvasGridContent(mainCanvasRight,
        mainCanvasBottom * 2, -cellHeight, mainCanvasLeft, 
        gridStartCell, gridMaxCell, cellHeight, cellWidth, function(i, nextY){

            this.ctx.fillStyle = ("#000000");
            this.ctx.fillText(Math.round(i), 2 * this.cellWidth, (nextY * this.cellHeight) + 16);
        })
    
    // 5. SET CONTENTS
    gridContainer.content = gridContent;
    dataContainer.content = dataContent;

    // 6. DRAW
    drawOnContainer(gridContainer, gridContainer.content);
    drawOnContainer(dataContainer, dataContainer.content);
        
    // 7. EVENT LISTENERS
    // this was originally a method in the container
    // but decided to take it out for much easier readability 
    dataContainer.canvas.addEventListener('wheel', wheelHandlerAllContainers);
    dataContainer.canvas.addEventListener('mousemove', mouseMoveHandler);

}
