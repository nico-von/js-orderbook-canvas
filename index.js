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
            if (this.draw) {
                this.draw();
            }
        }
    }
    class CanvasContainer extends OrderFlowCanvas {
        constructor( right, bottom, top, left, canvas, isScrollable, isDynamic, content){
            super(right, bottom, top, left, canvas); 
            this.isScrollable = isScrollable;
            this.isDynamic = isDynamic;
            this.content = content;
            this.init();    
            this.addListeners();      
        }
        // for checking if mouse is above canvas
        // will only be checking Y
        isOnCanvas(y) {
            return (y >= this.top && y <= this.top + this.bottom);
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
            const nextStartCell = this.content.startCell + (deltaY / this.content.cellHeight); 
            const nextMaxCells = this.content.maxCells +  (deltaY / this.content.cellHeight);
            const nextY = this.content.currentY - (deltaY);

            // apply if startCell is not near END
            if (nextStartCell >= 0) {
                this.content.startCell = nextStartCell;
                this.content.maxCells = nextMaxCells;
                this.content.currentY = nextY;
                // re-initialise
                this.content.init();
            }
            
        }

        #handleScroll(e){
            const posY = e.clientY; 
            if (this.isOnCanvas(posY)){
                e.preventDefault();
                e.stopPropagation();
                if (this.isDynamic){
                    this.#updateDynamic(e.deltaY);
                } else {
                    this.#updateStatic(e.deltaY);
                }
                
                drawOnContainer(this, this.content);
            }
        } 

        addListeners() {
            // add scrollable listener
            if (this.isScrollable){
                this.canvas.addEventListener('wheel', this.#handleScroll.bind(this));
            }
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
        constructor( right, bottom, top, left, startCell, maxCells, cellHeight, cellWidth, draw ){
            super(right, bottom, top, left, document.createElement('canvas'));
            this.startCell = startCell; // starting cell index to rendering 
            this.maxCells = maxCells; // maximum cell index to render
            this.cellHeight = cellHeight; // cell Height
            this.cellWidth = cellWidth; // cell Width
            this.draw = draw; // draw Function
            this.currentY = this.top; // current Y location
            this.init();     
        }
    }

    // HELPER FUNCTIONS

    // draw on container
    function drawOnContainer(container, content){
        container.ctx.clearRect(0, 0, container.right, container.bottom);
        container.ctx.drawImage(content.canvas, content.left, content.top);    
    }

    // draw grid
    function drawGridCell(height, width, xOffset, yOffset) {
        const x = (xOffset * width);
        const y = (yOffset * height);
        const rectangle = new Path2D();
        rectangle.rect(x, y, width, height);
        return rectangle;
    }

    // ACTUAL CODE
    
    // data
    // use d3 to make a quick linear scale that envelops the domain
    // this shall hold the data for the buckets of price for the orderbook
    const data = scaleLinear([0,1000],[0,1000]);
    
    // initialise global cellHeight and cellWidth
    const cellHeight = 27; 
    const cellWidth = 100;
    

    // GRID
    // grid container (z-index should be bottom-most)
    const gridContainer = new CanvasContainer(500, 500, 0, 0, document.getElementById('canvasGrid'), true, true, undefined);
    
    // grid content
    const gridContent = new CanvasGridContent(
        gridContainer.right, // the right of gridContent(X2)
        gridContainer.bottom * 2, // the bottom of gridContent(Y2) 
                                  // **Needs to have off-canvas padding to perform 
                                  // behind the scenes manipulation such as adding of 
                                  // grid cells for a beautiful scroll effect!
        - cellHeight, // the top or Y1 **Also needs padding for similar reasons
        0, // the left or starting X1
        0, // startingCell
        (gridContainer.bottom / cellHeight) * 2, // maximumCell 
                                                 // **Multiplied by 2 to fill 
                                                 // the padding set above 
        cellHeight, // cell height
        cellWidth, // cell width
        function(){
            // grid content draw

            // background fill 
            this.ctx.fillStyle = ("#ffffff");
            this.ctx.fillRect(this.top, this.left, this.right, this.bottom);
            
            // Draw Calculation 
            // (totalCells should remain consistent for performance purposes)
            const totalCells = this.maxCells - this.startCell;
            // calculate for endCell
            const endCell = this.startCell + totalCells;

            // start loop
            for (let i = this.startCell; i < endCell; i++) {


                this.ctx.fillStyle = ("#ff0000");
                // Y will change according to cell index adjusted with deltaY
                let nextY = Math.round(i) + (this.currentY/this.cellHeight);
                
                // optimization only
                const realY = nextY  * this.cellHeight;
                if ((realY) > this.bottom || (realY) < this.top){
                    continue;
                }

                // ctx jobs
                const rectangle = drawGridCell(this.cellHeight, this.cellWidth, 1, nextY)
                const rectangle2 = drawGridCell(this.cellHeight, this.cellWidth, 2, nextY)
                this.ctx.stroke(rectangle);
                this.ctx.stroke(rectangle2);
                this.ctx.fillText(Math.round(i), 75, (nextY * this.cellHeight) + 16);
            }
        })
    // set grid Content
    gridContainer.content = gridContent;

    // first draw
    drawOnContainer(gridContainer, gridContainer.content);
    
}
