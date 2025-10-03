import { Hono } from 'hono'
import serversData from '@/data/servers/servers.json'
import serversOfficialData from '@/data/servers/servers-official.json'
import serversCommunityData from '@/data/servers/servers-community.json'
import schemaData from '@/data/servers/schema.json'

const servers = new Hono()

servers.get('/', (c) => {
  c.header('Content-Type', 'application/json; charset=utf-8')
  return c.json(serversData)
})

servers.get('/official', (c) => {
  c.header('Content-Type', 'application/json; charset=utf-8')
  return c.json(serversOfficialData)
})

servers.get('/community', (c) => {
  c.header('Content-Type', 'application/json; charset=utf-8')
  return c.json(serversCommunityData)
})

servers.get('/schema', (c) => {
  c.header('Content-Type', 'application/json; charset=utf-8')
  return c.json(schemaData)
})

export default servers

