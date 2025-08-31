import { eventHandler, setHeader } from "h3"
// Import JSON data at build time (works with Cloudflare Workers)
import schemaData from "../../../data/servers/schema.json"

export default eventHandler((event) => {
  // Set proper content type with UTF-8 charset
  setHeader(event, "Content-Type", "application/json; charset=utf-8")
  
  // Return the schema data
  return schemaData
})
