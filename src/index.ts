import { Hono } from 'hono'
import index from '@/src/routes/index'
import servers from '@/src/routes/servers'

const app = new Hono()

app.route('/', index)
app.route('/servers', servers)

export default app
