# js-orderbook-canvas
This is a CS50 final project codebase.

#### Video Demo:  <URL HERE>

#### Description:

##### Vanilla HTML5
For the CS50 final project, this codebase is dedicated to maintaining CS50's low-level spirit with a vanilla HTML project. It presents a live orderbook webapp created using JavaScript and canvas. To provide a brief introduction to an orderbook visualisation, traders often employ it to visualise orders, trades, and liquidity.

##### Features

1. Live Level 2 Data: I've utilized Binance data, as it is freely available. Please note that other providers, especially for futures and stocks, may require a paid subscription.
2. Unlimited Scrolling: You can access all available data for various prices, as long as the API provides it.
3. Adjustable tickSize (granularity): You have the flexibility to choose your preferred granularity, provided it doesn't exceed the minimum granularity (refer to 'tickSize' in settings.js).
4. Session Volume Profile: This feature illustrates all traded volumes from the beginning of the session to the current time.
5. Client Volume Profile: Similar To SVP but is reset as per your request. You can do this by double-clicking on any part of the orderbook.
6. Volume delta: This aspect visually represents buying and selling pressure.
7. Market trades: can also be reset by double-clicking on any part of the canvas.
8. Bar sizes: are relative to the largest bar of the same type, ensuring an accurate scale.
9. Adjustable tab sizes.
10. High-Definition Canvas. 

Please note that all colors and additional settings can be found in settings.js. See the 'Project Limitations' section for more details.

##### Project Limitations

This project exclusively focuses on the order book and does not include editable settings on the user interface for altering instruments, canvas height, colors, etc. However, settings.js contains all the variables required to customize the order book.

##### Background and Technology

###### Canvas

Initially, I contemplated using SVG (with D3.js). However, after inspecting other web applications with similar purposes, such as stock trading, it became evident that canvas, rather than SVG, is the preferred choice. Despite having no prior knowledge of canvas, this final project became an opportunity for me to learn something new, primarily relying on MDN documentation.

Additionally, I should mention that while this is a primarily vanilla HTML and JavaScript project, there is an exception. I employed D3's linearScale function for price scale calculations, making it more manageable.

###### Performance

Regarding the order book visualisation's performance, it involves intensive client-side calculations, which are typically better suited for backend processing. To address this, I utilized web workers to alleviate the client's load. I also used multiple canvases, each serving as a layer of the complete order book, and implemented requestAnimationFrame() for rendering frequently updated canvases. However, please be aware that lag may still occur, especially during highly volatile periods. The performance is also influenced by the canvas size, as rendering depends on the number of order book rows.

> Seek, and you shall find.