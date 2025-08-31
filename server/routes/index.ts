import { eventHandler } from "h3"

// Learn more: https://nitro.build/guide/routing
export default eventHandler((event) => {
  return `
      <meta charset="utf-8">
      <h1>api.neodb.app</h1>
      <p>by <a href="https://piecelet.app">Piecelet</a></p>
    `;
});
