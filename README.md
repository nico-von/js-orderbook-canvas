# js-orderbook-canvas
This is a CS50 final project codebase.

#### Video Demo:  <URL HERE>

#### Description:

##### Vanilla HTML
For CS50 final project purposes - primarily to maintain CS50's low-level spirit, this is a vanilla html project. This is a live orderbook webapp written with js and canvas. A little introduction about the project - an orderbook is often used by trades to visualise orders, trades and liquidity.

##### Features
1. Live Level 2 Data (I used Binance data because it is free, other providers, especially for futures and stocks are all behind a paywall.)
2. Unlimited Scrolling, you can view all available data of all prices (so long as provided by the api). 
3. Adjustable tickSize(granularity), you can use any granularity you want, so long as it doesn't go beyond the least granularity (see tickSize on settings.js)
4. Session Volume Profile which depicts all traded volume from session start to current time.
5. Client Volume Profile which can be reset by double-clicking on any part of the canvas.
6. Volume delta which depicts buying and selling pressure.
7. Market trades can also be reset by double-clicking any part of the canvas. 
8. Bar sizes are all relative to the largest bar of the same type to display scale.
9. Adjustable tab sizes. 
10. HD Canvas

Note: All colours and other settings may be found from the settings.js, see *Project Limitations* for more information.

##### GIF

##### Project Limitations
This project only showcases the orderbook, I have not placed editable settings on the UI for changing the instrument, height of the canvas, colours, etc. However, settings.js contains all of the variables that enables dynamism.  

##### Background and Technology

###### Canvas
At first I thought of using SVG (with D3js), however, upon inspecting other webapps for similar purposes (stock trading and the like) it appears that, instead of SVG, they utilise canvas. Without any knowledge with canvas, therefore, this final-project was not just be a reiteration of things I have previously learned from this course, but that It was also a challenge for myself to learn something new of which I mostly utilised MDN documentation for it. 

Additionally, I may have mentioned that this is purely a vanilla html & js project, however, there is an exception with regards to this. I used d3's linearScale function for my price scale calculation for ease. 

###### Performance
With regards to the performance of the orderbook, it uses heavy calculations on the client side which, I think, is best done from the backend. As a workaround, I utilised web workers for reducing the load on the client. Additionally, I used multiple canvases, each being a layer of the entire orderbook and requestAnimationFrame() for rendering frequently updated canvases. However, lag may still persist especially during highly volatile times. Performance is also dependent on the size of the canvas as rendering greatly relies on the count of the rows of the orderbook.



> Seek and ye shall find.