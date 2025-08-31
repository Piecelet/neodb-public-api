import { eventHandler, createError } from "h3"
import { readFileSync } from "fs"
import { join } from "path"

export default eventHandler((event) => {
  try {
    // Read the schema.json file
    const schemaPath = join(process.cwd(), "data", "servers", "schema.json")
    const schemaContent = readFileSync(schemaPath, "utf-8")
    
    // Parse and compress JSON (remove unnecessary whitespace)
    const schemaData = JSON.parse(schemaContent)
    const compressedJson = JSON.stringify(schemaData)
    
    // Set the content type to application/json
    event.node.res.setHeader("Content-Type", "application/json")
    
    // Return the compressed JSON content
    return compressedJson
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Unable to read schema.json file"
    })
  }
})
