import { Hono } from 'hono'
import serversData from '@/data/servers/servers.json'
import schemaData from '@/data/servers/schema.json'

const servers = new Hono()

servers.get('/', (c) => {
  c.header('Content-Type', 'application/json; charset=utf-8')
  return c.json(serversData)
})

servers.get('/schema', (c) => {
  c.header('Content-Type', 'application/json; charset=utf-8')
  return c.json(schemaData)
})

export default servers

