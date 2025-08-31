import { eventHandler, setHeader } from "h3"

// Learn more: https://nitro.build/guide/routing
export default eventHandler((event) => {
  // Set proper content type for HTML with UTF-8 charset
  setHeader(event, "Content-Type", "text/html; charset=utf-8")
  
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>NeoDB API</title>
    </head>
    <body>
      <h1>api.neodb.app</h1>
      <p>by lcandy2, founder of <a href="https://piecelet.app">Piecelet for NeoDB</a></p>
      <h2>Available Endpoints:</h2>
      <ul>
        <li><a href="/servers">GET /servers</a> - NeoDB server instances data</li>
        <li><a href="/servers/schema">GET /servers/schema</a> - NeoDB server data schema</li>
      </ul>
    </body>
    </html>`;
});
