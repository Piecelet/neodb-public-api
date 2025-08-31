import { eventHandler, setHeader } from "h3"
// Import JSON data at build time (works with Cloudflare Workers)
import serversData from "../../data/servers/servers.json"

export default eventHandler((event) => {
  // Set proper content type with UTF-8 charset for Chinese characters
  setHeader(event, "Content-Type", "application/json; charset=utf-8")
  
  // Return the servers data directly
  return serversData
})
