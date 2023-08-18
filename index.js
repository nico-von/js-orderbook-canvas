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
            if (this.draw) {
                this.draw();
            }
        }
    }
    class CanvasContainer extends OrderFlowCanvas {
        constructor( right, bottom, top, left, canvas, isScrollable, content){
            super(right, bottom, top, left, canvas); 
            this.isScrollable = isScrollable;
            this.content = content;
            this.init();    
            this.addListeners();      
        }
        // for checking if mouse is above canvas
        // will only checking Y
        isOnCanvas(y) {
            return (y >= this.top && y <= this.top + this.bottom);
        }
        
        #update(deltaY){
            if(this.content.bottom > this.bottom) {
                this.content.top -= deltaY;
                if (this.content.top < this.bottom - this.content.bottom) {
                    this.content.top = this.bottom - this.content.bottom;
                } else if (this.content.top > 0) {
                    this.content.top = 0;
                }
            }
        }
        #handleScroll(e){
            console.log('hi')
            // const rect = this.getBoundingClient();
            const posY = e.clientY; //- rect.top;
            if (this.isOnCanvas(posY)){
                e.preventDefault();
                e.stopPropagation();
                this.#update(e.deltaY);
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

    // DRAW FUNCTION
    function drawOnContainer(container, content){
        container.ctx.clearRect(0, 0, container.right, container.bottom);
        container.ctx.drawImage(content.canvas, content.left, content.top);    
    }

    // ACTUAL CODE
    container = new CanvasContainer(500, 500, 0, 0, document.getElementById('canvasGrid'), true, undefined);
    
    content = new CanvasContent(container.right, container.bottom * 2, 0, 0, function(){
        this.ctx.fillStyle = ("#ffffff");
        this.ctx.fillRect(this.top, this.left, this.right, this.bottom);
        this.ctx.fillStyle = ("#000000");
        this.ctx.fillText("hello, world", 20, 500);
    })
    container.content = content;

    drawOnContainer(container, container.content);
    

    
    
}
