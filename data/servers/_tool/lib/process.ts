import type { ServerInfo } from '../types'
import { fetchHomepageDescription, fetchInstanceInfo } from './net'
import { capitalizeDescription, mapInstanceToServerInfo } from './transform'
import { extractDomain } from './parse'
import { createPlaceholderServerInfo } from './util'

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function processServerList(urls: string[], concurrency = 6): Promise<ServerInfo[]> {
  const results: ServerInfo[] = []
  let index = 0

  const worker = async (id: number) => {
    while (true) {
      const current = index++
      if (current >= urls.length) break

      const url = urls[current]
      const domain = extractDomain(url)
      if (!domain) {
        console.warn(`[w${id}] Skipping invalid URL: ${url}`)
        continue
      }

      console.log(`\n[w${id}] Processing ${current + 1}/${urls.length}: ${domain}`)
      const instanceData = await fetchInstanceInfo(domain)

      if (instanceData) {
        let description = instanceData.description || ''
        if (!description.trim()) {
          console.log(`[w${id}]   API description is empty, fetching from homepage...`)
          description = await fetchHomepageDescription(domain)
        }
        description = capitalizeDescription(description)

        const enhanced = { ...instanceData, description }
        const info = mapInstanceToServerInfo(enhanced, domain)
        results.push(info)
        console.log(`[w${id}] ✓ Processed ${domain} successfully`)
      } else {
        console.log(`[w${id}]   API failed, attempting to fetch description from homepage...`)
        let homepageDescription = await fetchHomepageDescription(domain)
        homepageDescription = capitalizeDescription(homepageDescription)
        const placeholder = createPlaceholderServerInfo(domain)
        placeholder.description = homepageDescription
        results.push(placeholder)
        console.warn(`[w${id}] ✗ Created placeholder for ${domain} due to errors`)
      }

      await sleep(Math.floor(Math.random() * 250))
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, (_, i) => worker(i + 1))
  await Promise.all(workers)
  return results
}

