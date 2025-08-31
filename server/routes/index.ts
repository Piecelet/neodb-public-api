import { eventHandler } from "h3"

// Learn more: https://nitro.build/guide/routing
export default eventHandler((event) => {
  return `
      <meta charset="utf-8">
      <h1>api.neodb.app</h1>
      <p>by lcandy2, founder of <a href="https://piecelet.app">Piecelet for NeoDB</a></p>
      <h2>Available Endpoints:</h2>
      <ul>
        <li><a href="/servers">GET /servers</a> - NeoDB server instances data</li>
        <li><a href="/servers/schema">GET /servers/schema</a> - NeoDB server data schema</li>
      </ul>
    `;
});
