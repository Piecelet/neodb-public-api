import { eventHandler, createError } from "h3"
import { readFileSync } from "fs"
import { join } from "path"

export default eventHandler((event) => {
  try {
    // Read the servers.json file
    const serversPath = join(process.cwd(), "data", "servers", "servers.json")
    const serversContent = readFileSync(serversPath, "utf-8")
    
    // Set the content type to application/json
    event.node.res.setHeader("Content-Type", "application/json")
    
    // Return the JSON content
    return serversContent
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Unable to read servers.json file"
    })
  }
})
