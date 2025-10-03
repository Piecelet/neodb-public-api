import { Hono } from 'hono'
import { swaggerUI } from '@hono/swagger-ui'
import servers from '@/src/routes/servers'

const app = new Hono()

// Swagger UI at root; spec is served as a static asset by Cloudflare
app.get('/', swaggerUI({ url: '/openapi.json' }))
app.route('/servers', servers)

export default app
