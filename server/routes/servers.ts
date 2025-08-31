import { eventHandler, setHeader } from "h3"
// Import JSON data at build time (works with Cloudflare Workers)
import serversData from "../../data/servers/servers.json"

export default eventHandler((event) => {
  // Set the content type to application/json
  setHeader(event, "Content-Type", "application/json")
  
  // Return the compressed JSON content
  return JSON.stringify(serversData)
})
