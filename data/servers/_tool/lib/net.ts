import type { Instance } from '../types'
import { extractMetaDescription, extractIconHref } from './parse'

export async function fetchHomepageDescription(domain: string): Promise<string> {
  try {
    const base = new URL(`https://${domain}`)
    const homeUrl = new URL('/', base)
    console.log(`  Fetching homepage description: ${homeUrl.toString()}`)

    const response = await fetch(homeUrl.toString(), {
      headers: {
        'User-Agent': 'NeoDB-Instance-Fetcher/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    const description = extractMetaDescription(html)

    if (description) {
      console.log(`  ✓ Found description from homepage: "${description.substring(0, 50)}..."`)
      return description
    } else {
      console.log(`  ✗ No description found in homepage meta tags`)
      return ''
    }
  } catch (error) {
    console.warn(`  ✗ Failed to fetch homepage description for ${domain}:`, error)
    return ''
  }
}

export async function fetchInstanceInfo(domain: string): Promise<Instance | null> {
  try {
    const apiUrl = new URL('/api/v2/instance', `https://${domain}`)
    console.log(`Fetching: ${apiUrl.toString()}`)

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'User-Agent': 'NeoDB-Instance-Fetcher/1.0',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = (await response.json()) as Instance
    console.log(`✓ Successfully fetched info for ${domain}`)
    return data
  } catch (error) {
    console.error(`✗ Failed to fetch info for ${domain}:`, error)
    return null
  }
}

export async function fetchHomepageIcon(domain: string): Promise<string> {
  try {
    const base = new URL(`https://${domain}`)
    const homeUrl = new URL('/', base)
    console.log(`  Fetching homepage for icon: ${homeUrl.toString()}`)

    const response = await fetch(homeUrl.toString(), {
      headers: {
        'User-Agent': 'NeoDB-Instance-Fetcher/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    const href = extractIconHref(html)
    if (href) {
      console.log(`  ✓ Found icon href in homepage`)
      return href
    }
    console.log(`  ✗ No <link rel=icon> found`)
    return ''
  } catch (error) {
    console.warn(`  ✗ Failed to fetch homepage icon for ${domain}:`, error)
    return ''
  }
}
