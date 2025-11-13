import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { swaggerUI } from '@hono/swagger-ui'
import servers from '@/src/servers'

const app = new Hono()

// Allow CORS from any origin
app.use('/*', cors({ origin: '*' }))

// Swagger UI at root; spec is served as a static asset by Cloudflare
app.get(
  '/',
  swaggerUI({
    url: '/openapi.json',
    manuallySwaggerUIHtml: (asset) => `
    <title>NeoDB Public API</title>
      <div>
        <div id="swagger-ui"></div>
        ${asset.css.map((url) => `<link rel="stylesheet" href="${url}" />`).join('')}
        ${asset.js.map((url) => `<script src="${url}" crossorigin="anonymous"></script>`).join('')}
        <script>
          window.onload = () => {
            document.title = 'NeoDB Public API';
            window.ui = SwaggerUIBundle({ dom_id: '#swagger-ui', url: '/openapi.json' })
          }
        </script>
      </div>
    `,
  })
)
app.route('/servers', servers)

export default app
